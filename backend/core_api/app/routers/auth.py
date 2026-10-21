import hmac
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import TokenResponse, UserLogin, UserRegister, UserResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Auth"])

_BAD_LOGIN = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
    headers={"WWW-Authenticate": "Bearer"},
)


def _token_for(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user.id), user=UserResponse.model_validate(user))


def _find_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.lower()))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserRegister, db: Session = Depends(get_db)):
    if _find_by_email(db, body.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    role = "citizen"
    if body.account_type == "ngo":
        expected = settings.NGO_SIGNUP_CODE
        if not expected or not hmac.compare_digest((body.ngo_code or "").encode(), expected.encode()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="NGO sign-up needs a valid NGO code from the JanSevak team",
            )
        role = "ngo"

    user = User(
        name=body.name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        ward=body.ward,
        role=role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # two simultaneous sign-ups with the same email
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    db.refresh(user)
    return _token_for(user)


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = _find_by_email(db, body.email)
    if user is None or not verify_password(body.password, user.password_hash):
        raise _BAD_LOGIN
    return _token_for(user)


@router.post("/token", include_in_schema=True, summary="OAuth2 form login (used by Swagger 'Authorize')")
def token(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = _find_by_email(db, form.username)
    if user is None or not verify_password(form.password, user.password_hash):
        raise _BAD_LOGIN
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserResponse)
def update_me(body: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "avatar_url":
            user.avatar_url = value or None  # "" resets to the initials avatar
        elif field in ("phone", "address", "city", "pincode", "bio"):
            setattr(user, field, value or None)  # "" clears the field
        elif value is not None:
            setattr(user, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(user)
    return user
