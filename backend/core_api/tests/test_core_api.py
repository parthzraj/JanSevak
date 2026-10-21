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


def test_quiz_claim_rejects_quiz_type_and_validates(client, make_user):
    headers, _ = make_user()
    # quizzes are graded server-side now, so they can no longer be claimed directly
    assert client.post("/api/rewards/claim", json={"action_type": "quiz", "action_id": "quiz-1", "points": 25}, headers=headers).status_code == 400
    ok = client.post("/api/rewards/claim", json={"action_type": "academy_module", "action_id": "m1", "points": 30}, headers=headers).json()
    assert ok["awarded"] == 30
    assert client.post("/api/rewards/claim", json={"action_type": "cleanup", "action_id": "x", "points": 40}, headers=headers).status_code == 400


def _answers(quiz_id, right=True):
    from app.services.quiz_bank import QUIZ_BY_ID
    q = QUIZ_BY_ID[quiz_id]["questions"]
    return [x["answer_index"] if right else (x["answer_index"] + 1) % len(x["options"]) for x in q]


def test_quizzes_list_and_detail_hide_answers(client, make_user):
    headers, _ = make_user()
    lst = client.get("/api/quizzes", headers=headers).json()
    assert len(lst) == 3 and lst[0]["attempts"] == 0 and lst[0]["passed"] is False
    detail = client.get("/api/quizzes/quiz-1", headers=headers).json()
    assert "answer_index" not in str(detail) and "explanation" not in str(detail)
    assert client.get("/api/quizzes/nope", headers=headers).status_code == 404
    assert client.get("/api/quizzes").status_code == 401


def test_quiz_grading_and_one_time_points(client, make_user):
    headers, _ = make_user()
    fail = client.post("/api/quizzes/quiz-1/submit", json={"answers": _answers("quiz-1", right=False)}, headers=headers).json()
    assert fail["score"] == 0 and not fail["passed"] and fail["points_awarded"] == 0 and fail["user_points"] == 0
    win = client.post("/api/quizzes/quiz-1/submit", json={"answers": _answers("quiz-1")}, headers=headers).json()
    assert win["passed"] and win["score"] == win["total"] == 4 and win["points_awarded"] == 40 and win["user_points"] == 40
    assert win["review"][0]["correct"] and win["review"][0]["explanation"]
    replay = client.post("/api/quizzes/quiz-1/submit", json={"answers": _answers("quiz-1")}, headers=headers).json()
    assert replay["points_awarded"] == 0 and replay["already_rewarded"] and replay["user_points"] == 40
    row = [q for q in client.get("/api/quizzes", headers=headers).json() if q["id"] == "quiz-1"][0]
    assert row["attempts"] == 3 and row["best_score"] == 4 and row["passed"] and row["points_awarded"] == 40


def test_quiz_partial_score_pays_proportionally_and_validates_input(client, make_user):
    headers, _ = make_user()
    ans = _answers("quiz-1")
    ans[3] = (ans[3] + 1) % 4  # 3 of 4 right
    res = client.post("/api/quizzes/quiz-1/submit", json={"answers": ans}, headers=headers).json()
    assert res["score"] == 3 and res["points_awarded"] == 30
    assert client.post("/api/quizzes/quiz-1/submit", json={"answers": [0, 1]}, headers=headers).status_code == 422
    assert client.post("/api/quizzes/quiz-1/submit", json={"answers": [9, 9, 9, 9]}, headers=headers).status_code == 422


def test_quiz_respects_daily_cap(client, make_user):
    headers, _ = make_user()
    client.post("/api/quizzes/quiz-1/submit", json={"answers": _answers("quiz-1")}, headers=headers)  # 40
    client.post("/api/quizzes/quiz-2/submit", json={"answers": _answers("quiz-2")}, headers=headers)  # 35 -> clipped to 20
    r = client.post("/api/quizzes/quiz-3/submit", json={"answers": _answers("quiz-3")}, headers=headers).json()
    assert r["passed"] and r["points_awarded"] == 0 and r["capped"]
    assert client.get("/api/auth/me", headers=headers).json()["points"] == 60


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


