from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, field_validator

CampaignKind = Literal["Cleanup", "Tree Plantation", "Awareness", "Repair", "Donation Drive", "Other"]
CampaignStatus = Literal["Upcoming", "Ongoing", "Awaiting wrap-up", "Completed", "Cancelled"]
RoleType = Literal["Volunteer", "Internship", "Fellowship", "Part-time"]


def _aware(v: datetime | None) -> datetime | None:
    """Naive datetimes are read as UTC (the frontend always sends an ISO string with a Z)."""
    if v is not None and v.tzinfo is None:
        return v.replace(tzinfo=timezone.utc)
    return v


class Person(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    ward: str | None
    is_ngo: bool = False


# ------------------------------------------------------------------ campaigns
class CampaignCreate(BaseModel):
    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=10, max_length=3000)
    kind: CampaignKind = "Cleanup"
    issue_id: int | None = None
    address: str | None = Field(default=None, max_length=255)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    starts_at: datetime
    ends_at: datetime
    volunteers_needed: int = Field(default=10, ge=1, le=500)

    _tz = field_validator("starts_at", "ends_at")(_aware)


class CampaignUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=150)
    description: str | None = Field(default=None, min_length=10, max_length=3000)
    address: str | None = Field(default=None, max_length=255)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    volunteers_needed: int | None = Field(default=None, ge=1, le=500)

    _tz = field_validator("starts_at", "ends_at")(_aware)


class IssueBrief(BaseModel):
    id: int
    title: str
    category: str
    status: str


class MemberOut(BaseModel):
    user_id: int
    name: str
    avatar_url: str | None
    ward: str | None
    status: str  # Joined | Attended | NoShow
    points_awarded: int


class CampaignOut(BaseModel):
    id: int
    title: str
    description: str
    kind: str
    status: CampaignStatus
    organiser: Person
    organiser_type: Literal["NGO", "Citizen"]
    issue: IssueBrief | None
    address: str | None
    latitude: float | None
    longitude: float | None
    starts_at: datetime
    ends_at: datetime
    volunteers_needed: int
    volunteers_joined: int
    volunteers_attended: int
    my_status: str | None  # None | Joined | Attended | NoShow
    is_organiser: bool
    host_points: int
    points_per_volunteer: int
    created_at: datetime


class CampaignList(BaseModel):
    items: list[CampaignOut]
    total: int
    page: int
    pages: int


class CampaignDetail(CampaignOut):
    members: list[MemberOut]


class CompleteBody(BaseModel):
    attended_user_ids: list[int] = Field(default_factory=list, max_length=500)


class CompleteResult(BaseModel):
    campaign: CampaignDetail
    attended: int
    no_show: int
    host_points_awarded: int
    volunteers_paid: int
    notes: list[str]


# ------------------------------------------------------------------ vacancies
class VacancyCreate(BaseModel):
    title: str = Field(min_length=4, max_length=150)
    role_type: RoleType = "Volunteer"
    description: str = Field(min_length=10, max_length=3000)
    location: str | None = Field(default=None, max_length=255)
    commitment: str | None = Field(default=None, max_length=100)
    skills: str | None = Field(default=None, max_length=255)
    slots: int = Field(default=1, ge=1, le=200)
    deadline: datetime | None = None

    _tz = field_validator("deadline")(_aware)


class VacancyOut(BaseModel):
    id: int
    title: str
    role_type: str
    description: str
    location: str | None
    commitment: str | None
    skills: str | None
    slots: int
    accepted_count: int
    applicants_count: int
    deadline: datetime | None
    is_open: bool
    ngo: Person
    is_owner: bool
    my_application: str | None  # None | Applied | Accepted | Rejected | Completed | Withdrawn
    created_at: datetime


class VacancyList(BaseModel):
    items: list[VacancyOut]
    total: int


class ApplyBody(BaseModel):
    note: str | None = Field(default=None, max_length=1000)


class ApplicationOut(BaseModel):
    id: int
    vacancy_id: int
    applicant: Person
    note: str | None
    status: str
    points_awarded: int
    created_at: datetime


class ApplicationDecision(BaseModel):
    status: Literal["Accepted", "Rejected", "Completed"]


class MyApplicationOut(BaseModel):
    id: int
    status: str
    points_awarded: int
    vacancy: VacancyOut
