"""Civic drives (campaigns): any citizen or NGO can organise one, optionally for a reported issue.

Points are paid only when the organiser wraps the drive up and confirms who really turned up:
  * each confirmed volunteer: +30 and the drive's duration as volunteer hours
  * the organiser: 20 + 10 per confirmed volunteer (max 80)
These sit outside the daily cap but each person earns at most MAX_VOLUNTEER_REWARDS_PER_WEEK of them
per 7 days, and the organiser can never confirm themselves.
"""
import math
from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, case, exists, func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db, utcnow
from app.core.security import get_current_user, get_optional_user
from app.models.issue import CivicIssue
from app.models.user import User
from app.models.volunteer import Campaign, CampaignMember
from app.schemas.volunteer import (
    CampaignCreate,
    CampaignDetail,
    CampaignList,
    CampaignOut,
    CampaignUpdate,
    CompleteBody,
    CompleteResult,
    IssueBrief,
    MemberOut,
    Person,
)
from app.services.notifications import notify
from app.services.points_engine import (
    MAX_VOLUNTEER_REWARDS_PER_WEEK,
    POINTS,
    award_points,
    volunteer_rewards_this_week,
)

router = APIRouter(prefix="/campaigns", tags=["Civic drives"])

MAX_ACTIVE_PER_ORGANISER = 5
MAX_DURATION = timedelta(days=14)
MAX_HOST_POINTS = 80
MAX_HOURS_CREDIT = 8.0


# ------------------------------------------------------------------ helpers
def person(u: User) -> Person:
    return Person(id=u.id, name=u.name, avatar_url=u.avatar_url, ward=u.ward, is_ngo=u.role == "ngo")


def status_of(c: Campaign, now=None) -> str:
    now = now or utcnow()
    if c.cancelled_at:
        return "Cancelled"
    if c.completed_at:
        return "Completed"
    if now < c.starts_at:
        return "Upcoming"
    return "Ongoing" if now <= c.ends_at else "Awaiting wrap-up"


def _is_open(c: Campaign) -> bool:
    return status_of(c) in ("Upcoming", "Ongoing")


def _check_times(starts, ends, *, creating: bool) -> None:
    now = utcnow()
    if ends <= starts:
        raise HTTPException(422, "The end time must be after the start time")
    if ends - starts > MAX_DURATION:
        raise HTTPException(422, "A drive can run for at most 14 days")
    if creating and starts < now - timedelta(minutes=10):
        raise HTTPException(422, "The start time is in the past")
    if starts > now + timedelta(days=180):
        raise HTTPException(422, "Drives can be scheduled at most 180 days ahead")


def _hours_credit(c: Campaign) -> float:
    hours = (c.ends_at - c.starts_at).total_seconds() / 3600
    return min(MAX_HOURS_CREDIT, max(0.5, round(hours * 2) / 2))


def _counts(db: Session, ids: list[int], viewer: User | None):
    joined: dict[int, int] = {}
    attended: dict[int, int] = {}
    mine: dict[int, str] = {}
    if not ids:
        return joined, attended, mine
    for cid, st, n in db.execute(
        select(CampaignMember.campaign_id, CampaignMember.status, func.count(CampaignMember.id))
        .where(CampaignMember.campaign_id.in_(ids))
        .group_by(CampaignMember.campaign_id, CampaignMember.status)
    ).all():
        joined[cid] = joined.get(cid, 0) + n
        if st == "Attended":
            attended[cid] = n
    if viewer is not None:
        mine = dict(
            db.execute(
                select(CampaignMember.campaign_id, CampaignMember.status).where(
                    CampaignMember.user_id == viewer.id, CampaignMember.campaign_id.in_(ids)
                )
            ).all()
        )
    return joined, attended, mine


