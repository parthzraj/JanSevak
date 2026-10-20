from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text

from app.core.database import Base, UTCDateTime, utcnow


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), nullable=False, default="info")  # info|upvote|comment|status|reward
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow, index=True)
