from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    unread_only: bool = False,
    limit: int = Query(30, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    items = db.scalars(stmt.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit)).all()
    unread = db.scalar(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user.id, Notification.is_read.is_(False)
        )
    )
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items], unread_count=unread or 0
    )


@router.post("/read-all")
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return {"marked_read": result.rowcount}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.get(Notification, notification_id)
    if n is None or n.user_id != user.id:  # same 404 for "not yours" - don't leak other users' ids
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n
