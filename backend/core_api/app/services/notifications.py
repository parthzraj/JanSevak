from sqlalchemy.orm import Session

from app.models.notification import Notification


def notify(db: Session, user_id: int, title: str, message: str, type_: str = "info") -> None:
    """Queue a notification; the caller commits."""
    db.add(Notification(user_id=user_id, title=title[:150], message=message, type=type_))
