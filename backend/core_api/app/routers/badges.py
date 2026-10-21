from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.badges import earned_badges

router = APIRouter(prefix="/badges", tags=["Badges"])


class EarnedBadge(BaseModel):
    id: str
    name: str
    description: str
    requirement: str
    category: str
    earned_at: datetime


@router.get("/mine", response_model=list[EarnedBadge])
def my_badges(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Only the badges this citizen has actually earned, newest first."""
    return earned_badges(db, user)