import io
import itertools
import random

from PIL import Image

_seed = itertools.count(1)


def real_image(fmt="PNG", size=(160, 120), seed=None, flat=False, exif=False):
    """A genuinely decodable picture; every call gives a visibly different one unless `seed` is repeated."""
    rnd = random.Random(next(_seed) if seed is None else seed)
    img = Image.new("RGB", size, (120, 120, 120))
    if not flat:
        px = img.load()
        for x in range(size[0]):
            for y in range(size[1]):
                px[x, y] = (rnd.randrange(256), rnd.randrange(256), rnd.randrange(256))
    out = io.BytesIO()
    kwargs = {}
    if exif:
        e = Image.Exif()
        e[0x010F] = "SecretPhoneMaker"
        kwargs["exif"] = e
    img.save(out, format=fmt, **kwargs)
    return out.getvalue()


def test_upload_image(client, make_user):
    headers, _ = make_user()
    png = real_image("PNG")
    r = client.post("/api/uploads", files={"file": ("a.png", png, "image/png")}, headers=headers)
    assert r.status_code == 201
    assert client.get(r.json()["url"]).status_code == 200
    bad = client.post("/api/uploads", files={"file": ("a.png", b"not an image", "image/png")}, headers=headers)
    assert bad.status_code == 422
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


# ---------------------------------------------------------------- evidence photos & supporters
def _photos(n):
    return [("files", (f"p{i}.jpg", real_image("JPEG"), "image/jpeg")) for i in range(n)]


def test_add_evidence_rewards_once_and_shows_in_detail(client, make_user):
    owner_h, _ = make_user(email="o@example.com")
    helper_h, _ = make_user(email="h@example.com", name="Helper")
    iid = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]

    r = client.post(f"/api/issues/{iid}/evidence", files=_photos(2), headers=helper_h)
    assert r.status_code == 201
    body = r.json()
    assert len(body["evidence"]) == 2 and body["points_awarded"] == 10 and body["user_points"] == 10
    assert client.get(body["evidence"][0]["url"]).status_code == 200  # the file is really stored and served

    again = client.post(f"/api/issues/{iid}/evidence", files=_photos(1), headers=helper_h).json()
    assert again["points_awarded"] == 0  # one reward per user per issue

    detail = client.get(f"/api/issues/{iid}").json()
    assert len(detail["evidence"]) == 3 and detail["evidence"][0]["author"] == "Helper"
    notes = client.get("/api/notifications", headers=owner_h).json()["items"]
    assert any(n["title"] == "New evidence photo" for n in notes)


def test_evidence_rules(client, make_user):
    owner_h, owner = make_user(email="o@example.com")
    other_h, _ = make_user(email="h@example.com")
    iid = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]
    points_before = client.get("/api/auth/me", headers=owner_h).json()["points"]

    # reporter may add photos to their own report but earns nothing (no self-verification)
    own = client.post(f"/api/issues/{iid}/evidence", files=_photos(1), headers=owner_h).json()
    assert own["points_awarded"] == 0 and client.get("/api/auth/me", headers=owner_h).json()["points"] == points_before

    assert client.post(f"/api/issues/{iid}/evidence", files=_photos(1)).status_code == 401
    assert client.post(f"/api/issues/{iid}/evidence", files=_photos(4), headers=other_h).status_code == 400
    bad = client.post(f"/api/issues/{iid}/evidence", files=[("files", ("x.png", b"not an image", "image/png"))], headers=other_h)
    assert bad.status_code == 422
    assert client.post("/api/issues/9999/evidence", files=_photos(1), headers=other_h).status_code == 404

    client.post(f"/api/issues/{iid}/evidence", files=_photos(3), headers=other_h)
    assert client.post(f"/api/issues/{iid}/evidence", files=_photos(3), headers=other_h).status_code == 409  # max 5 each
    assert len(client.get(f"/api/issues/{iid}").json()["evidence"]) == 4  # nothing saved by the rejected calls


