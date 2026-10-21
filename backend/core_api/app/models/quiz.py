from sqlalchemy import Boolean, Column, ForeignKey, Integer, String

from app.core.database import Base, UTCDateTime, utcnow


class QuizAttempt(Base):
    """One graded attempt. Replays are allowed; points are only paid once (see rewards ledger)."""

    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    quiz_id = Column(String(50), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False, default=False)
    points_awarded = Column(Integer, nullable=False, default=0)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow, index=True)
