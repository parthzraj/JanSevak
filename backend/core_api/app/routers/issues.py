import json
import math
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_optional_user, require_official
from app.models.issue import CivicIssue, IssueComment, IssueTimelineEvent, IssueVote
from app.models.user import User
from app.schemas.issue import (
    STATUS_ORDER,
    CommentResponse,
    EvidenceItem,
    IssueCreate,
    IssueCreatedResponse,
    IssueDetailResponse,
    IssueListResponse,
    IssueResponse,
    IssueStatusUpdate,
    ReporterInfo,
    TimelineEntry,
    to_backend_priority,
    to_ui_priority,
)
from app.services.notifications import notify
from app.services.points_engine import award_points

router = APIRouter(prefix="/issues", tags=["Issues"])

_CATEGORIES = {"Roads", "Water", "Sanitation", "Streetlights", "Public Safety", "Parks", "Community"}
_PRIORITIES = {"Low", "Medium", "High", "Critical"}


# ---- serialisation helpers (also imported by votes.py) -----------------------------
def comment_to_response(c: IssueComment) -> CommentResponse:
    return CommentResponse(
        id=c.id,
        issue_id=c.issue_id,
        user_id=c.user_id,
        author=c.author.name if c.author else "Unknown",
        avatar_url=c.author.avatar_url if c.author else None,
        text=c.text,
        is_official=c.is_official,
        created_at=c.created_at,
    )


def issue_to_response(issue: CivicIssue, has_upvoted: bool, comments_count: int) -> IssueResponse:
    r = issue.reporter
    return IssueResponse(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        category=issue.category,
        priority=issue.priority,
        priority_ui=to_ui_priority(issue.priority),
        status=issue.status,
        image_urls=issue.images,
        address=issue.address,
        latitude=issue.latitude,
        longitude=issue.longitude,
        upvotes=issue.upvotes,
        has_upvoted=has_upvoted,
        comments_count=comments_count,
        reporter=ReporterInfo(id=r.id, name=r.name, avatar_url=r.avatar_url, ward=r.ward),
        created_at=issue.created_at,
        updated_at=issue.updated_at,
    )


def issue_to_detail(db: Session, issue: CivicIssue, viewer: User | None) -> IssueDetailResponse:
    has_upvoted = False
    if viewer is not None:
        has_upvoted = (
            db.scalar(
                select(IssueVote.id).where(IssueVote.issue_id == issue.id, IssueVote.user_id == viewer.id)
            )
            is not None
        )
    comments = [comment_to_response(c) for c in issue.comments]
    base = issue_to_response(issue, has_upvoted, len(comments))
    return IssueDetailResponse(
        **base.model_dump(),
        comments=comments,
        timeline=[
            TimelineEntry(status=t.status, note=t.note, created_at=t.created_at) for t in issue.timeline
        ],
        evidence=[
            EvidenceItem(
                id=e.id,
                url=e.image_url,
                user_id=e.user_id,
                author=e.author.name if e.author else "Unknown",
                created_at=e.created_at,
            )
            for e in issue.evidence
        ],
    )


def get_issue_or_404(db: Session, issue_id: int) -> CivicIssue:
    issue = db.get(CivicIssue, issue_id)
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


