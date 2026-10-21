from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.reward import RewardTransaction
from app.models.user import User
from app.schemas.reward import (
    ClaimRequest,
    ClaimResponse,
    LeaderboardEntry,
    RewardHistoryItem,
    RewardHistoryResponse,
    WalletResponse,
)
from app.services.points_engine import (
    CLIENT_CLAIMABLE,
    award_points,
    points_earned_today,
    tier_progress,
)

router = APIRouter(prefix="/rewards", tags=["Rewards"])


def _item(tx: RewardTransaction) -> RewardHistoryItem:
    return RewardHistoryItem(
        id=tx.id,
        points=tx.points,
        action_type=tx.action_type,
        action_id=tx.action_id,
        description=tx.description,
        created_at=tx.created_at,
    )


@router.get("/wallet", response_model=WalletResponse)
def wallet(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recent = db.scalars(
        select(RewardTransaction)
        .where(RewardTransaction.user_id == user.id)
        .order_by(RewardTransaction.created_at.desc(), RewardTransaction.id.desc())
        .limit(10)
    ).all()
    today = points_earned_today(db, user.id)
    progress = tier_progress(user.points)
    return WalletResponse(
        user_id=user.id,
        name=user.name,
        points=user.points,
        tier=progress["tier"],
        next_tier=progress["next_tier"],
        points_to_next_tier=progress["points_to_next_tier"],
        progress_percent=progress["progress_percent"],
        points_today=today,
        daily_cap=settings.DAILY_POINTS_CAP,
        remaining_today=max(0, settings.DAILY_POINTS_CAP - today),
        recent_transactions=[_item(t) for t in recent],
    )


@router.get("/history", response_model=RewardHistoryResponse)
def history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = db.scalar(select(func.count()).select_from(RewardTransaction).where(RewardTransaction.user_id == user.id)) or 0
    rows = db.scalars(
        select(RewardTransaction)
        .where(RewardTransaction.user_id == user.id)
        .order_by(RewardTransaction.created_at.desc(), RewardTransaction.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return RewardHistoryResponse(items=[_item(t) for t in rows], total=total, page=page, page_size=page_size)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(
    ward: str | None = Query(None, description="Only rank citizens of this ward"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(User).where(User.role == "citizen")
    if ward:
        stmt = stmt.where(User.ward == ward)
    users = db.scalars(stmt.order_by(User.points.desc(), User.id.asc()).limit(limit)).all()
    return [
        LeaderboardEntry(
            rank=i,
            user_id=u.id,
            name=u.name,
            avatar_url=u.avatar_url,
            ward=u.ward,
            points=u.points,
            tier=u.tier,
        )
        for i, u in enumerate(users, start=1)
    ]


@router.post("/claim", response_model=ClaimResponse)
def claim(body: ClaimRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Legacy claim endpoint. Quizzes and Civic Academy courses are now verified by the server, so nothing is claimable.

    One claim per (user, action_type, action_id) ever - re-taking a quiz earns 0 - and
    everything still counts toward the daily cap. Verified actions (reports, votes,
    resolutions, cleanups) are awarded by the server and cannot be claimed here.
    """
    limits = CLIENT_CLAIMABLE.get(body.action_type)
    if limits is None:
        raise HTTPException(
            status_code=400,
            detail=f"action_type must be one of {sorted(CLIENT_CLAIMABLE)}; other rewards are awarded by the server",
        )
    low, high = limits
    points = min(max(body.points, low), high)
    result = award_points(db, user, body.action_type, body.action_id, points=points, description=f"{body.action_type.replace('_', ' ').capitalize()}: {body.action_id}")
    db.commit()
    db.refresh(user)
    return ClaimResponse(**result.as_dict(), user_points=user.points, user_tier=user.tier)
