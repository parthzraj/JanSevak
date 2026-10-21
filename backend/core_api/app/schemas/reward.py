from datetime import datetime

from pydantic import BaseModel, Field


class RewardHistoryItem(BaseModel):
    id: int
    points: int
    action_type: str
    action_id: str
    description: str | None = None
    created_at: datetime


class WalletResponse(BaseModel):
    user_id: int
    name: str
    points: int
    tier: str
    next_tier: str | None
    points_to_next_tier: int
    progress_percent: int
    points_today: int
    daily_cap: int
    remaining_today: int
    recent_transactions: list[RewardHistoryItem]


class RewardHistoryResponse(BaseModel):
    items: list[RewardHistoryItem]
    total: int
    page: int
    page_size: int


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    name: str
    avatar_url: str | None = None
    ward: str | None = None
    points: int
    tier: str


class ClaimRequest(BaseModel):
    action_type: str = Field(description="Nothing can be claimed any more: every reward is awarded by the server")
    action_id: str = Field(min_length=1, max_length=50, pattern=r"^[A-Za-z0-9_.:-]+$")
    points: int = Field(ge=1, le=100)


class ClaimResponse(BaseModel):
    requested: int
    awarded: int
    duplicate: bool
    capped: bool
    user_points: int
    user_tier: str
