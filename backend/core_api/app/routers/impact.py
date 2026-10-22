"""Impact Reels: resolved issues as a live, swipeable feed (likes, saves, comments, shares) and real impact stats."""
import math
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db, utcnow
from app.core.security import get_current_user, get_optional_user
from app.models.issue import CivicIssue, IssueComment, ImpactReaction, ImpactShare
from app.models.user import User
from app.schemas.impact import (
    CategoryCount,
    ImpactReel,
    ImpactReelList,
    ImpactStats,
    ReactionResult,
    ReelCreator,
    ShareBody,
    ShareResult,
)

router = APIRouter(prefix="/impact", tags=["Impact"])


def _resolved_filters():
    return [CivicIssue.status == "Resolved", CivicIssue.deleted_at.is_(None)]


def _days(issue: CivicIssue) -> int:
    end = issue.resolved_at or issue.updated_at
    return max(0, (end - issue.created_at).days)


def _counts(db: Session, ids: list[int], viewer: User | None):
    likes: dict[int, int] = {}
    comments: dict[int, int] = {}
    shares: dict[int, int] = {}
    liked: set[int] = set()
    saved: set[int] = set()
    if not ids:
        return likes, comments, shares, liked, saved
    likes = dict(
        db.execute(
            select(ImpactReaction.issue_id, func.count(ImpactReaction.id))
            .where(ImpactReaction.issue_id.in_(ids), ImpactReaction.kind == "like")
            .group_by(ImpactReaction.issue_id)
        ).all()
    )
    comments = dict(
        db.execute(
            select(IssueComment.issue_id, func.count(IssueComment.id))
            .where(IssueComment.issue_id.in_(ids))
            .group_by(IssueComment.issue_id)
        ).all()
    )
    shares = dict(
        db.execute(
            select(ImpactShare.issue_id, func.count(ImpactShare.id))
            .where(ImpactShare.issue_id.in_(ids))
            .group_by(ImpactShare.issue_id)
        ).all()
    )
    if viewer is not None:
        for issue_id, kind in db.execute(
            select(ImpactReaction.issue_id, ImpactReaction.kind).where(
                ImpactReaction.user_id == viewer.id, ImpactReaction.issue_id.in_(ids)
            )
        ).all():
            (liked if kind == "like" else saved).add(issue_id)
    return likes, comments, shares, liked, saved


def _reel(issue: CivicIssue, c) -> ImpactReel:
    likes, comments, shares, liked, saved = c
    r = issue.reporter
    after = issue.resolution_images
    before = issue.images
    return ImpactReel(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        category=issue.category,
        locality=issue.address or r.ward,
        creator=ReelCreator(id=r.id, name=r.name, avatar_url=r.avatar_url, ward=r.ward),
        before_image=before[0] if before else None,
        after_image=after[0] if after else None,
        resolution_note=issue.resolution_note,
        resolved_at=issue.resolved_at or issue.updated_at,
        days_to_resolve=_days(issue),
        supporters=issue.upvotes,
        likes=likes.get(issue.id, 0),
        comments_count=comments.get(issue.id, 0),
        shares=shares.get(issue.id, 0),
        has_liked=issue.id in liked,
        is_saved=issue.id in saved,
    )


def _get_resolved_or_404(db: Session, issue_id: int) -> CivicIssue:
    issue = db.scalar(select(CivicIssue).where(CivicIssue.id == issue_id, *_resolved_filters()))
    if issue is None:
        raise HTTPException(status_code=404, detail="Impact story not found")
    return issue


