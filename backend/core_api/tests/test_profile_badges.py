from datetime import timedelta

from app.core.database import SessionLocal, utcnow
from app.models import User
from app.models.issue import CivicIssue
from app.models.volunteer import Campaign


def test_profile_details_save_validate_and_clear(client, make_user):
    h, _ = make_user()
    r = client.patch("/api/auth/me", headers=h, json={
        "phone": "+91 98765-43210", "address": "  12 MG Road ", "city": "Pune", "pincode": "411001", "bio": "Clean streets matter."})
    assert r.status_code == 200, r.text
    me = r.json()
    assert me["phone"] == "9876543210" and me["address"] == "12 MG Road" and me["pincode"] == "411001"
    assert client.get("/api/auth/me", headers=h).json()["city"] == "Pune"
    # clearing
    r = client.patch("/api/auth/me", headers=h, json={"phone": "", "address": ""})
    assert r.status_code == 200 and r.json()["phone"] is None and r.json()["address"] is None


def test_profile_rejects_bad_phone_and_pincode(client, make_user):
    h, _ = make_user()
    assert client.patch("/api/auth/me", headers=h, json={"phone": "12345"}).status_code == 422
    assert client.patch("/api/auth/me", headers=h, json={"phone": "5876543210"}).status_code == 422
    assert client.patch("/api/auth/me", headers=h, json={"pincode": "012345"}).status_code == 422
    assert client.patch("/api/auth/me", headers=h, json={"pincode": "41100"}).status_code == 422


def test_phone_and_address_stay_private(client, make_user):
    h, u = make_user()
    client.patch("/api/auth/me", headers=h, json={"phone": "9876543210", "address": "Secret Lane", "bio": "Hello"})
    h2, _ = make_user(name="Other", email="o@example.com")
    r = client.get(f"/api/users/{u['id']}", headers=h2)
    if r.status_code == 200:
        body = r.json()
        assert "phone" not in body and "address" not in body and "pincode" not in body
        assert body.get("bio") == "Hello"


def test_badges_start_empty_and_only_show_earned(client, make_user):
    h, u = make_user()
    assert client.get("/api/badges/mine", headers=h).json() == []
    with SessionLocal() as db:
        db.get(User, u["id"]).points = 120
        db.commit()
    got = client.get("/api/badges/mine", headers=h).json()
    assert [b["id"] for b in got] == ["swachh-warrior"]


def test_watchdog_needs_30_days(client, make_user):
    h, u = make_user()
    now = utcnow()
    with SessionLocal() as db:
        for i, days in enumerate((5, 40)):
            db.add(CivicIssue(title=f"t{i}", description="d" * 30, category="Roads", reporter_id=u["id"], status="Resolved",
                              created_at=now - timedelta(days=days + 1), resolved_at=now - timedelta(days=1)))
        db.commit()
    ids = [b["id"] for b in client.get("/api/badges/mine", headers=h).json()]
    assert "community-watchdog" in ids

    h2, u2 = make_user(name="Bina", email="b@example.com")
    with SessionLocal() as db:
        db.add(CivicIssue(title="x", description="d" * 30, category="Roads", reporter_id=u2["id"], status="Resolved",
                          created_at=now - timedelta(days=6), resolved_at=now - timedelta(days=1)))
        db.commit()
    assert client.get("/api/badges/mine", headers=h2).json() == []
