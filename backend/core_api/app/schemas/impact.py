from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ReelCreator(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    ward: str | None


class ImpactReel(BaseModel):
    id: int  # the issue id: a reel is a resolved issue
    title: str
    description: str
    category: str
    locality: str | None
    creator: ReelCreator
    before_image: str | None
    after_image: str | None
    resolution_note: str | None
    resolved_at: datetime
    days_to_resolve: int
    supporters: int
    likes: int
    comments_count: int
    shares: int
    has_liked: bool
    is_saved: bool


class ImpactReelList(BaseModel):
    items: list[ImpactReel]
    total: int
    page: int
    pages: int


class ReactionResult(BaseModel):
    issue_id: int
    likes: int
    has_liked: bool
    is_saved: bool


class ShareBody(BaseModel):
    channel: Literal["whatsapp", "x", "telegram", "facebook", "copy", "native"]


class ShareResult(BaseModel):
    issue_id: int
    shares: int


class CategoryCount(BaseModel):
    category: str
    resolved: int


class ImpactStats(BaseModel):
    reports_total: int
    resolved_total: int
    resolution_rate: int  # percent, 0-100
    resolved_last_30_days: int
    avg_days_to_resolve: float | None
    citizens_supporting: int  # total upvotes on resolved issues
    citizens_reporting: int  # distinct reporters whose issue got resolved
    with_after_photo: int
    by_category: list[CategoryCount]
