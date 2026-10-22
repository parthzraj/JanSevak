from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

# Must match backend/CONTRACT.md "Enum Alignment" exactly.
Category = Literal["Roads", "Water", "Sanitation", "Streetlights", "Public Safety", "Parks", "Community"]
Status = Literal["Reported", "Under Review", "In Progress", "Resolved"]
Priority = Literal["Low", "Medium", "High", "Critical"]

STATUS_ORDER: list[str] = ["Reported", "Under Review", "In Progress", "Resolved"]


def to_backend_priority(value: str) -> str:
    """Frontend says 'Urgent', backend stores 'Critical' (see CONTRACT.md)."""
    return "Critical" if value == "Urgent" else value


def to_ui_priority(value: str) -> str:
    return "Urgent" if value == "Critical" else value


class IssueCreate(BaseModel):
    title: str = Field(min_length=3, max_length=220)
    description: str = Field(min_length=3, max_length=5000)
    category: Category
    # Accepts the frontend's "Urgent" too and stores it as "Critical".
    priority: Literal["Low", "Medium", "High", "Critical", "Urgent"] = "Medium"
    address: str | None = Field(default=None, max_length=255)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    image_urls: list[str] = Field(default_factory=list, max_length=6)

    @field_validator("title", "description")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Too short")
        return v

    @field_validator("priority")
    @classmethod
    def _map_priority(cls, v: str) -> str:
        return to_backend_priority(v)

    @field_validator("image_urls")
    @classmethod
    def _check_urls(cls, v: list[str]) -> list[str]:
        for url in v:
            if len(url) > 500:
                raise ValueError("Image URL too long")
        return v


class IssueStatusUpdate(BaseModel):
    status: Status
    note: str | None = Field(default=None, max_length=500)
    # Only used when status == "Resolved": URLs from POST /api/uploads, shown as the "after" photo in Impact Reels.
    after_image_urls: list[str] = Field(default_factory=list, max_length=3)

    @field_validator("after_image_urls")
    @classmethod
    def _only_own_uploads(cls, v: list[str]) -> list[str]:
        for url in v:
            if not url.startswith("/uploads/") or ".." in url:
                raise ValueError("after_image_urls must be URLs returned by /api/uploads")
        return v


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)

    @field_validator("text")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Comment cannot be empty")
        return v


class CommentResponse(BaseModel):
    id: int
    issue_id: int
    user_id: int
    author: str
    avatar_url: str | None = None
    text: str
    is_official: bool
    created_at: datetime


class ReporterInfo(BaseModel):
    id: int
    name: str
    avatar_url: str | None = None
    ward: str | None = None


class TimelineEntry(BaseModel):
    status: str
    note: str | None = None
    created_at: datetime


class IssueResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str  # canonical backend value (Critical)
    priority_ui: str  # same, but Critical -> Urgent for the current frontend types
    status: str
    image_urls: list[str]
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    upvotes: int
    has_upvoted: bool = False
    comments_count: int = 0
    reporter: ReporterInfo
    created_at: datetime
    updated_at: datetime


class EvidenceItem(BaseModel):
    id: int
    url: str
    user_id: int
    author: str
    created_at: datetime


class EvidenceAddedResponse(BaseModel):
    evidence: list[EvidenceItem]
    points_awarded: int
    user_points: int
    user_tier: str


class SupporterItem(BaseModel):
    user_id: int
    name: str
    avatar_url: str | None = None
    ward: str | None = None
    supported_at: datetime


class SupportersResponse(BaseModel):
    total: int
    items: list[SupporterItem]


class IssueDetailResponse(IssueResponse):
    comments: list[CommentResponse] = []
    timeline: list[TimelineEntry] = []
    evidence: list[EvidenceItem] = []


class IssueListResponse(BaseModel):
    items: list[IssueResponse]
    total: int
    page: int
    page_size: int
    pages: int


class IssueCreatedResponse(BaseModel):
    issue: IssueDetailResponse
    points_awarded: int
    user_points: int
    user_tier: str