def to_out(c: Campaign, counts, viewer: User | None) -> CampaignOut:
    joined, attended, mine = counts
    o = c.organiser
    issue = c.issue if c.issue is not None and c.issue.deleted_at is None else None
    return CampaignOut(
        id=c.id,
        title=c.title,
        description=c.description,
        kind=c.kind,
        status=status_of(c),
        organiser=person(o),
        organiser_type="NGO" if o.role == "ngo" else "Citizen",
        issue=IssueBrief(id=issue.id, title=issue.title, category=issue.category, status=issue.status) if issue else None,
        address=c.address,
        latitude=c.latitude,
        longitude=c.longitude,
        starts_at=c.starts_at,
        ends_at=c.ends_at,
        volunteers_needed=c.volunteers_needed,
        volunteers_joined=joined.get(c.id, 0),
        volunteers_attended=attended.get(c.id, 0),
        my_status=mine.get(c.id),
        is_organiser=viewer is not None and viewer.id == c.organiser_id,
        host_points=c.host_points,
        points_per_volunteer=POINTS["campaign_attend"],
        created_at=c.created_at,
    )


def _detail(db: Session, c: Campaign, viewer: User | None) -> CampaignDetail:
    counts = _counts(db, [c.id], viewer)
    members = db.scalars(
        select(CampaignMember).where(CampaignMember.campaign_id == c.id).order_by(CampaignMember.joined_at)
    ).unique().all()
    return CampaignDetail(
        **to_out(c, counts, viewer).model_dump(),
        members=[
            MemberOut(
                user_id=m.user_id,
                name=m.user.name,
                avatar_url=m.user.avatar_url,
                ward=m.user.ward,
                status=m.status,
                points_awarded=m.points_awarded,
            )
            for m in members
        ],
    )


def _get_or_404(db: Session, campaign_id: int) -> Campaign:
    c = db.scalar(select(Campaign).where(Campaign.id == campaign_id))
    if c is None:
        raise HTTPException(404, "Campaign not found")
    return c


def _own(c: Campaign, user: User) -> None:
    if c.organiser_id != user.id:
        raise HTTPException(403, "Only the organiser can do this")


