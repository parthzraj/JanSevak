from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.issue import CivicIssue, IssueComment, IssueVote
from app.models.user import User
from app.routers.issues import comment_to_response, get_issue_or_404
from app.schemas.issue import CommentCreate, CommentResponse
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
