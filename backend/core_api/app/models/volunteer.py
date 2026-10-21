from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base, UTCDateTime, utcnow


class Vacancy(Base):
    """A volunteering role / internship posted by an NGO that citizens can apply to."""

    __tablename__ = "vacancies"

    id = Column(Integer, primary_key=True)
    ngo_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    role_type = Column(String(20), nullable=False, default="Volunteer")  # Volunteer|Internship|Fellowship|Part-time
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)
    commitment = Column(String(100), nullable=True)  # free text, e.g. "4 hrs / week for 2 months"
    skills = Column(String(255), nullable=True)
    slots = Column(Integer, nullable=False, default=1)
    deadline = Column(UTCDateTime, nullable=True)
    closed_at = Column(UTCDateTime, nullable=True)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow, index=True)

    ngo = relationship("User", lazy="joined")


class VacancyApplication(Base):
    __tablename__ = "vacancy_applications"
    __table_args__ = (UniqueConstraint("vacancy_id", "user_id", name="uq_vacancy_applicant"),)

    id = Column(Integer, primary_key=True)
    vacancy_id = Column(Integer, ForeignKey("vacancies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    note = Column(String(1000), nullable=True)
    status = Column(String(15), nullable=False, default="Applied")  # Applied|Accepted|Rejected|Completed|Withdrawn
    points_awarded = Column(Integer, nullable=False, default=0)
    created_at = Column(UTCDateTime, nullable=False, default=utcnow)
    updated_at = Column(UTCDateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", lazy="joined")


class Campaign(Base):
    """A civic drive (clean-up, plantation, awareness, repair...) organised by an NGO or a citizen,
    optionally tied to a reported issue."""

    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True)
    organiser_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    issue_id = Column(Integer, ForeignKey("civic_issues.id"), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    kind = Column(String(30), nullable=False, default="Cleanup")
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    starts_at = Column(UTCDateTime, nullable=False, index=True)
    ends_at = Column(UTCDateTime, nullable=False)
    volunteers_needed = Column(Integer, nullable=False, default=10)
    cancelled_at = Column(UTCDateTime, nullable=True)
    completed_at = Column(UTCDateTime, nullable=True)
    host_points = Column(Integer, nullable=False, default=0)  # points actually paid to the organiser
    created_at = Column(UTCDateTime, nullable=False, default=utcnow, index=True)

    organiser = relationship("User", lazy="joined")
    issue = relationship("CivicIssue", lazy="joined")


class CampaignMember(Base):
    __tablename__ = "campaign_members"
    __table_args__ = (UniqueConstraint("campaign_id", "user_id", name="uq_campaign_member"),)

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(10), nullable=False, default="Joined")  # Joined|Attended|NoShow
    points_awarded = Column(Integer, nullable=False, default=0)
    joined_at = Column(UTCDateTime, nullable=False, default=utcnow)

    user = relationship("User", lazy="joined")
