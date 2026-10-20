import httpx
import pytest

from app.routers import proxy_ai
from tests.conftest import ISSUE


# ---------------------------------------------------------------- auth
def test_health(client):
    assert client.get("/").json() == {"status": "ok", "service": "prajapulse-core", "port": 8000}


def test_register_login_me(client, make_user):
    headers, user = make_user()
    assert user["points"] == 0 and user["tier"] == "Bronze" and "password_hash" not in user
    assert client.post("/api/auth/login", json={"email": "T@Example.com", "password": "secret1"}).status_code == 200
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200 and me.json()["email"] == "t@example.com"


def test_auth_failures(client, make_user):
    make_user()
    assert client.post("/api/auth/login", json={"email": "t@example.com", "password": "wrong"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "no@example.com", "password": "secret1"}).status_code == 401
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer junk"}).status_code == 401
    dup = client.post("/api/auth/register", json={"name": "X Y", "email": "t@example.com", "password": "secret1"})
    assert dup.status_code == 409
    short = client.post("/api/auth/register", json={"name": "X Y", "email": "a@example.com", "password": "123"})
    assert short.status_code == 422


def test_swagger_form_login_and_profile_update(client, make_user):
    make_user()
    r = client.post("/api/auth/token", data={"username": "t@example.com", "password": "secret1"})
    assert r.status_code == 200
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    upd = client.patch("/api/auth/me", json={"ward": "Ward 9", "name": "New Name"}, headers=headers)
    assert upd.json()["ward"] == "Ward 9" and upd.json()["name"] == "New Name"


# ---------------------------------------------------------------- issues
def test_create_issue_awards_20_and_updates_tier(client, make_user):
    headers, _ = make_user()
    r = client.post("/api/issues", json=ISSUE, headers=headers)
    assert r.status_code == 201
    body = r.json()
    assert body["points_awarded"] == 20 and body["user_points"] == 20
    assert body["issue"]["status"] == "Reported"
    assert body["issue"]["timeline"][0]["status"] == "Reported"
    assert client.post("/api/issues", json=ISSUE).status_code == 401


def test_urgent_is_stored_as_critical(client, make_user):
    headers, _ = make_user()
    r = client.post("/api/issues", json={**ISSUE, "priority": "Urgent"}, headers=headers).json()["issue"]
    assert r["priority"] == "Critical" and r["priority_ui"] == "Urgent"
    assert client.get("/api/issues?priority=Urgent").json()["total"] == 1
    assert client.get("/api/issues?priority=Critical").json()["total"] == 1


def test_invalid_enums_rejected(client, make_user):
    headers, _ = make_user()
    assert client.post("/api/issues", json={**ISSUE, "category": "Aliens"}, headers=headers).status_code == 422
    assert client.get("/api/issues?category=Aliens").status_code == 400
    assert client.get("/api/issues?status=Nope").status_code == 400


def test_list_filters_sort_pagination_and_has_upvoted(client, make_user):
    a_h, _ = make_user(email="a@example.com")
    b_h, _ = make_user(email="b@example.com")
    ids = []
    for i, cat in enumerate(["Roads", "Water", "Roads"]):
        ids.append(client.post("/api/issues", json={**ISSUE, "title": f"Issue {i}", "category": cat}, headers=a_h).json()["issue"]["id"])
    client.post(f"/api/issues/{ids[0]}/upvote", headers=b_h)

    assert client.get("/api/issues?category=Roads").json()["total"] == 2
    by_votes = client.get("/api/issues?sort=votes").json()["items"]
    assert by_votes[0]["id"] == ids[0] and by_votes[0]["upvotes"] == 1
    recent = client.get("/api/issues?sort=recent").json()["items"]
    assert recent[0]["id"] == ids[2]
    page = client.get("/api/issues?page=2&page_size=2").json()
    assert len(page["items"]) == 1 and page["pages"] == 2 and page["total"] == 3
    assert client.get("/api/issues?q=issue 1").json()["total"] == 1

    anon = client.get("/api/issues?sort=votes").json()["items"][0]
    assert anon["has_upvoted"] is False
    mine = client.get("/api/issues?sort=votes", headers=b_h).json()["items"][0]
    assert mine["has_upvoted"] is True


