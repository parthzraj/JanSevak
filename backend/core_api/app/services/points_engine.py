"""Rewards engine: points table, daily cap, de-duplication and tiers.

Rules (see backend/prajapulse.md section 4):
  * max DAILY_POINTS_CAP (60) points per user per calendar day -> extra points are clipped
  * the same (user_id, action_type, action_id) never earns twice (DB unique constraint + check)
  * reversals (e.g. removing an upvote) take back only what was really awarded, once
  * points never go below 0; tier is always derived from lifetime points

Nothing in here commits: the calling router commits once so that the action
(issue created, vote added, ...) and its reward are saved atomically.
"""
from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import utcnow
from app.models.reward import RewardTransaction
from app.models.user import User

# ---- Points table -----------------------------------------------------------
POINTS: dict[str, int] = {
    "report": 20,  # verified report with description + location
    "report_photo": 10,  # photo evidence attached
    "report_location": 5,  # GPS / precise location tagged
    "evidence": 10,  # photo evidence added to someone else's report
    "upvote": 5,  # site-verification upvote on someone else's report
    "resolve": 50,  # reporter's issue got resolved
    "confirm_resolution": 25,
    "cleanup": 40,  # organised a cleanup drive
    "volunteer_drive": 25,  # volunteer drive participation
    "volunteer_attend": 20,
    # Paid only after a human (the organiser / the NGO) confirms the work happened:
    "campaign_attend": 30,  # attended a civic drive (confirmed by its organiser)
    "campaign_host": 20,  # base for organising a drive; the router adds 10 per confirmed volunteer (max 80)
    "vacancy_complete": 40,  # finished an NGO volunteering role (confirmed by the NGO)
}

# Actions a *client* may claim itself (the server cannot verify them any other way).
# Quizzes are no longer here: the server grades them (see routers/quizzes.py).
# Value = (min, max) points the client may ask for.
CLIENT_CLAIMABLE: dict[str, tuple[int, int]] = {
    "academy_module": (15, 60),
}

# ---- Tiers --------------------------------------------------------------------
TIERS: list[tuple[str, int]] = [  # ascending thresholds
    ("Bronze", 0),
    ("Silver", 100),
    ("Gold", 300),
    ("Platinum", 750),
    ("Legend", 2000),
]


def tier_for(points: int) -> str:
    current = TIERS[0][0]
    for name, threshold in TIERS:
        if points >= threshold:
            current = name
    return current


def tier_progress(points: int) -> dict:
    """Current tier, next tier and how far along the user is."""
    idx = max(i for i, (_, t) in enumerate(TIERS) if points >= t)
    name, floor = TIERS[idx]
    if idx == len(TIERS) - 1:
        return {"tier": name, "next_tier": None, "points_to_next_tier": 0, "progress_percent": 100}
    next_name, ceiling = TIERS[idx + 1]
    span = ceiling - floor
    return {
        "tier": name,
        "next_tier": next_name,
        "points_to_next_tier": ceiling - points,
        "progress_percent": int((points - floor) * 100 / span),
    }


# ---- Calendar-day helpers --------------------------------------------------------
def _local_tz():
    try:
        return ZoneInfo(settings.DAY_RESET_TZ)
    except Exception:  # tzdata missing (e.g. Windows without the tzdata package)
        return timezone(timedelta(hours=5, minutes=30))


def today_bounds_utc(now: datetime | None = None) -> tuple[datetime, datetime]:
    """Start (inclusive) and end (exclusive) of the user's calendar day, in UTC."""
    tz = _local_tz()
    local_now = (now or utcnow()).astimezone(tz)
    start_local = datetime.combine(local_now.date(), time.min, tzinfo=tz)
    end_local = start_local + timedelta(days=1)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


# Contest prizes and confirmed volunteering are paid outside the daily cap, so they must not eat into it either.
# Volunteering is throttled separately (MAX_VOLUNTEER_REWARDS_PER_WEEK) so it cannot be farmed.
VOLUNTEER_ACTIONS = ("campaign_attend", "campaign_host", "vacancy_complete")
UNCAPPED_ACTIONS = ("contest_play", "contest_win") + VOLUNTEER_ACTIONS
MAX_VOLUNTEER_REWARDS_PER_WEEK = 3


