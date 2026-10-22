"""The demo dataset must be internally consistent, or the demo will contradict itself on screen."""
import json
import sys
from pathlib import Path

from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal, utcnow  # noqa: E402
from app.models import (  # noqa: E402
    Campaign, CampaignMember, CivicIssue, Contest, ContestEntry, Enrollment, IssueVote, RewardTransaction, User,
)
from app.services.points_engine import today_bounds_utc, tier_for  # noqa: E402


def _load():
    import demo_data

    with SessionLocal() as db:
        demo_data.build(db)


def test_points_match_the_ledger_and_tiers(client):
    _load()
    with SessionLocal() as db:
        for u in db.scalars(select(User)):
            ledger = db.scalar(select(func.coalesce(func.sum(RewardTransaction.points), 0)).where(RewardTransaction.user_id == u.id))
            assert u.points == ledger, u.email
            assert u.tier == tier_for(u.points)
        top = db.scalars(select(User).where(User.role == "citizen").order_by(User.points.desc())).first()
        assert top.points >= 750  # a Platinum champion exists for the leaderboard


def test_daily_cap_is_respected_in_history(client):
    _load()
    from app.core.config import settings
    from app.services.points_engine import UNCAPPED_ACTIONS, _local_tz

    with SessionLocal() as db:
        per_day = {}
        for t in db.scalars(select(RewardTransaction).where(RewardTransaction.action_type.not_in(UNCAPPED_ACTIONS))):
            key = (t.user_id, t.created_at.astimezone(_local_tz()).date())
            per_day[key] = per_day.get(key, 0) + t.points
        assert max(per_day.values()) <= settings.DAILY_POINTS_CAP


def test_main_demo_accounts_can_still_earn_today(client):
    _load()
    start = today_bounds_utc()[0]
    with SessionLocal() as db:
        for email in ("ayush@example.com", "priya@example.com", "rahul@example.com"):
            u = db.scalar(select(User).where(User.email == email))
            n = db.scalar(select(func.count()).select_from(RewardTransaction).where(RewardTransaction.user_id == u.id, RewardTransaction.created_at >= start))
            assert n == 0, email


def test_reports_have_photos_and_resolved_ones_have_before_and_after(client):
    _load()
    with SessionLocal() as db:
        issues = list(db.scalars(select(CivicIssue)))
        assert len(issues) >= 30
        for i in issues:
            assert i.images and i.images[0].startswith("/uploads/")
            assert i.upvotes == db.scalar(select(func.count()).select_from(IssueVote).where(IssueVote.issue_id == i.id))
        resolved = [i for i in issues if i.status == "Resolved"]
        assert len(resolved) >= 8
        for i in resolved:
            assert i.resolution_images and i.resolution_note and i.resolved_at and i.resolved_at > i.created_at
        assert {i.status for i in issues} == {"Reported", "Under Review", "In Progress", "Resolved"}


def test_certificates_contests_and_drives_are_coherent(client):
    _load()
    with SessionLocal() as db:
        certs = list(db.scalars(select(Enrollment).where(Enrollment.completed_at.is_not(None))))
        assert len(certs) >= 8 and all(e.certificate_code.startswith("JS-") for e in certs)
        assert len({e.certificate_code for e in certs}) == len(certs)
        finalised = list(db.scalars(select(Contest).where(Contest.finalized_at.is_not(None))))
        assert finalised
        for c in finalised:
            ranks = sorted(e.rank for e in db.scalars(select(ContestEntry).where(ContestEntry.contest_id == c.id)))
            assert ranks == list(range(1, len(ranks) + 1))
        live = list(db.scalars(select(Contest).where(Contest.starts_at <= utcnow(), Contest.ends_at > utcnow())))
        assert len(live) >= 2
        for c in db.scalars(select(Campaign).where(Campaign.completed_at.is_not(None))):
            assert c.completed_at > c.ends_at
        assert db.scalar(select(func.count()).select_from(Campaign).where(Campaign.completed_at.is_(None))) >= 3


def test_demo_users_earn_the_expected_badges(client):
    _load()
    h = client.post("/api/auth/login", json={"email": "ayush@example.com", "password": "demo123"}).json()["access_token"]
    got = {b["id"] for b in client.get("/api/badges/mine", headers={"Authorization": f"Bearer {h}"}).json()}
    assert {"swachh-warrior", "community-cleaner", "ward-mobilizer", "community-watchdog"} <= got
    h = client.post("/api/auth/login", json={"email": "priya@example.com", "password": "demo123"}).json()["access_token"]
    got = {b["id"] for b in client.get("/api/badges/mine", headers={"Authorization": f"Bearer {h}"}).json()}
    assert "volunteer-regular" in got
    h = client.post("/api/auth/login", json={"email": "meera@example.com", "password": "demo123"}).json()["access_token"]
    got = {b["id"] for b in client.get("/api/badges/mine", headers={"Authorization": f"Bearer {h}"}).json()}
    assert {"clear-reporter", "eyes-on-street", "volunteer-regular"} <= got


def test_photo_fetcher_picks_good_photos_from_a_canned_response(tmp_path, monkeypatch):
    from demo import fetch_photos

    monkeypatch.setattr(fetch_photos, "OUT", tmp_path)

    def info(title, w, h, mime="image/jpeg", lic="CC BY-SA 4.0"):
        return {"title": title, "imageinfo": [{"thumburl": f"https://x/{title}", "url": f"https://x/{title}", "width": w, "height": h, "mime": mime,
                                               "descriptionurl": "https://c/" + title, "extmetadata": {"LicenseShortName": {"value": lic}, "Artist": {"value": "<b>Ann</b>"}}}]}

    pages = {str(i): info(t, w, h, m, lic) for i, (t, w, h, m, lic) in enumerate([
        ("File:Good one.jpg", 3000, 2000, "image/jpeg", "CC BY 4.0"),
        ("File:Map of pothole.jpg", 3000, 2000, "image/jpeg", "CC BY 4.0"),      # banned word
        ("File:Tiny.jpg", 400, 300, "image/jpeg", "CC BY 4.0"),                  # too small
        ("File:Diagram.svg", 3000, 2000, "image/svg+xml", "CC BY 4.0"),
        ("File:Restricted.jpg", 3000, 2000, "image/jpeg", "All rights reserved"),  # licence
        ("File:Second good.jpg", 2400, 1600, "image/jpeg", "Public domain"),
    ])}

    def fake_get(url, timeout=40):
        return json.dumps({"query": {"pages": pages}}).encode() if "api.php" in url else b"JPEGDATA"

    got = fetch_photos.fetch_kind("pothole", 2, fake_get, pause=0)
    assert [c["title"] for c in got] == ["File:Good one.jpg", "File:Second good.jpg"]
    assert sorted(p.name for p in tmp_path.glob("*.jpg")) == ["pothole_1.jpg", "pothole_2.jpg"]
