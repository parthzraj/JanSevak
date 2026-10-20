from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _check_password(value: str) -> str:
    if len(value) < 6:
        raise ValueError("Password must be at least 6 characters")
    if len(value.encode("utf-8")) > 72:  # bcrypt limit
        raise ValueError("Password must be at most 72 bytes")
    return value


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str
    ward: str | None = Field(default=None, max_length=80)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name is too short")
        return v

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        return _check_password(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    ward: str | None = Field(default=None, max_length=80)
    avatar_url: str | None = Field(default=None, max_length=255)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    ward: str | None = None
    avatar_url: str | None = None
    role: str
    points: int
    tier: str
    volunteer_hours: float
    reports_count: int
    supported_count: int
    resolved_count: int
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