@router.get("/reels", response_model=ImpactReelList)
def list_reels(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=30),
    saved: bool = False,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    filters = _resolved_filters()
    if saved:
        if viewer is None:
            raise HTTPException(status_code=401, detail="Sign in to see saved stories")
        filters.append(
            CivicIssue.id.in_(
                select(ImpactReaction.issue_id).where(
                    ImpactReaction.user_id == viewer.id, ImpactReaction.kind == "save"
                )
            )
        )
    total = db.scalar(select(func.count()).select_from(CivicIssue).where(*filters)) or 0
    issues = (
        db.scalars(
            select(CivicIssue)
            .where(*filters)
            .order_by(CivicIssue.resolved_at.desc(), CivicIssue.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .unique()
        .all()
    )
    c = _counts(db, [i.id for i in issues], viewer)
    return ImpactReelList(
        items=[_reel(i, c) for i in issues], total=total, page=page, pages=max(1, math.ceil(total / page_size))
    )


@router.get("/reels/{issue_id}", response_model=ImpactReel)
def get_reel(issue_id: int, db: Session = Depends(get_db), viewer: User | None = Depends(get_optional_user)):
    """One story by id, so a shared link opens exactly that reel."""
    issue = _get_resolved_or_404(db, issue_id)
    return _reel(issue, _counts(db, [issue.id], viewer))


def _result(db: Session, issue_id: int, user: User) -> ReactionResult:
    likes, _, _, liked, saved = _counts(db, [issue_id], user)
    return ReactionResult(
        issue_id=issue_id, likes=likes.get(issue_id, 0), has_liked=issue_id in liked, is_saved=issue_id in saved
    )


def _set_reaction(db: Session, issue_id: int, user: User, kind: str, on: bool) -> ReactionResult:
    _get_resolved_or_404(db, issue_id)
    existing = db.scalar(
        select(ImpactReaction).where(
            ImpactReaction.issue_id == issue_id, ImpactReaction.user_id == user.id, ImpactReaction.kind == kind
        )
    )
    if on and existing is None:
        try:
            db.add(ImpactReaction(issue_id=issue_id, user_id=user.id, kind=kind))
            db.commit()
        except IntegrityError:  # a double tap raced us: the reaction is there, which is what was asked for
            db.rollback()
    elif not on and existing is not None:
        db.delete(existing)
        db.commit()
    return _result(db, issue_id, user)


@router.post("/reels/{issue_id}/like", response_model=ReactionResult)
def like(issue_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _set_reaction(db, issue_id, user, "like", True)


@router.delete("/reels/{issue_id}/like", response_model=ReactionResult)
def unlike(issue_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _set_reaction(db, issue_id, user, "like", False)


@router.post("/reels/{issue_id}/save", response_model=ReactionResult)
def save(issue_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _set_reaction(db, issue_id, user, "save", True)


@router.delete("/reels/{issue_id}/save", response_model=ReactionResult)
def unsave(issue_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _set_reaction(db, issue_id, user, "save", False)


@router.post("/reels/{issue_id}/share", response_model=ShareResult)
def share(
    issue_id: int,
    body: ShareBody,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    _get_resolved_or_404(db, issue_id)
    db.add(ImpactShare(issue_id=issue_id, user_id=user.id if user else None, channel=body.channel))
    db.commit()
    total = db.scalar(select(func.count(ImpactShare.id)).where(ImpactShare.issue_id == issue_id)) or 0
    return ShareResult(issue_id=issue_id, shares=total)


@router.get("/stats", response_model=ImpactStats)
def stats(db: Session = Depends(get_db)):
    live = CivicIssue.deleted_at.is_(None)
    reports_total = db.scalar(select(func.count()).select_from(CivicIssue).where(live)) or 0
    resolved = db.scalars(select(CivicIssue).where(*_resolved_filters())).unique().all()
    cutoff = utcnow() - timedelta(days=30)
    last30 = sum(1 for i in resolved if (i.resolved_at or i.updated_at) >= cutoff)
    days = [_days(i) for i in resolved]
    by_cat: dict[str, int] = {}
    for i in resolved:
        by_cat[i.category] = by_cat.get(i.category, 0) + 1
    return ImpactStats(
        reports_total=reports_total,
        resolved_total=len(resolved),
        resolution_rate=round(100 * len(resolved) / reports_total) if reports_total else 0,
        resolved_last_30_days=last30,
        avg_days_to_resolve=round(sum(days) / len(days), 1) if days else None,
        citizens_supporting=sum(i.upvotes for i in resolved),
        citizens_reporting=len({i.reporter_id for i in resolved}),
        with_after_photo=sum(1 for i in resolved if i.resolution_images),
        by_category=[
            CategoryCount(category=k, resolved=v) for k, v in sorted(by_cat.items(), key=lambda kv: -kv[1])
        ],
    )