def test_issue_detail_and_404(client, make_user):
    headers, _ = make_user()
    iid = client.post("/api/issues", json=ISSUE, headers=headers).json()["issue"]["id"]
    client.post(f"/api/issues/{iid}/comments", json={"text": "me too"}, headers=headers)
    d = client.get(f"/api/issues/{iid}").json()
    assert d["comments_count"] == 1 and d["comments"][0]["text"] == "me too" and d["reporter"]["name"] == "Test User"
    assert client.get("/api/issues/9999").status_code == 404


# ---------------------------------------------------------------- votes
def test_upvote_rules(client, make_user):
    owner_h, _ = make_user(email="o@example.com")
    voter_h, voter = make_user(email="v@example.com")
    iid = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]

    assert client.post(f"/api/issues/{iid}/upvote", headers=owner_h).status_code == 403  # no self-vote
    r = client.post(f"/api/issues/{iid}/upvote", headers=voter_h)
    assert r.status_code == 200 and r.json()["upvotes"] == 1 and r.json()["points_delta"] == 5
    assert client.post(f"/api/issues/{iid}/upvote", headers=voter_h).status_code == 409  # 1 vote per user
    assert client.get(f"/api/issues/{iid}").json()["upvotes"] == 1

    d = client.delete(f"/api/issues/{iid}/upvote", headers=voter_h).json()
    assert d["upvotes"] == 0 and d["points_delta"] == -5 and d["user_points"] == 0
    assert client.delete(f"/api/issues/{iid}/upvote", headers=voter_h).status_code == 404


def test_vote_unvote_cycle_cannot_farm_points(client, make_user):
    owner_h, _ = make_user(email="o@example.com")
    voter_h, _ = make_user(email="v@example.com")
    iid = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]
    for _ in range(5):
        client.post(f"/api/issues/{iid}/upvote", headers=voter_h)
        client.delete(f"/api/issues/{iid}/upvote", headers=voter_h)
    assert client.get("/api/auth/me", headers=voter_h).json()["points"] == 0
    client.post(f"/api/issues/{iid}/upvote", headers=voter_h)  # final vote stays, earns nothing more
    me = client.get("/api/auth/me", headers=voter_h).json()
    assert me["points"] == 0 and client.get(f"/api/issues/{iid}").json()["upvotes"] == 1


def test_comments(client, make_user, official_headers):
    headers, _ = make_user()
    iid = client.post("/api/issues", json=ISSUE, headers=headers).json()["issue"]["id"]
    assert client.post(f"/api/issues/{iid}/comments", json={"text": "hi"}).status_code == 401
    assert client.post(f"/api/issues/{iid}/comments", json={"text": "   "}, headers=headers).status_code == 422
    client.post(f"/api/issues/{iid}/comments", json={"text": "citizen"}, headers=headers)
    client.post(f"/api/issues/{iid}/comments", json={"text": "official reply"}, headers=official_headers)
    comments = client.get(f"/api/issues/{iid}/comments").json()
    assert [c["is_official"] for c in comments] == [False, True]


# ---------------------------------------------------------------- status & resolve reward
def test_status_flow_and_resolve_reward(client, make_user, official_headers):
    headers, _ = make_user()
    iid = client.post("/api/issues", json=ISSUE, headers=headers).json()["issue"]["id"]

    # reporter cannot resolve their own issue (would be a +50 exploit)
    assert client.patch(f"/api/issues/{iid}/status", json={"status": "Resolved"}, headers=headers).status_code == 403

    for st in ("Under Review", "In Progress"):
        assert client.patch(f"/api/issues/{iid}/status", json={"status": st}, headers=official_headers).status_code == 200
    # cannot go backwards
    assert client.patch(f"/api/issues/{iid}/status", json={"status": "Reported"}, headers=official_headers).status_code == 409

    r = client.patch(f"/api/issues/{iid}/status", json={"status": "Resolved", "note": "Fixed"}, headers=official_headers)
    assert r.status_code == 200
    assert [t["status"] for t in r.json()["timeline"]] == ["Reported", "Under Review", "In Progress", "Resolved"]
    me = client.get("/api/auth/me", headers=headers).json()
    # report 20 + resolve 50 = 70 -> the daily cap clips it to 60
    assert me["points"] == 60 and me["resolved_count"] == 1
    # resolved is final
    assert client.patch(f"/api/issues/{iid}/status", json={"status": "Resolved"}, headers=official_headers).status_code == 409


