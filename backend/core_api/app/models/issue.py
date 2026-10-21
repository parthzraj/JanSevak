import json

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base, UTCDateTime, utcnow


class CivicIssue(Base):
    __tablename__ = "civic_issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(220), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    priority = Column(String(20), nullable=False, default="Medium")  # Low|Medium|High|Critical
    status = Column(String(30), nullable=False, default="Reported", index=True)
    image_urls = Column(Text, nullable=False, default="[]")  # JSON array of strings
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    upvotes = Column(Integer, nullable=False, default=0)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow, index=True)
    updated_at = Column(UTCDateTime, nullable=False, default=utcnow, onupdate=utcnow)

    reporter = relationship("User", lazy="joined")
    comments = relationship(
        "IssueComment", back_populates="issue", cascade="all, delete-orphan", order_by="IssueComment.created_at"
    )
    timeline = relationship(
        "IssueTimelineEvent",
        back_populates="issue",
        cascade="all, delete-orphan",
        order_by="IssueTimelineEvent.id",
    )
    evidence = relationship(
        "IssueEvidence",
        back_populates="issue",
        cascade="all, delete-orphan",
        order_by="IssueEvidence.id",
    )

    @property
    def images(self) -> list[str]:
        try:
            value = json.loads(self.image_urls or "[]")
            return [str(v) for v in value] if isinstance(value, list) else []
        except (ValueError, TypeError):
            return []


class IssueVote(Base):
    __tablename__ = "issue_votes"
    __table_args__ = (UniqueConstraint("issue_id", "user_id", name="uq_issue_user_vote"),)

    id = Column(Integer, primary_key=True)
    issue_id = Column(Integer, ForeignKey("civic_issues.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow)


class IssueComment(Base):
    __tablename__ = "issue_comments"

    id = Column(Integer, primary_key=True)
    issue_id = Column(Integer, ForeignKey("civic_issues.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    is_official = Column(Boolean, nullable=False, default=False)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow)

    issue = relationship("CivicIssue", back_populates="comments")
    author = relationship("User", lazy="joined")


class IssueTimelineEvent(Base):
    """One row per status change, so the issue detail page can show a timeline."""

    __tablename__ = "issue_timeline"
    __table_args__ = (Index("ix_issue_timeline_issue", "issue_id"),)

    id = Column(Integer, primary_key=True)
    issue_id = Column(Integer, ForeignKey("civic_issues.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), nullable=False)
    note = Column(String(500), nullable=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow)

    issue = relationship("CivicIssue", back_populates="timeline")


class IssueEvidence(Base):
    """A photo added to an existing issue by any citizen (on-site verification)."""

    __tablename__ = "issue_evidence"

    id = Column(Integer, primary_key=True)
    issue_id = Column(Integer, ForeignKey("civic_issues.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    image_url = Column(String(255), nullable=False)
    image_hash = Column(String(16), nullable=True, index=True)  # perceptual hash, used to spot re-used photos
    created_at = Column(UTCDateTime, nullable=False, default=utcnow)

    issue = relationship("CivicIssue", back_populates="evidence")
    author = relationship("User", lazy="joined")
