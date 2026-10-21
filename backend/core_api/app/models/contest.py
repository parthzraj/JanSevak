from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text, UniqueConstraint

from app.core.database import Base, UTCDateTime, utcnow


class Contest(Base):
    """A quiz contest published by an NGO. Questions (with answers) are stored as JSON and never
    sent to players until they start, and answers are only shown after the contest ends."""

    __tablename__ = "contests"

    id = Column(Integer, primary_key=True)
    ngo_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    topic = Column(String(50), nullable=False, default="General")
    description = Column(Text, nullable=False, default="")
    prize = Column(String(255), nullable=True)  # what the NGO adds on top of points (voucher, seat...)
    questions = Column(Text, nullable=False)  # JSON: [{question, options, answer_index, explanation}]
    time_limit_seconds = Column(Integer, nullable=False, default=300)
    starts_at = Column(UTCDateTime, nullable=False, index=True)
    ends_at = Column(UTCDateTime, nullable=False, index=True)
    finalized_at = Column(UTCDateTime, nullable=True)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow)


class ContestEntry(Base):
    """One citizen's single attempt at one contest."""

    __tablename__ = "contest_entries"
    __table_args__ = (UniqueConstraint("contest_id", "user_id", name="uq_contest_user"),)

    id = Column(Integer, primary_key=True)
    contest_id = Column(Integer, ForeignKey("contests.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    started_at = Column(UTCDateTime, nullable=False, default=utcnow)
    submitted_at = Column(UTCDateTime, nullable=True)
    score = Column(Integer, nullable=True)
    total = Column(Integer, nullable=False, default=0)
    duration_seconds = Column(Float, nullable=True)
    answers = Column(Text, nullable=True)  # JSON list of chosen option indexes
    rank = Column(Integer, nullable=True)  # set when the contest is finalised
    bonus_points = Column(Integer, nullable=False, default=0)  # points actually paid