def test_supporters_list(client, make_user):
    owner_h, _ = make_user(email="o@example.com")
    a_h, _ = make_user(email="a@example.com", name="Anna A")
    b_h, _ = make_user(email="b@example.com", name="Bob B")
    iid = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]
    client.post(f"/api/issues/{iid}/upvote", headers=a_h)
    client.post(f"/api/issues/{iid}/upvote", headers=b_h)

    s = client.get(f"/api/issues/{iid}/supporters", headers=owner_h).json()
    assert s["total"] == 2 and {i["name"] for i in s["items"]} == {"Anna A", "Bob B"}
    assert "email" not in s["items"][0]  # no private data
    client.delete(f"/api/issues/{iid}/upvote", headers=a_h)
    assert client.get(f"/api/issues/{iid}/supporters", headers=owner_h).json()["total"] == 1
    assert client.get(f"/api/issues/{iid}/supporters").status_code == 401
    assert client.get("/api/issues/9999/supporters", headers=owner_h).status_code == 404


def test_image_validation(client, make_user, tmp_path):
    from app.core.config import settings

    owner_h, _ = make_user(email="o@example.com")
    h, _ = make_user(email="h@example.com")
    iid = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]
    url = f"/api/issues/{iid}/evidence"

    def post(data, name="x.jpg"):
        return client.post(url, files=[("files", (name, data, "image/jpeg"))], headers=h)

    good = real_image("JPEG")
    # valid header followed by garbage / a truncated file is not an image
    assert post(good[:20] + b"0" * 300).status_code == 422
    assert post(good[: len(good) // 2]).status_code == 422
    assert post(b"\x89PNG\r\n\x1a\n" + b"0" * 100).status_code == 422  # the old "fake PNG" trick
    assert post(real_image("BMP")).status_code == 415  # real image, but a format we don't accept
    assert post(real_image("JPEG", flat=True)).status_code == 422  # blank picture
    assert post(real_image("JPEG", size=(30, 30))).status_code == 422  # too small
    assert len(client.get(f"/api/issues/{iid}").json()["evidence"]) == 0  # nothing stored for rejects

    # EXIF (phone model / GPS) is stripped from what is stored and served
    r = post(real_image("JPEG", exif=True, seed=77))
    assert r.status_code == 201
    stored = client.get(r.json()["evidence"][0]["url"]).content
    assert b"SecretPhoneMaker" not in stored and not Image.open(io.BytesIO(stored)).getexif()

    # the same picture can't be used again, even re-saved as a different format, by anyone, on any issue
    again = post(real_image("PNG", seed=77), name="y.png")
    assert again.status_code == 409
    issue2 = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]
    other = client.post(f"/api/issues/{issue2}/evidence", files=[("files", ("z.jpg", real_image("JPEG", seed=77), "image/jpeg"))], headers=h)
    assert other.status_code == 409
    # a rejected duplicate earns no points and leaves no stored evidence
    assert client.get("/api/auth/me", headers=h).json()["points"] == 10
    assert len(client.get(f"/api/issues/{iid}").json()["evidence"]) == 1


def test_oversized_dimensions_are_scaled_down(client, make_user):
    h, _ = make_user()
    data = real_image("PNG", size=(3000, 200), seed=5)
    r = client.post("/api/uploads", files={"file": ("w.png", data, "image/png")}, headers=h)
    assert r.status_code == 201
    img = Image.open(io.BytesIO(client.get(r.json()["url"]).content))
    assert max(img.size) <= 2560


# ---------------------------------------------------------------- profiles, avatars, analytics
def test_public_profile_hides_private_data(client, make_user):
    a_h, a = make_user(email="a@example.com", name="Anna A")
    b_h, _ = make_user(email="b@example.com", name="Bob B")
    r = client.get(f"/api/users/{a['id']}", headers=b_h)
    assert r.status_code == 200 and r.json()["name"] == "Anna A"
    assert "email" not in r.json() and "password_hash" not in r.json()
    assert client.get(f"/api/users/{a['id']}").status_code == 401
    assert client.get("/api/users/9999", headers=b_h).status_code == 404


def test_avatar_choice_is_validated(client, make_user):
    h, _ = make_user()
    ok = client.patch("/api/auth/me", json={"avatar_url": "preset:woman-2"}, headers=h)
    assert ok.status_code == 200 and ok.json()["avatar_url"] == "preset:woman-2"
    for bad in ("preset:nope", "http://evil.example/x.png", "/uploads/../secret", "javascript:alert(1)"):
        assert client.patch("/api/auth/me", json={"avatar_url": bad}, headers=h).status_code == 422
    reset = client.patch("/api/auth/me", json={"avatar_url": ""}, headers=h)
    assert reset.json()["avatar_url"] is None


def test_analytics_summary_is_computed_from_real_issues(client, make_user, official_headers):
    owner_h, _ = make_user(email="o@example.com")
    other_h, _ = make_user(email="x@example.com")
    off_h = official_headers
    empty = client.get("/api/analytics/summary", headers=owner_h).json()
    assert empty["mine"]["total"] == 0 and empty["mine"]["avg_resolution_hours"] is None

    i1 = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]
    client.post("/api/issues", json={**ISSUE, "category": "Water"}, headers=owner_h)
    client.post("/api/issues", json=ISSUE, headers=other_h)
    for st in ("Under Review", "In Progress", "Resolved"):
        assert client.patch(f"/api/issues/{i1}/status", json={"status": st}, headers=off_h).status_code == 200

    s = client.get("/api/analytics/summary", headers=owner_h).json()
    assert s["mine"]["total"] == 2 and s["mine"]["resolved"] == 1 and s["mine"]["resolution_rate"] == 50
    assert s["community"]["total"] == 3 and s["community"]["resolved"] == 1
    assert s["mine"]["avg_resolution_hours"] is not None
    assert {c["category"] for c in s["mine"]["by_category"]} == {ISSUE["category"], "Water"}
    assert client.get("/api/analytics/summary").status_code == 401