# ---------------------------------------------------------------- rewards engine
def test_daily_cap_clips_at_60(client, make_user):
    headers, _ = make_user()
    awarded = []
    for i in range(4):
        body = {**ISSUE, "title": f"Issue number {i}", "address": "Somewhere 12"}  # 20 + 5 location = 25 each
        awarded.append(client.post("/api/issues", json=body, headers=headers).json()["points_awarded"])
    assert awarded == [25, 25, 10, 0]
    w = client.get("/api/rewards/wallet", headers=headers).json()
    assert w["points"] == 60 and w["points_today"] == 60 and w["daily_cap"] == 60 and w["remaining_today"] == 0
    assert any("cap" in (t["description"] or "") for t in w["recent_transactions"])


def test_wallet_tier_progress_and_history(client, make_user):
    headers, _ = make_user()
    client.post("/api/issues", json=ISSUE, headers=headers)
    w = client.get("/api/rewards/wallet", headers=headers).json()
    assert w["tier"] == "Bronze" and w["next_tier"] == "Silver" and w["points_to_next_tier"] == 80 and w["progress_percent"] == 20
    h = client.get("/api/rewards/history", headers=headers).json()
    assert h["total"] == 1 and h["items"][0]["action_type"] == "report"


def test_tier_boundaries():
    from app.services.points_engine import tier_for
    assert [tier_for(p) for p in (0, 99, 100, 299, 300, 749, 750, 1999, 2000)] == [
        "Bronze", "Bronze", "Silver", "Silver", "Gold", "Gold", "Platinum", "Platinum", "Legend"]


def test_quiz_claim_is_one_time_and_validated(client, make_user):
    headers, _ = make_user()
    first = client.post("/api/rewards/claim", json={"action_type": "quiz", "action_id": "water-1", "points": 15}, headers=headers).json()
    assert first["awarded"] == 15 and not first["duplicate"]
    again = client.post("/api/rewards/claim", json={"action_type": "quiz", "action_id": "water-1", "points": 15}, headers=headers).json()
    assert again["awarded"] == 0 and again["duplicate"] and again["user_points"] == 15
    clamped = client.post("/api/rewards/claim", json={"action_type": "quiz", "action_id": "water-2", "points": 99}, headers=headers).json()
    assert clamped["awarded"] == 25  # clamped to quiz max
    bad = client.post("/api/rewards/claim", json={"action_type": "cleanup", "action_id": "x", "points": 40}, headers=headers)
    assert bad.status_code == 400


def test_leaderboard(client, make_user):
    a_h, _ = make_user(email="a@example.com", name="Anna")
    make_user(email="b@example.com", name="Bob")
    client.post("/api/issues", json=ISSUE, headers=a_h)
    lb = client.get("/api/rewards/leaderboard").json()
    assert [(e["rank"], e["name"], e["points"]) for e in lb] == [(1, "Anna", 20), (2, "Bob", 0)]


# ---------------------------------------------------------------- notifications & uploads
def test_notifications(client, make_user):
    owner_h, _ = make_user(email="o@example.com")
    voter_h, _ = make_user(email="v@example.com")
    iid = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]
    client.post(f"/api/issues/{iid}/upvote", headers=voter_h)
    n = client.get("/api/notifications", headers=owner_h).json()
    assert n["unread_count"] == 2 and {x["type"] for x in n["items"]} == {"reward", "upvote"}
    nid = n["items"][0]["id"]
    assert client.patch(f"/api/notifications/{nid}/read", headers=voter_h).status_code == 404  # not theirs
    assert client.patch(f"/api/notifications/{nid}/read", headers=owner_h).json()["is_read"] is True
    assert client.post("/api/notifications/read-all", headers=owner_h).json()["marked_read"] == 1


