from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, Field, field_validator, model_validator


class QuestionIn(BaseModel):
    question: str = Field(min_length=5, max_length=300)
    options: list[str] = Field(min_length=2, max_length=5)
    answer_index: int = Field(ge=0)
    explanation: str = Field(default="", max_length=500)

    @field_validator("options")
    @classmethod
    def _options(cls, v: list[str]) -> list[str]:
        v = [o.strip() for o in v]
        if any(not o or len(o) > 150 for o in v):
            raise ValueError("Every option needs 1-150 characters")
        if len({o.lower() for o in v}) != len(v):
            raise ValueError("Options must be different from each other")
        return v

    @model_validator(mode="after")
    def _answer_in_range(self):
        if self.answer_index >= len(self.options):
            raise ValueError("answer_index must point at one of the options")
        return self


def _utc(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


class ContestCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    topic: str = Field(default="General", min_length=2, max_length=50)
    description: str = Field(default="", max_length=1000)
    prize: str | None = Field(default=None, max_length=255)
    time_limit_seconds: int = Field(default=300, ge=30, le=3600)
    starts_at: datetime | None = None  # default: now
    ends_at: datetime
    questions: list[QuestionIn] = Field(min_length=3, max_length=20)

    @model_validator(mode="after")
    def _window(self):
        self.ends_at = _utc(self.ends_at)
        if self.starts_at is not None:
            self.starts_at = _utc(self.starts_at)
        start = self.starts_at or datetime.now(timezone.utc)
        if self.ends_at <= start:
            raise ValueError("The contest must end after it starts")
        if self.ends_at <= datetime.now(timezone.utc):
            raise ValueError("The end time must be in the future")
        if self.ends_at - start > timedelta(days=60):
            raise ValueError("A contest can run for at most 60 days")
        return self


class MyEntry(BaseModel):
    state: str  # not_started | in_progress | submitted
    score: int | None = None
    total: int = 0
    rank: int | None = None
    bonus_points: int = 0
    duration_seconds: float | None = None


class ContestOut(BaseModel):
    id: int
    title: str
    topic: str
    description: str
    prize: str | None
    ngo_id: int
    ngo_name: str
    status: str  # upcoming | live | ended
    starts_at: datetime
    ends_at: datetime
    time_limit_seconds: int
    question_count: int
    participants: int
    finalized: bool
    my_entry: MyEntry | None = None


class PlayQuestion(BaseModel):
    id: int
    question: str
    options: list[str]


class StartResponse(BaseModel):
    contest: ContestOut
    started_at: datetime
    deadline: datetime
    questions: list[PlayQuestion]


class SubmitBody(BaseModel):
    answers: list[int]


class SubmitResponse(BaseModel):
    score: int
    total: int
    duration_seconds: float
    timed_out: bool
    note: str


class LeaderRow(BaseModel):
    rank: int
    user_id: int
    name: str
    avatar_url: str | None
    score: int
    total: int
    duration_seconds: float
    bonus_points: int
    is_me: bool


class LeaderboardResponse(BaseModel):
    contest: ContestOut
    rows: list[LeaderRow]
    prizes: dict[int, int]
    participation_points: int


class ReviewItem(BaseModel):
    question: str
    options: list[str]
    your_answer: int | None
    correct_index: int
    correct: bool
    explanation: str
