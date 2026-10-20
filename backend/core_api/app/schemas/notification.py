from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    unread_count: int
