"""Badges are worked out from what a citizen has really done. Nothing is stored or hand-awarded:
every badge below is a rule over the database, and `earned_at` is the moment the rule was first met."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Callable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.issue import CivicIssue, IssueVote
from app.models.reward import RewardTransaction
from app.models.volunteer import Campaign, CampaignMember
from app.models.user import User


@dataclass(frozen=True)
class Badge:
    id: str
    name: str
    description: str
    requirement: str
    category: str


BADGES: list[Badge] = [
    Badge("swachh-warrior", "Swachh Warrior", "Earn 100 lifetime points through verified reporting and civic work.", "100 lifetime points", "Milestones"),
    Badge("clear-reporter", "Clear Reporter", "File ten civic reports that each include a photo of the problem.", "10 reports with photos", "Reporting"),
    Badge("eyes-on-street", "Eyes on the Street", "Have ten of your reports picked up by the ward team (under review, in progress or resolved).", "10 reports taken up", "Reporting"),
    Badge("community-cleaner", "Community Cleaner", "Organise and wrap up two civic drives.", "2 drives completed as organiser", "Action"),
    Badge("volunteer-regular", "Volunteer Regular", "Show up at five civic drives, confirmed by their organisers.", "5 drives attended", "Action"),
    Badge("ward-mobilizer", "Ward Mobilizer", "Bring twenty confirmed volunteers to the drives you organise.", "20 volunteers at your drives", "Leadership"),
    Badge("community-watchdog", "Community Watchdog", "Report or support an issue and stay with it until it is resolved after a full 30 days.", "1 issue followed for 30+ days", "Monitoring"),
]


def _nth(times: list[datetime], n: int) -> datetime | None:
    """Moment the n-th event happened (the day the count reached n)."""
    ordered = sorted(t for t in times if t is not None)
    return ordered[n - 1] if len(ordered) >= n else None


def _points_reached(db: Session, user: User, target: int) -> datetime | None:
    rows = db.execute(
        select(RewardTransaction.points, RewardTransaction.created_at)
        .where(RewardTransaction.user_id == user.id)
        .order_by(RewardTransaction.created_at, RewardTransaction.id)
    ).all()
    total = 0
    for pts, at in rows:
        total += pts
        if total >= target:
            return at
    # points granted without a ledger row (older data): the account is already past the bar
    return user.updated_at if user.points >= target else None


def _reports(db: Session, user: User) -> list[CivicIssue]:
    return list(
        db.scalars(
            select(CivicIssue).where(CivicIssue.reporter_id == user.id, CivicIssue.deleted_at.is_(None)).order_by(CivicIssue.created_at)
        ).unique()
    )


def earned_badges(db: Session, user: User) -> list[dict]:
    reports = _reports(db, user)
    drives_organised = list(
        db.scalars(
            select(Campaign).where(Campaign.organiser_id == user.id, Campaign.completed_at.is_not(None), Campaign.cancelled_at.is_(None))
        ).unique()
    )
    attended = db.execute(
        select(CampaignMember.joined_at, Campaign.completed_at)
        .join(Campaign, Campaign.id == CampaignMember.campaign_id)
        .where(CampaignMember.user_id == user.id, CampaignMember.status == "Attended")
    ).all()
    volunteers_at_my_drives = db.execute(
        select(Campaign.completed_at)
        .join(CampaignMember, CampaignMember.campaign_id == Campaign.id)
        .where(Campaign.organiser_id == user.id, CampaignMember.status == "Attended")
    ).all()

    # issues I reported or supported that were resolved after at least 30 days
    window = timedelta(days=30)
    followed: list[datetime] = []
    voted_ids = [r[0] for r in db.execute(select(IssueVote.issue_id).where(IssueVote.user_id == user.id)).all()]
    candidates = {i.id: i for i in reports}
    if voted_ids:
        for issue in db.scalars(select(CivicIssue).where(CivicIssue.id.in_(voted_ids), CivicIssue.deleted_at.is_(None))).unique():
            candidates[issue.id] = issue
    for issue in candidates.values():
        if issue.resolved_at and issue.created_at and issue.resolved_at - issue.created_at >= window:
            followed.append(issue.resolved_at)

    rules: dict[str, Callable[[], datetime | None]] = {
        "swachh-warrior": lambda: _points_reached(db, user, 100),
        "clear-reporter": lambda: _nth([r.created_at for r in reports if r.images], 10),
        "eyes-on-street": lambda: _nth([r.created_at for r in reports if r.status in ("Under Review", "In Progress", "Resolved")], 10),
        "community-cleaner": lambda: _nth([c.completed_at for c in drives_organised], 2),
        "volunteer-regular": lambda: _nth([row[1] or row[0] for row in attended], 5),
        "ward-mobilizer": lambda: _nth([row[0] for row in volunteers_at_my_drives], 20),
        "community-watchdog": lambda: _nth(followed, 1),
    }
    out = []
    for badge in BADGES:
        when = rules[badge.id]()
        if when is not None:
            out.append({**badge.__dict__, "earned_at": when})
    out.sort(key=lambda b: b["earned_at"], reverse=True)  # newest first
    return out
