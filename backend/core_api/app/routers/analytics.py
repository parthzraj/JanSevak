"""Live numbers for the Report & Civic Analysis screen (computed from the real issues, nothing hardcoded)."""
import re
from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db, utcnow
from app.core.security import get_current_user
from app.models.issue import CivicIssue, IssueComment, IssueEvidence, IssueTimelineEvent, IssueVote
from app.models.reward import RewardTransaction
from app.models.user import User
from app.services.points_engine import _local_tz, tier_progress

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


# ---------------------------------------------------------------------------
# Personal monthly contribution report
# ---------------------------------------------------------------------------
ACTION_LABELS = {
    "report": "Reports filed",
    "report_photo": "Clear photos on reports",
    "report_location": "Accurate locations",
    "evidence": "Site photos for others' reports",
    "upvote": "Verified others' reports",
    "resolve": "Your reports resolved",
    "confirm_resolution": "Resolutions confirmed",
    "cleanup": "Cleanups organised",
    "volunteer_drive": "Volunteer drives",
    "volunteer_attend": "Cleanups attended",
    "campaign_host": "Civic drives organised",
    "campaign_attend": "Civic drives attended",
    "vacancy_complete": "NGO volunteering completed",
    "quiz": "Quizzes passed",
    "academy_module": "Academy modules",
    "course_complete": "Civic Academy courses completed",
}


class MonthlyReportIssue(BaseModel):
    id: int
    title: str
    category: str
    status: str
    created_at: datetime
    supporters: int


class PointsLine(BaseModel):
    action_type: str
    label: str
    count: int
    points: int


class MonthlyReport(BaseModel):
    month: str  # YYYY-MM
    month_label: str
    period_start: datetime
    period_end: datetime
    generated_at: datetime
    citizen_name: str
    ward: str | None
    tier: str
    lifetime_points: int
    next_tier: str | None
    points_to_next_tier: int
    reports_filed: int
    reports_resolved_this_month: int  # filed any time, marked Resolved during the month
    status_breakdown: dict[str, int]
    category_breakdown: list[CategoryCount]
    reports: list[MonthlyReportIssue]
    supporters_received: int  # upvotes other people gave my reports during the month
    reports_supported: int  # reports of others I verified
    evidence_added: int
    comments_made: int
    points_earned: int
    points_reversed: int
    net_points: int
    points_breakdown: list[PointsLine]


def _month_bounds(month: str | None) -> tuple[str, datetime, datetime]:
    tz = _local_tz()
    now_local = utcnow().astimezone(tz)
    if month is None:
        month = f"{now_local.year:04d}-{now_local.month:02d}"
    if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", month):
        raise HTTPException(status_code=422, detail="month must look like 2026-10")
    year, mon = int(month[:4]), int(month[5:])
    if (year, mon) > (now_local.year, now_local.month):
        raise HTTPException(status_code=422, detail="That month has not started yet")
    start_local = datetime.combine(datetime(year, mon, 1).date(), time.min, tzinfo=tz)
    ny, nm = (year + 1, 1) if mon == 12 else (year, mon + 1)
    end_local = datetime.combine(datetime(ny, nm, 1).date(), time.min, tzinfo=tz)
    return month, start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


@router.get("/monthly-report", response_model=MonthlyReport)
def monthly_report(
    month: str | None = Query(default=None, description="YYYY-MM, defaults to the current month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Everything the signed-in citizen did in one calendar month (IST), from live data."""
    month, start, end = _month_bounds(month)
    in_month = lambda col: (col >= start, col < end)  # noqa: E731

    issues = db.scalars(
        select(CivicIssue)
        .where(CivicIssue.reporter_id == user.id, CivicIssue.deleted_at.is_(None), *in_month(CivicIssue.created_at))
        .order_by(CivicIssue.created_at)
    ).all()
    status_breakdown: dict[str, int] = {}
    cats: dict[str, int] = {}
    for i in issues:
        status_breakdown[i.status] = status_breakdown.get(i.status, 0) + 1
        cats[i.category] = cats.get(i.category, 0) + 1
    n = len(issues)
    category_breakdown = [
        CategoryCount(category=c, count=k, percent=round(100 * k / n) if n else 0)
        for c, k in sorted(cats.items(), key=lambda kv: -kv[1])
    ]

    my_issue_ids = select(CivicIssue.id).where(CivicIssue.reporter_id == user.id, CivicIssue.deleted_at.is_(None))
    resolved_now = db.scalar(
        select(func.count(func.distinct(IssueTimelineEvent.issue_id))).where(
            IssueTimelineEvent.issue_id.in_(my_issue_ids),
            IssueTimelineEvent.status == "Resolved",
            *in_month(IssueTimelineEvent.created_at),
        )
    ) or 0
    supporters_received = db.scalar(
        select(func.count()).select_from(IssueVote).where(
            IssueVote.issue_id.in_(my_issue_ids), IssueVote.user_id != user.id, *in_month(IssueVote.created_at)
        )
    ) or 0
    reports_supported = db.scalar(
        select(func.count()).select_from(IssueVote).join(CivicIssue, CivicIssue.id == IssueVote.issue_id).where(
            IssueVote.user_id == user.id, CivicIssue.reporter_id != user.id, *in_month(IssueVote.created_at)
        )
    ) or 0
    evidence_added = db.scalar(
        select(func.count()).select_from(IssueEvidence).where(IssueEvidence.user_id == user.id, *in_month(IssueEvidence.created_at))
    ) or 0
    comments_made = db.scalar(
        select(func.count()).select_from(IssueComment).where(IssueComment.user_id == user.id, *in_month(IssueComment.created_at))
    ) or 0

    tx = db.execute(
        select(RewardTransaction.action_type, RewardTransaction.points).where(
            RewardTransaction.user_id == user.id, *in_month(RewardTransaction.created_at)
        )
    ).all()
    lines: dict[str, list[int]] = {}
    earned = reversed_ = 0
    for action, pts in tx:
        if action.endswith("_revert") or pts < 0:
            reversed_ += -pts if pts < 0 else 0
            continue
        earned += pts
        entry = lines.setdefault(action, [0, 0])
        entry[0] += 1
        entry[1] += pts
    breakdown = [
        PointsLine(action_type=a, label=ACTION_LABELS.get(a, a.replace("_", " ").capitalize()), count=c, points=p)
        for a, (c, p) in sorted(lines.items(), key=lambda kv: -kv[1][1])
        if p > 0
    ]

    progress = tier_progress(user.points)
    start_local = start.astimezone(_local_tz())
    return MonthlyReport(
        month=month,
        month_label=start_local.strftime("%B %Y"),
        period_start=start,
        period_end=end,
        generated_at=utcnow(),
        citizen_name=user.name,
        ward=user.ward,
        tier=user.tier,
        lifetime_points=user.points,
        next_tier=progress["next_tier"],
        points_to_next_tier=progress["points_to_next_tier"],
        reports_filed=n,
        reports_resolved_this_month=resolved_now,
        status_breakdown=status_breakdown,
        category_breakdown=category_breakdown,
        reports=[
            MonthlyReportIssue(id=i.id, title=i.title, category=i.category, status=i.status, created_at=i.created_at, supporters=i.upvotes)
            for i in issues
        ],
        supporters_received=supporters_received,
        reports_supported=reports_supported,
        evidence_added=evidence_added,
        comments_made=comments_made,
        points_earned=earned,
        points_reversed=reversed_,
        net_points=earned - reversed_,
        points_breakdown=breakdown,
    )
