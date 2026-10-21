from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.issue import CivicIssue, IssueComment, IssueEvidence, IssueVote
from app.models.user import User
from app.routers.issues import comment_to_response, get_issue_or_404
from app.routers.uploads import delete_uploaded, save_image
from app.schemas.issue import (
    CommentCreate,
    CommentResponse,
    EvidenceAddedResponse,
    EvidenceItem,
    SupporterItem,
    SupportersResponse,
)
from app.services.image_check import HASH_DISTANCE_LIMIT, hash_distance
from app.services.notifications import notify
from app.services.points_engine import award_points, revert_award

router = APIRouter(prefix="/issues", tags=["Votes & Comments"])


def _vote_result(issue: CivicIssue, user: User, has_upvoted: bool, points_delta: int) -> dict:
    return {
        "issue_id": issue.id,
        "upvotes": issue.upvotes,
        "has_upvoted": has_upvoted,
        "points_delta": points_delta,
        "user_points": user.points,
        "user_tier": user.tier,
    }


@router.post("/{issue_id}/upvote")
def upvote(issue_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = get_issue_or_404(db, issue_id)

    if issue.reporter_id == user.id:
        raise HTTPException(status_code=403, detail="You cannot upvote your own report")

    if db.scalar(select(IssueVote.id).where(IssueVote.issue_id == issue_id, IssueVote.user_id == user.id)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already upvoted this issue")

    try:
        db.add(IssueVote(issue_id=issue_id, user_id=user.id))
        db.flush()  # the unique constraint is the real guard against double-clicks / races
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already upvoted this issue")

    # atomic increment (no read-modify-write race between two voters)
    db.execute(update(CivicIssue).where(CivicIssue.id == issue_id).values(upvotes=CivicIssue.upvotes + 1))
    result = award_points(db, user, "upvote", issue_id, description=f"Upvoted: {issue.title[:60]}")
    user.supported_count = (user.supported_count or 0) + 1
    notify(db, issue.reporter_id, "New upvote", f"{user.name} confirmed your report '{issue.title}'.", "upvote")

    db.commit()
    db.refresh(issue)
    db.refresh(user)
    return _vote_result(issue, user, True, result.awarded)


@router.delete("/{issue_id}/upvote")
def remove_upvote(issue_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = get_issue_or_404(db, issue_id)

    vote = db.scalar(select(IssueVote).where(IssueVote.issue_id == issue_id, IssueVote.user_id == user.id))
    if vote is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You have not upvoted this issue")

    db.delete(vote)
    db.execute(
        update(CivicIssue)
        .where(CivicIssue.id == issue_id, CivicIssue.upvotes > 0)
        .values(upvotes=CivicIssue.upvotes - 1)
    )
    removed = revert_award(db, user, "upvote", issue_id, description=f"Upvote withdrawn: {issue.title[:50]}")
    user.supported_count = max(0, (user.supported_count or 0) - 1)

    db.commit()
    db.refresh(issue)
    db.refresh(user)
    return _vote_result(issue, user, False, -removed)


@router.post("/{issue_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    issue_id: int,
    body: CommentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    issue = get_issue_or_404(db, issue_id)
    comment = IssueComment(
        issue_id=issue_id,
        user_id=user.id,
        text=body.text,
        is_official=user.role in ("official", "admin"),
    )
    db.add(comment)
    if issue.reporter_id != user.id:
        notify(db, issue.reporter_id, "New comment", f"{user.name} commented on '{issue.title}'.", "comment")
    db.commit()
    db.refresh(comment)
    return comment_to_response(comment)


@router.get("/{issue_id}/comments", response_model=list[CommentResponse])
def list_comments(issue_id: int, db: Session = Depends(get_db)):
    issue = get_issue_or_404(db, issue_id)
    return [comment_to_response(c) for c in issue.comments]


# ---------------------------------------------------------------------------------------
# Supporters (who upvoted) and photo evidence added to an existing issue
# ---------------------------------------------------------------------------------------
MAX_FILES_PER_REQUEST = 3
MAX_EVIDENCE_PER_USER_PER_ISSUE = 5
MAX_EVIDENCE_PER_ISSUE = 20


@router.get("/{issue_id}/supporters", response_model=SupportersResponse)
def list_supporters(
    issue_id: int,
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Citizens who upvoted this issue, newest first."""
    get_issue_or_404(db, issue_id)
    total = db.scalar(select(func.count()).select_from(IssueVote).where(IssueVote.issue_id == issue_id)) or 0
    rows = db.execute(
        select(IssueVote, User)
        .join(User, User.id == IssueVote.user_id)
        .where(IssueVote.issue_id == issue_id)
        .order_by(IssueVote.created_at.desc(), IssueVote.id.desc())
        .limit(limit)
    ).all()
    return SupportersResponse(
        total=total,
        items=[
            SupporterItem(
                user_id=u.id, name=u.name, avatar_url=u.avatar_url, ward=u.ward, supported_at=v.created_at
            )
            for v, u in rows
        ],
    )


@router.post("/{issue_id}/evidence", response_model=EvidenceAddedResponse, status_code=status.HTTP_201_CREATED)
async def add_evidence(
    issue_id: int,
    files: list[UploadFile] = File(..., description="1-3 photos taken at the site"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add on-site photos to an existing issue.

    Anyone logged in can add photos. The first time a citizen adds evidence to someone *else's*
    issue they earn +10 points (once per issue, daily cap applies); the reporter earns nothing
    for adding photos to their own report (no self-verification).
    """
    issue = get_issue_or_404(db, issue_id)
    if not 1 <= len(files) <= MAX_FILES_PER_REQUEST:
        raise HTTPException(status_code=400, detail=f"Send between 1 and {MAX_FILES_PER_REQUEST} photos at a time")

    mine = db.scalar(
        select(func.count()).select_from(IssueEvidence).where(
            IssueEvidence.issue_id == issue_id, IssueEvidence.user_id == user.id
        )
    ) or 0
    total = db.scalar(select(func.count()).select_from(IssueEvidence).where(IssueEvidence.issue_id == issue_id)) or 0
    if mine + len(files) > MAX_EVIDENCE_PER_USER_PER_ISSUE:
        raise HTTPException(
            status_code=409,
            detail=f"You can add at most {MAX_EVIDENCE_PER_USER_PER_ISSUE} photos to one issue",
        )
    if total + len(files) > MAX_EVIDENCE_PER_ISSUE:
        raise HTTPException(status_code=409, detail="This issue already has the maximum number of evidence photos")

    known_hashes = [h for h in db.scalars(select(IssueEvidence.image_hash).where(IssueEvidence.image_hash.is_not(None)))]
    saved: list[tuple[str, str]] = []  # (url, perceptual hash)
    try:
        for f in files:
            url, _, phash = await save_image(f, strict=True)
            saved.append((url, phash))
            if any(hash_distance(phash, h) <= HASH_DISTANCE_LIMIT for h in known_hashes):
                raise HTTPException(
                    status_code=409,
                    detail="This photo has already been used as evidence. Please take a new photo at the site",
                )
            known_hashes.append(phash)

        rows = [IssueEvidence(issue_id=issue_id, user_id=user.id, image_url=url, image_hash=h) for url, h in saved]
        db.add_all(rows)
        db.flush()

        awarded = 0
        if issue.reporter_id != user.id:
            awarded = award_points(
                db, user, "evidence", issue_id, description=f"Photo evidence: {issue.title[:50]}"
            ).awarded
            notify(
                db,
                issue.reporter_id,
                "New evidence photo",
                f"{user.name} added photo evidence to '{issue.title}'.",
                "info",
            )
        db.commit()
    except Exception:
        db.rollback()
        for url, _ in saved:
            delete_uploaded(url)
        raise

    db.refresh(user)
    return EvidenceAddedResponse(
        evidence=[
            EvidenceItem(id=r.id, url=r.image_url, user_id=user.id, author=user.name, created_at=r.created_at)
            for r in rows
        ],
        points_awarded=awarded,
        user_points=user.points,
        user_tier=user.tier,
    )
