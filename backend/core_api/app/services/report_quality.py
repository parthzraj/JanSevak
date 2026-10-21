"""Keeps junk out of the feed: reports need a real photo, a real description and a location,
and a report that repeats an existing one is turned away (with a pointer to the original).

Everything here raises HTTPException, so the router just calls it before saving anything.
"""
import math
import re
from collections import Counter
from datetime import timedelta
from difflib import SequenceMatcher
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import utcnow
from app.models.issue import CivicIssue
from app.models.user import User
from app.schemas.issue import IssueCreate
from app.services.points_engine import today_bounds_utc

MIN_TITLE_CHARS = 8
MIN_DESCRIPTION_CHARS = 30
MIN_DESCRIPTION_WORDS = 6
NEARBY_METRES = 150
DUPLICATE_WINDOW_DAYS = 14
OWN_DUPLICATE_WINDOW_HOURS = 24
SIMILARITY_OTHERS = 0.6
SIMILARITY_OWN = 0.75

_STOP = {"the", "a", "an", "is", "are", "of", "on", "in", "at", "near", "and", "to", "for", "has", "have", "been", "this", "that", "it"}


def _words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def description_problem(text: str) -> str | None:
    words = _words(text)
    letters = sum(c.isalpha() for c in text)
    if len(text) < MIN_DESCRIPTION_CHARS or len(words) < MIN_DESCRIPTION_WORDS:
        return (
            f"Please describe the problem properly (at least {MIN_DESCRIPTION_CHARS} characters and "
            f"{MIN_DESCRIPTION_WORDS} words): what is wrong, where exactly, and how it affects people."
        )
    if len(set(words)) < 4 or letters < 0.6 * len(text.replace(" ", "")):
        return "The description does not look like a real description. Please explain the problem in your own words."
    if max(Counter(text.replace(" ", "").lower()).values()) > 0.4 * len(text.replace(" ", "")):
        return "The description looks like random or repeated characters. Please explain the problem in your own words."
    return None


def check_report_content(body: IssueCreate) -> None:
    """Photo, description, title and location must be good enough to act on."""
    if not settings.STRICT_REPORT_RULES:
        return
    problems: list[str] = []
    if len(body.title) < MIN_TITLE_CHARS:
        problems.append(f"The title is too short (at least {MIN_TITLE_CHARS} characters), e.g. 'Deep pothole near metro pillar'.")
    problem = description_problem(body.description)
    if problem:
        problems.append(problem)

    has_gps = body.latitude is not None and body.longitude is not None
    if not has_gps and len((body.address or "").strip()) < 5:
        problems.append("Please add the location: an address, GPS, or a pin on the map.")

    if not body.image_urls:
        problems.append("Please attach at least one clear photo of the problem.")
    else:
        upload_dir = Path(settings.UPLOAD_DIR)
        for url in body.image_urls:
            name = url[len("/uploads/"):] if url.startswith("/uploads/") else ""
            if not name or "/" in name or "\\" in name or not (upload_dir / name).is_file():
                problems.append("A photo was not uploaded properly. Please attach it again.")
                break
    if problems:
        raise HTTPException(status_code=422, detail=" ".join(problems))


# ---------------------------------------------------------------- duplicates
def _tokens(text: str) -> set[str]:
    return {w for w in _words(text) if w not in _STOP and len(w) > 2}


def similarity(a: CivicIssue | IssueCreate, b: IssueCreate) -> float:
    ta, tb = _tokens(a.title + " " + a.description), _tokens(b.title + " " + b.description)
    jaccard = len(ta & tb) / len(ta | tb) if ta and tb else 0.0
    title_ratio = SequenceMatcher(None, a.title.lower().strip(), b.title.lower().strip()).ratio()
    return max(jaccard, title_ratio)


def _metres(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi, dlmb = p2 - p1, math.radians(lon2 - lon1)
    h = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 6371000 * 2 * math.asin(math.sqrt(h))


def _same_place(issue: CivicIssue, body: IssueCreate) -> bool:
    if None not in (issue.latitude, issue.longitude, body.latitude, body.longitude):
        return _metres(issue.latitude, issue.longitude, body.latitude, body.longitude) <= NEARBY_METRES
    a, b = (issue.address or "").strip().lower(), (body.address or "").strip().lower()
    return bool(a) and a == b


def check_not_duplicate(db: Session, user: User, body: IssueCreate) -> None:
    if not settings.STRICT_REPORT_RULES:
        return
    now = utcnow()
    candidates = db.scalars(
        select(CivicIssue)
        .where(
            CivicIssue.deleted_at.is_(None),
            CivicIssue.category == body.category,
            CivicIssue.status != "Resolved",
            CivicIssue.created_at >= now - timedelta(days=DUPLICATE_WINDOW_DAYS),
        )
        .order_by(CivicIssue.created_at.desc())
        .limit(300)
    ).unique().all()

    for issue in candidates:
        mine = issue.reporter_id == user.id
        if mine:
            if issue.created_at < now - timedelta(hours=OWN_DUPLICATE_WINDOW_HOURS):
                continue
            if similarity(issue, body) >= SIMILARITY_OWN:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "duplicate_own_report",
                        "message": f"You already reported this: '{issue.title}'. Add more photos to that report instead of filing it again.",
                        "issue_id": issue.id,
                        "title": issue.title,
                    },
                )
        elif _same_place(issue, body) and similarity(issue, body) >= SIMILARITY_OTHERS:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "duplicate_report",
                    "message": f"This looks like it has already been reported nearby: '{issue.title}'. Please support that report (upvote it, add a photo) instead of filing a new one.",
                    "issue_id": issue.id,
                    "title": issue.title,
                },
            )


def check_daily_limit(db: Session, user: User) -> None:
    if settings.MAX_REPORTS_PER_DAY <= 0:
        return
    start, end = today_bounds_utc()
    n = db.scalar(
        select(func.count()).select_from(CivicIssue).where(
            CivicIssue.reporter_id == user.id, CivicIssue.created_at >= start, CivicIssue.created_at < end
        )
    ) or 0
    if n >= settings.MAX_REPORTS_PER_DAY:
        raise HTTPException(
            status_code=429,
            detail=f"You have reached today's limit of {settings.MAX_REPORTS_PER_DAY} reports. Please try again tomorrow.",
        )
