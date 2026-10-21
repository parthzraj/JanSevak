from datetime import datetime
from typing import Literal

import re

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
    account_type: Literal["citizen", "ngo"] = "citizen"
    ngo_code: str | None = Field(default=None, max_length=100)  # required for account_type=ngo

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


AVATAR_PRESETS = {"man-1", "man-2", "man-3", "woman-1", "woman-2", "woman-3", "neutral-1", "neutral-2"}


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    ward: str | None = Field(default=None, max_length=80)
    # "preset:<key>" (built-in illustration), a "/uploads/..." photo, or "" to go back to the initials avatar
    avatar_url: str | None = Field(default=None, max_length=255)
    # Optional details. An empty string clears the field.
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=80)
    pincode: str | None = Field(default=None, max_length=6)
    bio: str | None = Field(default=None, max_length=280)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        digits = re.sub(r"[\s\-()]", "", v.strip())
        if digits == "":
            return ""
        if digits.startswith("+91"):
            digits = digits[3:]
        elif digits.startswith("0") and len(digits) == 11:
            digits = digits[1:]
        if not re.fullmatch(r"[6-9]\d{9}", digits):
            raise ValueError("Enter a valid 10-digit Indian mobile number")
        return digits

    @field_validator("pincode")
    @classmethod
    def _pincode(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if v and not re.fullmatch(r"[1-9]\d{5}", v):
            raise ValueError("PIN code must be 6 digits")
        return v

    @field_validator("address", "city", "bio")
    @classmethod
    def _trim(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v

    @field_validator("avatar_url")
    @classmethod
    def _avatar(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return v
        if v.startswith("preset:") and v[len("preset:"):] in AVATAR_PRESETS:
            return v
        if v.startswith("/uploads/") and ".." not in v and "/" not in v[len("/uploads/"):]:
            return v
        raise ValueError("avatar_url must be a built-in avatar or an uploaded photo")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    ward: str | None = None
    avatar_url: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    pincode: str | None = None
    bio: str | None = None
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


class PublicUserResponse(BaseModel):
    """What other citizens may see about a user: no email, no role-internal data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    ward: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    role: str
    points: int
    tier: str
    reports_count: int
    supported_count: int
    resolved_count: int
    created_at: datetime
