"""Password hashing, JWT handling and the auth dependencies."""
from datetime import timedelta

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db, utcnow
from app.models.user import User

# auto_error=False so we can return our own 401 and also support optional auth.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: int, expires_minutes: int | None = None) -> str:
    expire = utcnow() + timedelta(minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError, TypeError):
        return None


def get_current_user(
    token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    if not token:
        raise _CREDENTIALS_ERROR
    user_id = decode_access_token(token)
    if user_id is None:
        raise _CREDENTIALS_ERROR
    user = db.get(User, user_id)
    if user is None:
        raise _CREDENTIALS_ERROR
    return user


def get_optional_user(
    token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User | None:
    """Like get_current_user but returns None for anonymous / bad-token requests."""
    if not token:
        return None
    user_id = decode_access_token(token)
    return db.get(User, user_id) if user_id is not None else None


def require_official(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("official", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only municipal officials or admins can do this",
        )
    return user


def require_ngo(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("ngo", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only NGO accounts can publish contests")
    return user
