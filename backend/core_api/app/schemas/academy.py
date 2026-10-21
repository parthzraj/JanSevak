from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.volunteer import Person
from app.services.video import parse_video_url

Level = Literal["Beginner", "Intermediate", "Advanced"]
Kind = Literal["video", "reading", "task"]
TaskMode = Literal["physical", "online"]
ProofType = Literal["photo", "link", "text"]
CATEGORIES = ("Civic basics", "Water", "Waste", "Safety", "Rights & RTI", "Environment", "Health", "Other")
Category = Literal["Civic basics", "Water", "Waste", "Safety", "Rights & RTI", "Environment", "Health", "Other"]
CourseStatus = Literal["Draft", "Published", "Archived"]
LessonState = Literal["locked", "available", "in_progress", "submitted", "rejected", "done"]


# --------------------------------------------------------------- authoring
class LessonIn(BaseModel):
    kind: Kind
    title: str = Field(min_length=3, max_length=150)
    summary: str = Field(min_length=10, max_length=500)
    video_url: str | None = Field(default=None, max_length=500)
    duration_seconds: int | None = Field(default=None, ge=10, le=4 * 3600)
    body: str | None = Field(default=None, max_length=20000)
    task_mode: TaskMode | None = None
    instructions: str | None = Field(default=None, max_length=2000)
    proof_type: ProofType | None = None

    @model_validator(mode="after")
    def _per_kind(self):
        if self.kind == "video":
            try:
                parse_video_url(self.video_url or "")
            except ValueError as e:
                raise ValueError(str(e))
            if not self.duration_seconds:
                raise ValueError("Enter the video length (it decides how much a learner has to watch)")
            self.body = self.task_mode = self.instructions = self.proof_type = None
        elif self.kind == "reading":
            if not self.body or len(self.body.strip()) < 100:
                raise ValueError("A reading lesson needs at least 100 characters of text")
            self.video_url = self.duration_seconds = self.task_mode = self.instructions = self.proof_type = None
        else:  # task
            if not self.task_mode or not self.proof_type:
                raise ValueError("A task needs a mode (physical or online) and a proof type")
            if not self.instructions or len(self.instructions.strip()) < 20:
                raise ValueError("Describe the task in at least 20 characters so learners know exactly what to do")
            self.video_url = self.duration_seconds = self.body = None
        return self


class CourseCreate(BaseModel):
    title: str = Field(min_length=5, max_length=150)
    summary: str = Field(min_length=10, max_length=300)
    description: str = Field(min_length=30, max_length=5000)
    level: Level = "Beginner"
    category: Category = "Civic basics"
    lessons: list[LessonIn] = Field(default_factory=list, max_length=30)
    publish: bool = False


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=150)
    summary: str | None = Field(default=None, min_length=10, max_length=300)
    description: str | None = Field(default=None, min_length=30, max_length=5000)
    level: Level | None = None
    category: Category | None = None
    lessons: list[LessonIn] | None = Field(default=None, max_length=30)


# ------------------------------------------------------------------ output
class LessonOut(BaseModel):
    id: int
    position: int
    kind: Kind
    title: str
    summary: str
    duration_seconds: int | None = None
    task_mode: TaskMode | None = None
    instructions: str | None = None
    proof_type: ProofType | None = None
    required_seconds: int = 0  # video: seconds that must really be watched; reading: minimum time on the page
    # content, only for the author or an enrolled learner on an unlocked lesson
    video_kind: str | None = None
    video_ref: str | None = None
    body: str | None = None
    # learner state (None when the viewer is not enrolled)
    state: LessonState | None = None
    percent: int = 0
    watched_seconds: int = 0
    resume_seconds: int = 0  # video: where to continue
    proof_text: str | None = None
    proof_url: str | None = None
    feedback: str | None = None
    attempts: int = 0


class EnrollmentOut(BaseModel):
    percent: int
    completed: bool
    completed_at: datetime | None
    certificate_code: str | None
    points_awarded: int
    next_lesson_id: int | None
    enrolled_at: datetime


class CourseOut(BaseModel):
    id: int
    title: str
    summary: str
    level: Level
    category: str
    ngo: Person
    status: CourseStatus
    lessons_count: int
    video_count: int
    reading_count: int
    task_count: int
    estimated_minutes: int
    enrolled_count: int
    completed_count: int
    points: int
    is_owner: bool
    my: EnrollmentOut | None = None
    pending_reviews: int = 0  # owner only
    created_at: datetime
    published_at: datetime | None


class CourseDetail(CourseOut):
    description: str
    lessons: list[LessonOut]


class CourseList(BaseModel):
    items: list[CourseOut]
    total: int


class HeartbeatBody(BaseModel):
    position: float = Field(ge=0, le=4 * 3600 + 60)


class SubmitBody(BaseModel):
    proof_text: str | None = Field(default=None, max_length=2000)
    proof_url: str | None = Field(default=None, max_length=500)

    @field_validator("proof_text", "proof_url")
    @classmethod
    def _strip(cls, v):
        v = (v or "").strip()
        return v or None


class CertificateOut(BaseModel):
    code: str
    course_id: int
    course_title: str
    level: str
    category: str
    issuer: Person
    learner_name: str
    completed_at: datetime
    lessons_count: int
    tasks_verified: int
    points_awarded: int


class ProgressOut(BaseModel):
    lesson: LessonOut
    enrollment: EnrollmentOut
    certificate: CertificateOut | None = None
    notes: list[str] = []


class ReviewItem(BaseModel):
    id: int  # lesson-progress id
    course_id: int
    course_title: str
    lesson_id: int
    lesson_title: str
    task_mode: str | None
    instructions: str | None
    proof_type: str | None
    learner: Person
    proof_text: str | None
    proof_url: str | None
    attempts: int
    status: str  # submitted | rejected | done
    feedback: str | None
    submitted_at: datetime | None


class ReviewDecision(BaseModel):
    decision: Literal["approve", "reject"]
    feedback: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def _need_reason(self):
        if self.decision == "reject" and len((self.feedback or "").strip()) < 5:
            raise ValueError("Tell the learner what to fix (at least 5 characters)")
        return self


class ReviewResult(BaseModel):
    item: ReviewItem
    course_completed: bool