# ------------------------------------------------------------------ list / read
@router.get("", response_model=CampaignList)
def list_campaigns(
    status: Literal["Upcoming", "Ongoing", "Awaiting wrap-up", "Completed", "Cancelled"] | None = None,
    organiser_type: Literal["ngo", "citizen"] | None = None,
    mine: bool = False,
    issue_id: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
):
    now = utcnow()
    live = and_(Campaign.cancelled_at.is_(None), Campaign.completed_at.is_(None))
    filters = []
    if status == "Cancelled":
        filters.append(Campaign.cancelled_at.is_not(None))
    elif status == "Completed":
        filters += [Campaign.completed_at.is_not(None), Campaign.cancelled_at.is_(None)]
    elif status == "Upcoming":
        filters += [live, Campaign.starts_at > now]
    elif status == "Ongoing":
        filters += [live, Campaign.starts_at <= now, Campaign.ends_at >= now]
    elif status == "Awaiting wrap-up":
        filters += [live, Campaign.ends_at < now]
    if organiser_type:
        organiser_ids = select(User.id).where(User.role == "ngo") if organiser_type == "ngo" else select(User.id).where(User.role != "ngo")
        filters.append(Campaign.organiser_id.in_(organiser_ids))
    if issue_id:
        filters.append(Campaign.issue_id == issue_id)
    if mine:
        if viewer is None:
            raise HTTPException(401, "Sign in to see your campaigns")
        filters.append(
            or_(
                Campaign.organiser_id == viewer.id,
                exists().where(CampaignMember.campaign_id == Campaign.id, CampaignMember.user_id == viewer.id),
            )
        )

    rank = case(
        (Campaign.cancelled_at.is_not(None), 4),
        (Campaign.completed_at.is_not(None), 3),
        (Campaign.ends_at < now, 2),
        (Campaign.starts_at <= now, 0),
        else_=1,
    )
    total = db.scalar(select(func.count()).select_from(Campaign).where(*filters)) or 0
    rows = (
        db.scalars(
            select(Campaign)
            .where(*filters)
            .order_by(rank, case((rank < 2, Campaign.starts_at)), case((rank >= 2, Campaign.starts_at)).desc(), Campaign.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .unique()
        .all()
    )
    counts = _counts(db, [c.id for c in rows], viewer)
    return CampaignList(
        items=[to_out(c, counts, viewer) for c in rows],
        total=total,
        page=page,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/{campaign_id}", response_model=CampaignDetail)
def get_campaign(campaign_id: int, db: Session = Depends(get_db), viewer: User | None = Depends(get_optional_user)):
    return _detail(db, _get_or_404(db, campaign_id), viewer)


# ------------------------------------------------------------------ create / edit / cancel
@router.post("", response_model=CampaignDetail, status_code=201)
def create_campaign(body: CampaignCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_times(body.starts_at, body.ends_at, creating=True)
    if body.issue_id is not None:
        issue = db.get(CivicIssue, body.issue_id)
        if issue is None or issue.deleted_at is not None:
            raise HTTPException(404, "The linked report no longer exists")
    active = db.scalar(
        select(func.count())
        .select_from(Campaign)
        .where(Campaign.organiser_id == user.id, Campaign.cancelled_at.is_(None), Campaign.completed_at.is_(None))
    )
    if (active or 0) >= MAX_ACTIVE_PER_ORGANISER:
        raise HTTPException(
            409, f"You already have {MAX_ACTIVE_PER_ORGANISER} open drives. Wrap one up or cancel it first."
        )
    c = Campaign(organiser_id=user.id, **body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return _detail(db, c, user)


@router.patch("/{campaign_id}", response_model=CampaignDetail)
def update_campaign(
    campaign_id: int, body: CampaignUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    c = _get_or_404(db, campaign_id)
    _own(c, user)
    if c.cancelled_at or c.completed_at:
        raise HTTPException(409, "A finished or cancelled drive cannot be edited")
    data = body.model_dump(exclude_unset=True)
    starts, ends = data.get("starts_at", c.starts_at), data.get("ends_at", c.ends_at)
    if "starts_at" in data or "ends_at" in data:
        _check_times(starts, ends, creating=False)
    if "volunteers_needed" in data:
        joined = db.scalar(select(func.count()).select_from(CampaignMember).where(CampaignMember.campaign_id == c.id)) or 0
        if data["volunteers_needed"] < joined:
            raise HTTPException(409, f"{joined} volunteers have already joined; you cannot go below that")
    time_changed = starts != c.starts_at or ends != c.ends_at
    for k, v in data.items():
        if v is not None:
            setattr(c, k, v)
    if time_changed:
        for m in db.scalars(select(CampaignMember).where(CampaignMember.campaign_id == c.id)).unique():
            notify(db, m.user_id, "Drive rescheduled", f"'{c.title}' has new timings. Please check the details.", "event")
    db.commit()
    db.refresh(c)
    return _detail(db, c, user)


@router.post("/{campaign_id}/cancel", response_model=CampaignDetail)
def cancel_campaign(campaign_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = _get_or_404(db, campaign_id)
    _own(c, user)
    if c.completed_at:
        raise HTTPException(409, "A completed drive cannot be cancelled")
    if c.cancelled_at is None:
        c.cancelled_at = utcnow()
        for m in db.scalars(select(CampaignMember).where(CampaignMember.campaign_id == c.id)).unique():
            notify(db, m.user_id, "Drive cancelled", f"The organiser cancelled '{c.title}'.", "event")
        db.commit()
        db.refresh(c)
    return _detail(db, c, user)


# ------------------------------------------------------------------ join / leave
@router.post("/{campaign_id}/join", response_model=CampaignDetail)
def join_campaign(campaign_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = _get_or_404(db, campaign_id)
    if c.organiser_id == user.id:
        raise HTTPException(403, "You are the organiser of this drive")
    if not _is_open(c):
        raise HTTPException(409, f"This drive is {status_of(c).lower()}, so it is no longer taking volunteers")
    if db.scalar(select(CampaignMember.id).where(CampaignMember.campaign_id == c.id, CampaignMember.user_id == user.id)):
        raise HTTPException(409, "You have already joined this drive")
    joined = db.scalar(select(func.count()).select_from(CampaignMember).where(CampaignMember.campaign_id == c.id)) or 0
    if joined >= c.volunteers_needed:
        raise HTTPException(409, "This drive is full")
    db.add(CampaignMember(campaign_id=c.id, user_id=user.id))
    notify(db, c.organiser_id, "New volunteer", f"{user.name} joined '{c.title}'.", "event")
    db.commit()
    return _detail(db, c, user)


@router.delete("/{campaign_id}/join", response_model=CampaignDetail)
def leave_campaign(campaign_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = _get_or_404(db, campaign_id)
    m = db.scalar(select(CampaignMember).where(CampaignMember.campaign_id == c.id, CampaignMember.user_id == user.id))
    if m is None:
        raise HTTPException(404, "You have not joined this drive")
    if c.completed_at or m.status != "Joined":
        raise HTTPException(409, "This drive is already wrapped up")
    db.delete(m)
    notify(db, c.organiser_id, "Volunteer left", f"{user.name} left '{c.title}'.", "event")
    db.commit()
    return _detail(db, c, user)


# ------------------------------------------------------------------ wrap up and pay
@router.post("/{campaign_id}/complete", response_model=CompleteResult)
def complete_campaign(
    campaign_id: int, body: CompleteBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    c = _get_or_404(db, campaign_id)
    _own(c, user)
    if c.cancelled_at:
        raise HTTPException(409, "This drive was cancelled")
    if c.completed_at:
        raise HTTPException(409, "This drive is already completed")
    if utcnow() < c.starts_at:
        raise HTTPException(409, "You can wrap a drive up only after it has started")

    members = {m.user_id: m for m in db.scalars(select(CampaignMember).where(CampaignMember.campaign_id == c.id)).unique()}
    chosen = set(body.attended_user_ids)
    unknown = chosen - set(members)
    if unknown:
        raise HTTPException(400, "Some of the selected people never joined this drive")
    if user.id in chosen:
        raise HTTPException(400, "You cannot confirm yourself")
    if not chosen:
        raise HTTPException(400, "Confirm at least one volunteer, or cancel the drive if nobody came")

    notes: list[str] = []
    hours = _hours_credit(c)
    paid = 0
    for uid, m in members.items():
        if uid not in chosen:
            m.status = "NoShow"
            continue
        m.status = "Attended"
        volunteer = m.user
        volunteer.volunteer_hours = round((volunteer.volunteer_hours or 0) + hours, 1)
        if volunteer_rewards_this_week(db, uid) >= MAX_VOLUNTEER_REWARDS_PER_WEEK:
            notes.append(f"{volunteer.name} reached the weekly volunteering reward limit (hours were still credited).")
            notify(db, uid, "Drive completed", f"Your attendance at '{c.title}' was confirmed. Weekly point limit reached, {hours:g} h credited.", "event")
            continue
        res = award_points(db, volunteer, "campaign_attend", c.id, description=f"Civic drive: {c.title[:60]}", respect_cap=False)
        m.points_awarded = res.awarded
        if res.awarded:
            paid += 1
            notify(db, uid, "Points earned", f"You earned {res.awarded} points for '{c.title}'.", "reward")

    host_awarded = 0
    host_points = min(MAX_HOST_POINTS, POINTS["campaign_host"] + 10 * len(chosen))
    if volunteer_rewards_this_week(db, user.id) >= MAX_VOLUNTEER_REWARDS_PER_WEEK:
        notes.append("You reached the weekly volunteering reward limit, so no organiser points this time.")
    else:
        res = award_points(db, user, "campaign_host", c.id, points=host_points, description=f"Organised: {c.title[:60]}", respect_cap=False)
        host_awarded = res.awarded
        if res.awarded:
            notify(db, user.id, "Points earned", f"You earned {res.awarded} points for organising '{c.title}'.", "reward")
    c.host_points = host_awarded
    c.completed_at = utcnow()
    db.commit()
    db.refresh(c)
    db.refresh(user)
    return CompleteResult(
        campaign=_detail(db, c, user),
        attended=len(chosen),
        no_show=len(members) - len(chosen),
        host_points_awarded=host_awarded,
        volunteers_paid=paid,
        notes=notes,
    )
