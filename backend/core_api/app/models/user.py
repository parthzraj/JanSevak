from sqlalchemy import Column, Float, Integer, String

from app.core.database import Base, UTCDateTime, utcnow


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    ward = Column(String(80), nullable=True)
    avatar_url = Column(String(255), nullable=True)

    # Contact and about-me details the citizen chooses to add (private: other citizens only ever see `bio`)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(80), nullable=True)
    pincode = Column(String(6), nullable=True)
    bio = Column(String(280), nullable=True)

    # "citizen" (default) | "official" | "ngo" | "admin". Only officials/admins can change issue status;
    # only NGOs/admins can publish contests.
    role = Column(String(20), nullable=False, default="citizen", server_default="citizen")

    points = Column(Integer, nullable=False, default=0)  # lifetime karma points
    tier = Column(String(20), nullable=False, default="Bronze")
    volunteer_hours = Column(Float, nullable=False, default=0.0)
    reports_count = Column(Integer, nullable=False, default=0)
    supported_count = Column(Integer, nullable=False, default=0)
    resolved_count = Column(Integer, nullable=False, default=0)

    created_at = Column(UTCDateTime, nullable=False, default=utcnow)
    updated_at = Column(UTCDateTime, nullable=False, default=utcnow, onupdate=utcnow)
