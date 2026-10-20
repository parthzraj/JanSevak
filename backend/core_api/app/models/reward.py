from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint

from app.core.database import Base, UTCDateTime, utcnow


class RewardTransaction(Base):
    """Append-only points ledger. The unique constraint is the anti-cheat core:
    the same (user, action_type, action_id) can never be rewarded twice."""

    __tablename__ = "reward_transactions"
    __table_args__ = (
        UniqueConstraint("user_id", "action_type", "action_id", name="uq_user_reward_action"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    points = Column(Integer, nullable=False)  # may be 0 (capped) or negative (reversal)
    action_type = Column(String(50), nullable=False)
    action_id = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow, index=True)
