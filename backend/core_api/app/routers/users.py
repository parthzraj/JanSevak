"""Public profile of any citizen (what you see when you tap a name on a post)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.auth import PublicUserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=PublicUserResponse)
def public_profile(user_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