def test_monthly_report_counts_this_months_activity(client, make_user, official_headers):
    owner_h, owner = make_user(email="o@example.com", name="Olive")
    other_h, _ = make_user(email="x@example.com")
    empty = client.get("/api/analytics/monthly-report", headers=owner_h).json()
    assert empty["reports_filed"] == 0 and empty["points_earned"] == 0 and empty["reports"] == []

    i1 = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]
    client.post("/api/issues", json={**ISSUE, "category": "Water"}, headers=owner_h)
    other_issue = client.post("/api/issues", json=ISSUE, headers=other_h).json()["issue"]["id"]
    client.post(f"/api/issues/{i1}/upvote", headers=other_h)            # a neighbour supports Olive
    client.post(f"/api/issues/{other_issue}/upvote", headers=owner_h)  # Olive supports a neighbour
    for st in ("Under Review", "In Progress", "Resolved"):
        client.patch(f"/api/issues/{i1}/status", json={"status": st}, headers=official_headers)

    r = client.get("/api/analytics/monthly-report", headers=owner_h).json()
    assert r["citizen_name"] == "Olive" and r["reports_filed"] == 2 and len(r["reports"]) == 2
    assert r["reports_resolved_this_month"] == 1 and r["status_breakdown"].get("Resolved") == 1
    assert r["supporters_received"] == 1 and r["reports_supported"] == 1
    me = client.get("/api/auth/me", headers=owner_h).json()
    assert r["points_earned"] > 0 and r["net_points"] == r["points_earned"] - r["points_reversed"]
    assert sum(line["points"] for line in r["points_breakdown"]) == r["points_earned"]
    assert r["lifetime_points"] == me["points"]

    old = client.get("/api/analytics/monthly-report?month=2020-01", headers=owner_h).json()
    assert old["reports_filed"] == 0 and old["points_earned"] == 0 and old["month_label"] == "January 2020"
    assert client.get("/api/analytics/monthly-report?month=2999-01", headers=owner_h).status_code == 422
    assert client.get("/api/analytics/monthly-report?month=oops", headers=owner_h).status_code == 422
    assert client.get("/api/analytics/monthly-report").status_code == 401