# ---- endpoints ----------------------------------------------------------------------
@router.get("", response_model=IssueListResponse)
def list_issues(
    category: str | None = Query(None, description="Roads, Water, Sanitation, Streetlights, Public Safety, Parks, Community"),
    status_: str | None = Query(None, alias="status", description="Reported, Under Review, In Progress, Resolved"),
    priority: str | None = Query(None, description="Low, Medium, High, Critical (Urgent is accepted)"),
    q: str | None = Query(None, min_length=1, max_length=100, description="Search title / description / address"),
    reporter_id: int | None = None,
    sort: Literal["recent", "votes"] = "recent",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    if category and category not in _CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Use one of: {sorted(_CATEGORIES)}")
    if status_ and status_ not in STATUS_ORDER:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use one of: {STATUS_ORDER}")
    if priority:
        priority = to_backend_priority(priority)
        if priority not in _PRIORITIES:
            raise HTTPException(status_code=400, detail=f"Invalid priority. Use one of: {sorted(_PRIORITIES)}")

    filters = []
    if category:
        filters.append(CivicIssue.category == category)
    if status_:
        filters.append(CivicIssue.status == status_)
    if priority:
        filters.append(CivicIssue.priority == priority)
    if reporter_id:
        filters.append(CivicIssue.reporter_id == reporter_id)
    if q:
        like = f"%{q.strip()}%"
        filters.append(
            or_(CivicIssue.title.ilike(like), CivicIssue.description.ilike(like), CivicIssue.address.ilike(like))
        )

    total = db.scalar(select(func.count()).select_from(CivicIssue).where(*filters)) or 0

    order = (
        [CivicIssue.upvotes.desc(), CivicIssue.created_at.desc(), CivicIssue.id.desc()]
        if sort == "votes"
        else [CivicIssue.created_at.desc(), CivicIssue.id.desc()]
    )
    issues = db.scalars(
        select(CivicIssue).where(*filters).order_by(*order).offset((page - 1) * page_size).limit(page_size)
    ).unique().all()

    ids = [i.id for i in issues]
    comment_counts: dict[int, int] = {}
    voted: set[int] = set()
    if ids:
        comment_counts = dict(
            db.execute(
                select(IssueComment.issue_id, func.count(IssueComment.id))
                .where(IssueComment.issue_id.in_(ids))
                .group_by(IssueComment.issue_id)
            ).all()
        )
        if viewer is not None:
            voted = set(
                db.scalars(
                    select(IssueVote.issue_id).where(IssueVote.user_id == viewer.id, IssueVote.issue_id.in_(ids))
                ).all()
            )

    return IssueListResponse(
        items=[issue_to_response(i, i.id in voted, comment_counts.get(i.id, 0)) for i in issues],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=IssueCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_issue(body: IssueCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = CivicIssue(
        title=body.title,
        description=body.description,
        category=body.category,
        priority=body.priority,
        status="Reported",
        image_urls=json.dumps(body.image_urls),
        address=body.address,
        latitude=body.latitude,
        longitude=body.longitude,
        reporter_id=user.id,
    )
    db.add(issue)
    db.flush()  # need issue.id for the reward's action_id
    db.add(IssueTimelineEvent(issue_id=issue.id, status="Reported", note="Issue reported", actor_id=user.id))

    # +20 for the report; photo and location bonuses come from the blueprint's points table.
    awarded = award_points(db, user, "report", issue.id, description=f"Reported: {issue.title[:60]}").awarded
    if body.image_urls:
        awarded += award_points(db, user, "report_photo", issue.id, description="Photo evidence attached").awarded
    if (body.latitude is not None and body.longitude is not None) or body.address:
        awarded += award_points(db, user, "report_location", issue.id, description="Location tagged").awarded

    user.reports_count = (user.reports_count or 0) + 1
    if awarded:
        notify(db, user.id, "Points earned", f"You earned {awarded} points for reporting '{issue.title}'.", "reward")

    db.commit()
    db.refresh(issue)
    db.refresh(user)
    return IssueCreatedResponse(
        issue=issue_to_detail(db, issue, user),
        points_awarded=awarded,
        user_points=user.points,
        user_tier=user.tier,
    )


@router.get("/{issue_id}", response_model=IssueDetailResponse)
def get_issue(issue_id: int, db: Session = Depends(get_db), viewer: User | None = Depends(get_optional_user)):
    return issue_to_detail(db, get_issue_or_404(db, issue_id), viewer)


@router.patch("/{issue_id}/status", response_model=IssueDetailResponse)
def update_status(
    issue_id: int,
    body: IssueStatusUpdate,
    official: User = Depends(require_official),
    db: Session = Depends(get_db),
):
    """Reported -> Under Review -> In Progress -> Resolved (forward only; Resolved is final).

    Restricted to officials/admins: otherwise a citizen could resolve their own
    report and collect the +50 resolve reward.
    """
    issue = get_issue_or_404(db, issue_id)
    current, target = STATUS_ORDER.index(issue.status), STATUS_ORDER.index(body.status)
    if issue.status == "Resolved":
        raise HTTPException(status_code=409, detail="Issue is already resolved and cannot be changed")
    if target <= current:
        raise HTTPException(
            status_code=409,
            detail=f"Status can only move forward (currently '{issue.status}', requested '{body.status}')",
        )

    issue.status = body.status
    db.add(IssueTimelineEvent(issue_id=issue.id, status=body.status, note=body.note, actor_id=official.id))
    notify(db, issue.reporter_id, "Issue status updated", f"'{issue.title}' is now {body.status}.", "status")

    if body.status == "Resolved":
        reporter = db.get(User, issue.reporter_id)
        reporter.resolved_count = (reporter.resolved_count or 0) + 1
        result = award_points(db, reporter, "resolve", issue.id, description=f"Resolved: {issue.title[:60]}")
        if result.awarded:
            notify(db, reporter.id, "Points earned", f"You earned {result.awarded} points: your report was resolved.", "reward")

    db.commit()
    db.refresh(issue)
    return issue_to_detail(db, issue, official)
