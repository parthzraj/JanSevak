from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base, UTCDateTime, utcnow


class Course(Base):
    """A course in the Civic Academy, authored by an NGO.

    Lifecycle: Draft (only the NGO sees it) -> Published -> Archived (hidden from Explore,
    people who already enrolled can still finish). Lessons are locked once someone enrolls."""

    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    ngo_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    summary = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    level = Column(String(15), nullable=False, default="Beginner")  # Beginner|Intermediate|Advanced
    category = Column(String(40), nullable=False, default="Civic basics")
    published_at = Column(UTCDateTime, nullable=True)
    archived_at = Column(UTCDateTime, nullable=True)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow, index=True)

    ngo = relationship("User", lazy="joined")
    lessons = relationship(
        "Lesson", cascade="all, delete-orphan", order_by="Lesson.position", lazy="selectin", back_populates="course"
    )


class Lesson(Base):
    __tablename__ = "course_lessons"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False)  # 1-based, lessons must be done in this order
    kind = Column(String(10), nullable=False)  # video | reading | task
    title = Column(String(150), nullable=False)
    summary = Column(String(500), nullable=False)  # public: what the learner will learn / do
    # video
    video_url = Column(String(500), nullable=True)  # YouTube link or a direct .mp4/.webm link
    duration_seconds = Column(Integer, nullable=True)
    # reading
    body = Column(Text, nullable=True)
    # task
    task_mode = Column(String(10), nullable=True)  # physical | online
    instructions = Column(Text, nullable=True)  # public: exactly what to do
    proof_type = Column(String(10), nullable=True)  # photo | link | text

    course = relationship("Course", back_populates="lessons")


class Enrollment(Base):
    __tablename__ = "course_enrollments"
    __table_args__ = (UniqueConstraint("course_id", "user_id", name="uq_course_enrollment"),)

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    enrolled_at = Column(UTCDateTime, nullable=False, default=utcnow)
    completed_at = Column(UTCDateTime, nullable=True)
    certificate_code = Column(String(30), nullable=True, unique=True, index=True)
    points_awarded = Column(Integer, nullable=False, default=0)

    user = relationship("User", lazy="joined")
    course = relationship("Course", lazy="joined")


class LessonProgress(Base):
    """One learner's state on one lesson. Also holds the proof + the NGO's verdict for task lessons."""

    __tablename__ = "course_lesson_progress"
    __table_args__ = (UniqueConstraint("enrollment_id", "lesson_id", name="uq_lesson_progress"),)

    id = Column(Integer, primary_key=True)
    enrollment_id = Column(Integer, ForeignKey("course_enrollments.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("course_lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    # in_progress | submitted | rejected | done
    status = Column(String(12), nullable=False, default="in_progress")
    started_at = Column(UTCDateTime, nullable=False, default=utcnow)
    completed_at = Column(UTCDateTime, nullable=True)
    # video watch accounting (server-side, see routers/academy.py)
    watched_seconds = Column(Float, nullable=False, default=0.0)
    last_position = Column(Float, nullable=False, default=0.0)
    max_position = Column(Float, nullable=False, default=0.0)  # furthest second honestly watched
    last_heartbeat_at = Column(UTCDateTime, nullable=True)
    session_started_at = Column(UTCDateTime, nullable=True)  # first beat of the current viewing
    session_credit = Column(Float, nullable=False, default=0.0)  # seconds credited in the current viewing
    # task proof + review
    proof_text = Column(Text, nullable=True)
    proof_url = Column(String(500), nullable=True)
    attempts = Column(Integer, nullable=False, default=0)
    feedback = Column(String(500), nullable=True)
    reviewed_at = Column(UTCDateTime, nullable=True)
    submitted_at = Column(UTCDateTime, nullable=True)

    lesson = relationship("Lesson", lazy="joined")
    enrollment = relationship("Enrollment", lazy="joined")