# ---------------------------------------------------------------- NGO contests
def _ngo(client, settings_obj=None):
    from app.core.config import settings
    settings.NGO_SIGNUP_CODE = "ngo-secret"
    r = client.post("/api/auth/register", json={"name": "Clean City Trust", "email": "ngo@x.org", "password": "secret1", "account_type": "ngo", "ngo_code": "ngo-secret"})
    assert r.status_code == 201 and r.json()["user"]["role"] == "ngo"
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _contest_body(**over):
    from datetime import datetime, timedelta, timezone
    qs = [{"question": f"Question number {i}?", "options": ["a", "b", "c"], "answer_index": i % 3, "explanation": "because"} for i in range(3)]
    body = {"title": "Waste Wizards", "topic": "Sanitation", "prize": "Cloth bag", "time_limit_seconds": 120,
            "ends_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(), "questions": qs}
    body.update(over)
    return body


def _set_durations(contest_id, seconds):
    """Pin finish times (in play order) so speed tie-breaks do not depend on test timing."""
    from app.core.database import SessionLocal
    from app.models.contest import ContestEntry
    with SessionLocal() as db:
        entries = db.query(ContestEntry).filter(ContestEntry.contest_id == contest_id).order_by(ContestEntry.id).all()
        for e, sec in zip(entries, seconds):
            e.duration_seconds = sec
        db.commit()


def _play(client, headers, contest_id, right):
    st = client.post(f"/api/contests/{contest_id}/start", headers=headers)
    assert st.status_code == 200, st.text
    answers = [i % 3 if right >= i + 1 else (i + 1) % 3 for i in range(3)]  # first `right` answers correct
    return client.post(f"/api/contests/{contest_id}/submit", json={"answers": answers}, headers=headers)


def test_ngo_signup_needs_code_and_only_ngos_publish(client, make_user):
    bad = client.post("/api/auth/register", json={"name": "Fake NGO", "email": "f@x.org", "password": "secret1", "account_type": "ngo", "ngo_code": "guess"})
    assert bad.status_code == 403
    ngo_h = _ngo(client)
    citizen_h, _ = make_user()
    assert client.post("/api/contests", json=_contest_body(), headers=citizen_h).status_code == 403
    ok = client.post("/api/contests", json=_contest_body(), headers=ngo_h)
    assert ok.status_code == 201 and ok.json()["status"] == "live" and ok.json()["question_count"] == 3
    # validation: bad answer index, too few questions, end in the past
    bad_q = _contest_body(); bad_q["questions"][0]["answer_index"] = 9
    assert client.post("/api/contests", json=bad_q, headers=ngo_h).status_code == 422
    assert client.post("/api/contests", json=_contest_body(questions=_contest_body()["questions"][:2]), headers=ngo_h).status_code == 422
    assert client.post("/api/contests", json=_contest_body(ends_at="2020-01-01T00:00:00Z"), headers=ngo_h).status_code == 422


def test_contest_play_once_hides_answers_and_ranks_by_score_then_speed(client, make_user):
    ngo_h = _ngo(client)
    cid = client.post("/api/contests", json=_contest_body(), headers=ngo_h).json()["id"]
    a_h, _ = make_user(email="a@x.com", name="Asha")
    b_h, _ = make_user(email="b@x.com", name="Bala")
    c_h, _ = make_user(email="c@x.com", name="Chitra")
    assert "answer_index" not in str(client.post(f"/api/contests/{cid}/start", headers=a_h).json())
    assert client.post(f"/api/contests/{cid}/start", headers=ngo_h).status_code == 403  # NGOs do not play

    assert _play(client, a_h, cid, right=2).json()["score"] == 2
    assert _play(client, b_h, cid, right=3).json()["score"] == 3   # higher score beats the faster Asha
    assert _play(client, c_h, cid, right=3).json()["score"] == 3   # same score, finished later
    _set_durations(cid, [5, 20, 30])  # Asha fastest, Chitra slowest
    assert client.post(f"/api/contests/{cid}/start", headers=a_h).status_code == 409      # one attempt only
    assert client.post(f"/api/contests/{cid}/submit", json={"answers": [0, 1, 2]}, headers=a_h).status_code == 409

    lb = client.get(f"/api/contests/{cid}/leaderboard", headers=a_h).json()
    assert [r["name"] for r in lb["rows"]] == ["Bala", "Chitra", "Asha"] and lb["rows"][2]["is_me"]
    assert client.get(f"/api/contests/{cid}/review", headers=a_h).status_code == 409   # answers hidden while live
    # nothing is paid while the contest is live
    assert client.get("/api/auth/me", headers=a_h).json()["points"] == 0


def test_contest_payout_after_it_ends_is_exact_once_and_outside_the_daily_cap(client, make_user):
    from datetime import timedelta
    from app.core.database import SessionLocal, utcnow
    from app.models.contest import Contest

    ngo_h = _ngo(client)
    cid = client.post("/api/contests", json=_contest_body(), headers=ngo_h).json()["id"]
    users = [make_user(email=f"u{i}@x.com", name=f"U{i}")[0] for i in range(5)]
    scores = [3, 3, 2, 1, 0]
    for h, sc in zip(users, scores):
        _play(client, h, cid, right=sc)
    _set_durations(cid, [10, 20, 30, 40, 50])
    # a routine action earlier today still has its full 60-point allowance after prizes land
    with SessionLocal() as db:
        c = db.get(Contest, cid)
        c.starts_at = utcnow() - timedelta(days=3)
        c.ends_at = utcnow() - timedelta(seconds=5)
        db.commit()

    lb = client.get(f"/api/contests/{cid}/leaderboard", headers=users[0]).json()
    assert lb["contest"]["status"] == "ended" and lb["contest"]["finalized"]
    pts = [client.get("/api/auth/me", headers=h).json()["points"] for h in users]
    assert pts == [110, 70, 50, 10, 0]   # 100/60/40 + 10 for finishing with a right answer; 0 right = nothing
    assert [r["rank"] for r in lb["rows"]] == [1, 2, 3, 4, 5]
    again = [client.get("/api/auth/me", headers=h).json()["points"] for h in users]
    client.get("/api/contests", headers=users[1]); client.get(f"/api/contests/{cid}/leaderboard", headers=users[2])
    assert again == pts == [client.get("/api/auth/me", headers=h).json()["points"] for h in users]  # paid once
    assert client.post(f"/api/contests/{cid}/start", headers=users[0]).status_code in (409,)
    note_titles = [n["title"] for n in client.get("/api/notifications", headers=users[0]).json()["items"]]
    assert any("placed #1" in t for t in note_titles)
    review = client.get(f"/api/contests/{cid}/review", headers=users[0]).json()
    assert len(review) == 3 and review[0]["explanation"] == "because"
    # prizes did not use up the daily cap: a normal report today still earns in full
    r = client.post("/api/issues", json=ISSUE, headers=users[0])
    assert r.status_code == 201


# ---------------------------------------------------------------- report quality & deleting reports
GOOD = {
    "title": "Deep pothole near metro pillar",
    "description": "A deep pothole has formed in the left lane and two-wheelers swerve into traffic to avoid it.",
    "category": "Roads",
    "priority": "High",
    "address": "12th Main Road, Indiranagar",
    "latitude": 12.9784,
    "longitude": 77.6408,
}


def _upload(client, headers, seed=None):
    r = client.post("/api/uploads", files={"file": ("a.png", real_image("PNG", seed=seed), "image/png")}, headers=headers)
    assert r.status_code == 201
    return r.json()["url"]


def _strict(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "STRICT_REPORT_RULES", True)


def test_report_needs_photo_description_and_location(client, make_user, monkeypatch):
    _strict(monkeypatch)
    h, _ = make_user()
    url = _upload(client, h)

    r = client.post("/api/issues", json={**GOOD, "image_urls": []}, headers=h)
    assert r.status_code == 422 and "photo" in r.json()["detail"]
    r = client.post("/api/issues", json={**GOOD, "description": "bad road", "image_urls": [url]}, headers=h)
    assert r.status_code == 422 and "describe" in r.json()["detail"].lower()
    r = client.post("/api/issues", json={**GOOD, "description": "a" * 60, "image_urls": [url]}, headers=h)
    assert r.status_code == 422
    r = client.post("/api/issues", json={**GOOD, "title": "Road", "image_urls": [url]}, headers=h)
    assert r.status_code == 422 and "title" in r.json()["detail"].lower()
    no_loc = {k: v for k, v in GOOD.items() if k not in ("address", "latitude", "longitude")}
    r = client.post("/api/issues", json={**no_loc, "image_urls": [url]}, headers=h)
    assert r.status_code == 422 and "location" in r.json()["detail"].lower()
    r = client.post("/api/issues", json={**GOOD, "image_urls": ["/uploads/does-not-exist.jpg"]}, headers=h)
    assert r.status_code == 422 and "photo" in r.json()["detail"].lower()
    r = client.post("/api/issues", json={**GOOD, "image_urls": ["https://example.com/x.jpg"]}, headers=h)
    assert r.status_code == 422

    ok = client.post("/api/issues", json={**GOOD, "image_urls": [url]}, headers=h)
    assert ok.status_code == 201 and ok.json()["points_awarded"] == 35  # 20 + 10 photo + 5 location


def test_duplicate_reports_are_rejected(client, make_user, monkeypatch):
    _strict(monkeypatch)
    a_h, _ = make_user(email="a@example.com")
    b_h, _ = make_user(email="b@example.com")
    first = client.post("/api/issues", json={**GOOD, "image_urls": [_upload(client, a_h)]}, headers=a_h)
    assert first.status_code == 201
    first_id = first.json()["issue"]["id"]

    # same person, same problem again -> told to add photos to the first report
    again = client.post("/api/issues", json={**GOOD, "image_urls": [_upload(client, a_h)]}, headers=a_h)
    assert again.status_code == 409 and again.json()["detail"]["code"] == "duplicate_own_report"

    # somebody else, ~50 m away, reworded -> pointed at the existing report
    near = {**GOOD, "title": "Big pothole by the metro pillar", "latitude": 12.9787, "longitude": 77.6410}
    dup = client.post("/api/issues", json={**near, "image_urls": [_upload(client, b_h)]}, headers=b_h)
    assert dup.status_code == 409
    assert dup.json()["detail"]["code"] == "duplicate_report" and dup.json()["detail"]["issue_id"] == first_id

    # far away (a different spot) or another category is fine
    far = {**GOOD, "latitude": 12.9352, "longitude": 77.6245, "address": "Koramangala 4th Block"}
    assert client.post("/api/issues", json={**far, "image_urls": [_upload(client, b_h)]}, headers=b_h).status_code == 201
    other = {**GOOD, "category": "Water", "title": "Water pipeline burst on the lane", "description": "The water pipeline burst and the whole lane is flooded since this morning."}
    assert client.post("/api/issues", json={**other, "image_urls": [_upload(client, b_h)]}, headers=b_h).status_code == 201


def test_daily_report_limit(client, make_user, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "MAX_REPORTS_PER_DAY", 2)
    h, _ = make_user()
    for i in range(2):
        assert client.post("/api/issues", json={**ISSUE, "title": f"Report number {i} here"}, headers=h).status_code == 201
    assert client.post("/api/issues", json=ISSUE, headers=h).status_code == 429


def test_owner_can_delete_report_and_points_are_taken_back(client, make_user, official_headers):
    owner_h, owner = make_user(email="o@example.com")
    voter_h, _ = make_user(email="v@example.com")
    other_h, _ = make_user(email="x@example.com")
    img = _upload(client, owner_h)
    created = client.post("/api/issues", json={**ISSUE, "image_urls": [img], "address": "MG Road"}, headers=owner_h).json()
    iid = created["issue"]["id"]
    assert created["user_points"] == 35
    client.post(f"/api/issues/{iid}/upvote", headers=voter_h)
    client.post(f"/api/issues/{iid}/comments", json={"text": "me too"}, headers=voter_h)

    assert client.delete(f"/api/issues/{iid}", headers=other_h).status_code == 403
    assert client.delete(f"/api/issues/{iid}").status_code == 401

    r = client.delete(f"/api/issues/{iid}", headers=owner_h)
    assert r.status_code == 200 and r.json()["points_reverted"] == 35 and r.json()["user_points"] == 0
    me = client.get("/api/auth/me", headers=owner_h).json()
    assert me["points"] == 0 and me["reports_count"] == 0
    assert client.get("/api/auth/me", headers=voter_h).json()["supported_count"] == 0
    assert client.get(f"/api/issues/{iid}").status_code == 404
    assert client.get(img).status_code == 404  # the photo file is gone too
    assert client.delete(f"/api/issues/{iid}", headers=owner_h).status_code == 404

    # delete + re-report can't be used to farm points: reversing does not free up the daily cap
    again = client.post("/api/issues", json={**ISSUE, "title": "Pothole on Main Road again", "image_urls": [_upload(client, owner_h)]}, headers=owner_h).json()
    assert again["points_awarded"] == 25 and again["user_points"] == 25  # only 60 - 35 cap room left


def test_report_cannot_be_deleted_once_officials_started(client, make_user, official_headers):
    owner_h, _ = make_user(email="o@example.com")
    iid = client.post("/api/issues", json=ISSUE, headers=owner_h).json()["issue"]["id"]
    client.patch(f"/api/issues/{iid}/status", json={"status": "Under Review"}, headers=official_headers)
    r = client.delete(f"/api/issues/{iid}", headers=owner_h)
    assert r.status_code == 409 and "Under Review" in r.json()["detail"]
    assert client.get(f"/api/issues/{iid}").status_code == 200


def test_deleted_report_disappears_everywhere(client, make_user):
    h, _ = make_user()
    keep = client.post("/api/issues", json={**ISSUE, "title": "Report that stays here"}, headers=h).json()["issue"]["id"]
    gone = client.post("/api/issues", json={**ISSUE, "title": "Report that goes away"}, headers=h).json()["issue"]["id"]
    assert client.delete(f"/api/issues/{gone}", headers=h).status_code == 200

    ids = [i["id"] for i in client.get("/api/issues").json()["items"]]
    assert ids == [keep]
    assert client.get("/api/issues", params={"q": "deleted"}).json()["total"] == 0
    assert client.get(f"/api/issues/{gone}/supporters", headers=h).status_code == 404
    assert client.post(f"/api/issues/{gone}/comments", json={"text": "hi"}, headers=h).status_code == 404
    assert client.get("/api/analytics/summary", headers=h).json()["mine"]["total"] == 1