def test_upload_image(client, make_user):
    headers, _ = make_user()
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 100
    r = client.post("/api/uploads", files={"file": ("a.png", png, "image/png")}, headers=headers)
    assert r.status_code == 201
    assert client.get(r.json()["url"]).content == png
    bad = client.post("/api/uploads", files={"file": ("a.png", b"not an image", "image/png")}, headers=headers)
    assert bad.status_code == 415
    assert client.post("/api/uploads", files={"file": ("a.png", png, "image/png")}).status_code == 401
    iid = client.post("/api/issues", json={**ISSUE, "image_urls": [r.json()["url"]]}, headers=headers).json()
    assert iid["points_awarded"] == 30 and iid["issue"]["image_urls"] == [r.json()["url"]]  # 20 + 10 photo


# ---------------------------------------------------------------- AI proxy
def _mock_ai(monkeypatch, handler):
    real = httpx.AsyncClient
    monkeypatch.setattr(proxy_ai.httpx, "AsyncClient", lambda **kw: real(transport=httpx.MockTransport(handler), **kw))


def test_proxy_forwards_contract_payloads(client, monkeypatch):
    seen = {}

    def handler(request: httpx.Request):
        seen["url"] = str(request.url)
        seen["body"] = request.content
        return httpx.Response(200, json={"reply": "hello"})

    _mock_ai(monkeypatch, handler)
    r = client.post("/api/ai/chatbot", json={"message": "hi"})
    assert r.status_code == 200 and r.json() == {"reply": "hello"}
    assert seen["url"] == "http://ai.test/api/chatbot" and b'"history":[]' in seen["body"].replace(b" ", b"")
    assert client.post("/api/chatbot", json={"message": "hi"}).status_code == 200  # legacy path the frontend uses
    assert client.post("/api/ai/chatbot", json={}).status_code == 422


def test_proxy_maps_urgent_for_feed_prioritize(client, monkeypatch):
    captured = {}

    def handler(request):
        captured["body"] = request.read()
        return httpx.Response(200, json={"ranked_ids": ["1"]})

    _mock_ai(monkeypatch, handler)
    r = client.post("/api/ai/feed/prioritize", json={"complaints": [{"id": 1, "title": "t", "category": "Water", "priority": "Urgent"}]})
    assert r.status_code == 200 and b'"Critical"' in captured["body"] and b'"id":"1"' in captured["body"].replace(b" ", b"")


def test_proxy_503_when_ai_down(client, monkeypatch):
    def handler(request):
        raise httpx.ConnectError("refused")

    _mock_ai(monkeypatch, handler)
    r = client.post("/api/ai/hazard-alerts", json={"issue": "fire", "location": "Ward 1"})
    assert r.status_code == 503 and r.json()["detail"].startswith("AI inference engine is currently unreachable")
    assert client.get("/api/ai/health").json()["reachable"] is False


def test_proxy_error_mapping(client, monkeypatch):
    responses = iter([
        httpx.Response(200, content=b"<html>oops</html>"),
        httpx.Response(500, json={"detail": "boom"}),
        httpx.Response(422, json={"detail": "bad"}),
    ])
    _mock_ai(monkeypatch, lambda request: next(responses))
    body = {"issue": "x", "location": "y"}
    assert client.post("/api/ai/hazard-alerts", json=body).status_code == 502
    assert client.post("/api/ai/hazard-alerts", json=body).status_code == 502
    assert client.post("/api/ai/hazard-alerts", json=body).status_code == 422


def test_proxy_image_multipart(client, monkeypatch):
    def handler(request):
        assert b"name=\"image\"" in request.content and b"name=\"issue\"" in request.content
        return httpx.Response(200, json={"title": "t", "description": "d", "category": "Roads", "severity": "High"})

    _mock_ai(monkeypatch, handler)
    r = client.post("/api/ai/complaint/prepare-with-image", data={"issue": "pothole", "location": "ward 1"},
                    files={"image": ("p.jpg", b"\xff\xd8\xff" + b"0" * 50, "image/jpeg")})
    assert r.status_code == 200 and r.json()["category"] == "Roads"


def test_proxy_can_require_login(client, monkeypatch, make_user):
    monkeypatch.setattr(proxy_ai.settings, "AI_PROXY_REQUIRE_AUTH", True)
    assert client.post("/api/ai/chatbot", json={"message": "hi"}).status_code == 401
