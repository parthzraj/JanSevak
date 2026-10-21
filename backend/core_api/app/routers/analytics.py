"""Live numbers for the Report & Civic Analysis screen (computed from the real issues, nothing hardcoded)."""
from datetime import timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db, utcnow
from app.core.security import get_current_user
from app.models.issue import CivicIssue, IssueTimelineEvent
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


class CategoryCount(BaseModel):
    category: str
    count: int
    percent: int


class Stats(BaseModel):
    total: int
    reported: int
    in_progress: int  # "Under Review" + "In Progress"
    resolved: int
    resolution_rate: int  # % of issues resolved
    avg_resolution_hours: float | None  # None until something has been resolved
    last_7_days: int
    by_category: list[CategoryCount]


class AnalyticsSummary(BaseModel):
    mine: Stats
    community: Stats


def _stats(db: Session, reporter_id: int | None) -> Stats:
    where = [CivicIssue.deleted_at.is_(None)]
    if reporter_id:
        where.append(CivicIssue.reporter_id == reporter_id)
    by_status = dict(db.execute(select(CivicIssue.status, func.count()).where(*where).group_by(CivicIssue.status)).all())
    total = sum(by_status.values())
    resolved = by_status.get("Resolved", 0)

    cats = db.execute(
        select(CivicIssue.category, func.count().label("n")).where(*where).group_by(CivicIssue.category).order_by(func.count().desc())
    ).all()
    by_category = [
        CategoryCount(category=c, count=n, percent=round(100 * n / total) if total else 0) for c, n in cats
    ]

    # average time from "reported" to the Resolved timeline event
    rows = db.execute(
        select(CivicIssue.created_at, func.min(IssueTimelineEvent.created_at))
        .join(IssueTimelineEvent, IssueTimelineEvent.issue_id == CivicIssue.id)
        .where(IssueTimelineEvent.status == "Resolved", *where)
        .group_by(CivicIssue.id)
    ).all()
    hours = [(done - created).total_seconds() / 3600 for created, done in rows if done and created]
    avg = round(sum(hours) / len(hours), 1) if hours else None

    last_7 = db.scalar(
        select(func.count()).select_from(CivicIssue).where(*where, CivicIssue.created_at >= utcnow() - timedelta(days=7))
    ) or 0

    return Stats(
        total=total,
        reported=by_status.get("Reported", 0),
        in_progress=by_status.get("Under Review", 0) + by_status.get("In Progress", 0),
        resolved=resolved,
        resolution_rate=round(100 * resolved / total) if total else 0,
        avg_resolution_hours=avg,
        last_7_days=last_7,
        by_category=by_category,
    )


@router.get("/summary", response_model=AnalyticsSummary)
def summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return AnalyticsSummary(mine=_stats(db, user.id), community=_stats(db, None))