def volunteer_rewards_this_week(db: Session, user_id: int) -> int:
    """How many paid volunteering rewards the user got in the last 7 days."""
    since = utcnow() - timedelta(days=7)
    return int(
        db.scalar(
            select(func.count(RewardTransaction.id)).where(
                RewardTransaction.user_id == user_id,
                RewardTransaction.action_type.in_(VOLUNTEER_ACTIONS),
                RewardTransaction.points > 0,
                RewardTransaction.created_at >= since,
            )
        )
        or 0
    )


def points_earned_today(db: Session, user_id: int) -> int:
    """Positive points awarded today. Reversals are NOT subtracted, so
    earn-then-undo cycles can't be used to free up cap room."""
    start, end = today_bounds_utc()
    total = db.scalar(
        select(func.coalesce(func.sum(RewardTransaction.points), 0)).where(
            RewardTransaction.user_id == user_id,
            RewardTransaction.points > 0,
            RewardTransaction.action_type.notin_(UNCAPPED_ACTIONS),
            RewardTransaction.created_at >= start,
            RewardTransaction.created_at < end,
        )
    )
    return int(total or 0)


# ---- Awarding ---------------------------------------------------------------------
@dataclass
class AwardResult:
    requested: int
    awarded: int
    duplicate: bool = False
    capped: bool = False

    def as_dict(self) -> dict:
        return {
            "requested": self.requested,
            "awarded": self.awarded,
            "duplicate": self.duplicate,
            "capped": self.capped,
        }


def _apply_to_user(user: User, delta: int) -> None:
    user.points = max(0, (user.points or 0) + delta)
    user.tier = tier_for(user.points)


def award_points(
    db: Session,
    user: User,
    action_type: str,
    action_id: str | int,
    points: int | None = None,
    description: str = "",
    respect_cap: bool = True,
) -> AwardResult:
    """Credit `user` for an action, honouring dedup and (unless respect_cap=False) the daily cap.

    respect_cap=False is only for one-off prizes (contest winnings), never for routine actions."""
    requested = POINTS[action_type] if points is None else points
    action_id = str(action_id)

    already = db.scalar(
        select(RewardTransaction.id).where(
            RewardTransaction.user_id == user.id,
            RewardTransaction.action_type == action_type,
            RewardTransaction.action_id == action_id,
        )
    )
    if already is not None:
        return AwardResult(requested=requested, awarded=0, duplicate=True)

    remaining = max(0, settings.DAILY_POINTS_CAP - points_earned_today(db, user.id)) if respect_cap else requested
    awarded = max(0, min(requested, remaining))
    capped = awarded < requested

    label = description or action_type.replace("_", " ").capitalize()
    if capped:
        label += " (daily cap reached)" if awarded == 0 else " (clipped by daily cap)"

    tx = RewardTransaction(
        user_id=user.id,
        points=awarded,
        action_type=action_type,
        action_id=action_id,
        description=label[:255],
    )
    try:
        with db.begin_nested():  # savepoint: a lost race must not poison the outer transaction
            db.add(tx)
            db.flush()
    except IntegrityError:
        return AwardResult(requested=requested, awarded=0, duplicate=True)

    _apply_to_user(user, awarded)
    return AwardResult(requested=requested, awarded=awarded, capped=capped)


def revert_award(
    db: Session, user: User, action_type: str, action_id: str | int, description: str = ""
) -> int:
    """Take back what `award_points(action_type, action_id)` really paid, at most once.

    Returns the points removed (0 if nothing was earned or it was already reverted).
    Re-voting later earns nothing (the original award row still exists), so
    vote -> unvote -> vote -> unvote cannot farm points.
    """
    action_id = str(action_id)
    original = db.scalar(
        select(RewardTransaction).where(
            RewardTransaction.user_id == user.id,
            RewardTransaction.action_type == action_type,
            RewardTransaction.action_id == action_id,
        )
    )
    if original is None or original.points <= 0:
        return 0

    revert_type = f"{action_type}_revert"
    tx = RewardTransaction(
        user_id=user.id,
        points=-original.points,
        action_type=revert_type,
        action_id=action_id,
        description=(description or f"{action_type.replace('_', ' ').capitalize()} withdrawn")[:255],
    )
    try:
        with db.begin_nested():
            db.add(tx)
            db.flush()
    except IntegrityError:
        return 0  # already reverted

    _apply_to_user(user, -original.points)
    return original.points
