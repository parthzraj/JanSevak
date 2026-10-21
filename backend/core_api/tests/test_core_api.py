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
    # academy courses are verified by the server and the NGO now, so they cannot be claimed either
    assert client.post("/api/rewards/claim", json={"action_type": "academy_module", "action_id": "m1", "points": 30}, headers=headers).status_code == 400
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


# ---------------------------------------------------------------- civic drives (campaigns) and NGO vacancies
from datetime import datetime, timedelta, timezone  # noqa: E402


def _iso(**delta):
    return (datetime.now(timezone.utc) + timedelta(**delta)).isoformat()


def _campaign(**over):
    body = {
        "title": "Lake clean-up Sunday",
        "description": "Bring gloves and a bag, we clear the lake edge together.",
        "kind": "Cleanup",
        "address": "Ulsoor Lake",
        "starts_at": _iso(days=1),
        "ends_at": _iso(days=1, hours=3),
        "volunteers_needed": 5,
    }
    body.update(over)
    return body


def _start_now(client_headers_fn=None):
    """Move a campaign's start into the past so it can be wrapped up."""
    from app.core.database import SessionLocal
    from app.models.volunteer import Campaign

    def go(cid):
        with SessionLocal() as db:
            c = db.get(Campaign, cid)
            c.starts_at = datetime.now(timezone.utc) - timedelta(hours=4)
            c.ends_at = datetime.now(timezone.utc) - timedelta(hours=1)
            db.commit()

    return go


def test_any_citizen_can_organise_a_campaign_linked_to_an_issue_or_standalone(client, make_user):
    h, _ = make_user(email="org@example.com")
    iid = client.post("/api/issues", json=ISSUE, headers=h).json()["issue"]["id"]
    linked = client.post("/api/campaigns", json=_campaign(issue_id=iid), headers=h)
    assert linked.status_code == 201
    body = linked.json()
    assert body["status"] == "Upcoming" and body["organiser_type"] == "Citizen" and body["is_organiser"] is True
    assert body["issue"]["id"] == iid
    assert client.post("/api/campaigns", json=_campaign(title="Plain drive"), headers=h).json()["issue"] is None
    assert client.post("/api/campaigns", json=_campaign(issue_id=9999), headers=h).status_code == 404
    assert client.get(f"/api/campaigns?issue_id={iid}").json()["total"] == 1
    assert client.post("/api/campaigns", json=_campaign()).status_code == 401


def test_campaign_time_rules(client, make_user):
    h, _ = make_user()
    assert client.post("/api/campaigns", json=_campaign(starts_at=_iso(days=-2), ends_at=_iso(days=-1)), headers=h).status_code == 422
    assert client.post("/api/campaigns", json=_campaign(ends_at=_iso(hours=1)), headers=h).status_code == 422
    assert client.post("/api/campaigns", json=_campaign(ends_at=_iso(days=30)), headers=h).status_code == 422


def test_max_five_open_campaigns_per_organiser(client, make_user):
    h, _ = make_user()
    for i in range(5):
        assert client.post("/api/campaigns", json=_campaign(title=f"Drive number {i}"), headers=h).status_code == 201
    assert client.post("/api/campaigns", json=_campaign(title="Sixth drive"), headers=h).status_code == 409


def test_join_leave_capacity_and_own_campaign(client, make_user):
    org, _ = make_user(email="o@example.com")
    cid = client.post("/api/campaigns", json=_campaign(volunteers_needed=1), headers=org).json()["id"]
    a, _ = make_user(email="a@example.com")
    b, _ = make_user(email="b@example.com")
    assert client.post(f"/api/campaigns/{cid}/join", headers=org).status_code == 403
    r = client.post(f"/api/campaigns/{cid}/join", headers=a)
    assert r.status_code == 200 and r.json()["my_status"] == "Joined" and r.json()["volunteers_joined"] == 1
    assert client.post(f"/api/campaigns/{cid}/join", headers=a).status_code == 409
    assert client.post(f"/api/campaigns/{cid}/join", headers=b).status_code == 409  # full
    assert client.delete(f"/api/campaigns/{cid}/join", headers=a).json()["volunteers_joined"] == 0
    assert client.post(f"/api/campaigns/{cid}/join", headers=b).status_code == 200
    notes = client.get("/api/notifications", headers=org).json()
    assert any("joined" in n["message"] for n in (notes["items"] if isinstance(notes, dict) else notes))


def test_wrap_up_pays_confirmed_volunteers_and_organiser(client, make_user):
    org, org_u = make_user(email="o@example.com")
    cid = client.post("/api/campaigns", json=_campaign(), headers=org).json()["id"]
    vols = [make_user(email=f"v{i}@example.com") for i in range(3)]
    for h, _ in vols:
        client.post(f"/api/campaigns/{cid}/join", headers=h)
    assert client.post(f"/api/campaigns/{cid}/complete", json={"attended_user_ids": [vols[0][1]["id"]]}, headers=org).status_code == 409  # not started

    _start_now()(cid)
    assert client.post(f"/api/campaigns/{cid}/complete", json={"attended_user_ids": [vols[0][1]["id"]]}, headers=vols[0][0]).status_code == 403
    assert client.post(f"/api/campaigns/{cid}/complete", json={"attended_user_ids": [org_u["id"]]}, headers=org).status_code == 400
    assert client.post(f"/api/campaigns/{cid}/complete", json={"attended_user_ids": []}, headers=org).status_code == 400
    assert client.post(f"/api/campaigns/{cid}/complete", json={"attended_user_ids": [99999]}, headers=org).status_code == 400

    ids = [vols[0][1]["id"], vols[1][1]["id"]]
    r = client.post(f"/api/campaigns/{cid}/complete", json={"attended_user_ids": ids}, headers=org)
    assert r.status_code == 200
    out = r.json()
    assert out["campaign"]["status"] == "Completed" and out["attended"] == 2 and out["no_show"] == 1
    assert out["host_points_awarded"] == 40 and out["volunteers_paid"] == 2  # 20 + 10 * 2
    assert client.get("/api/auth/me", headers=org).json()["points"] == 40
    me0 = client.get("/api/auth/me", headers=vols[0][0]).json()
    assert me0["points"] == 30 and me0["volunteer_hours"] == 3.0
    assert client.get("/api/auth/me", headers=vols[2][0]).json()["points"] == 0  # no-show
    states = {m["user_id"]: m["status"] for m in out["campaign"]["members"]}
    assert states[vols[2][1]["id"]] == "NoShow"
    # paid exactly once, history shows it
    assert client.post(f"/api/campaigns/{cid}/complete", json={"attended_user_ids": ids}, headers=org).status_code == 409
    hist = client.get("/api/rewards/history", headers=vols[0][0]).json()
    items = hist["items"] if isinstance(hist, dict) else hist
    assert any("Civic drive" in i["description"] for i in items)


def test_cancel_and_edit_rules(client, make_user):
    org, _ = make_user(email="o@example.com")
    v, _ = make_user(email="v@example.com")
    cid = client.post("/api/campaigns", json=_campaign(), headers=org).json()["id"]
    client.post(f"/api/campaigns/{cid}/join", headers=v)
    assert client.patch(f"/api/campaigns/{cid}", json={"title": "Hacked title"}, headers=v).status_code == 403
    assert client.patch(f"/api/campaigns/{cid}", json={"volunteers_needed": 1}, headers=org).status_code == 200
    assert client.patch(f"/api/campaigns/{cid}", json={"volunteers_needed": 1, "title": "Renamed drive"}, headers=org).json()["title"] == "Renamed drive"
    r = client.post(f"/api/campaigns/{cid}/cancel", headers=org)
    assert r.json()["status"] == "Cancelled"
    assert client.post(f"/api/campaigns/{cid}/join", headers=make_user(email="late@example.com")[0]).status_code == 409
    assert client.patch(f"/api/campaigns/{cid}", json={"title": "Edit after cancel"}, headers=org).status_code == 409
    assert client.post(f"/api/campaigns/{cid}/complete", json={"attended_user_ids": []}, headers=org).status_code == 409


def test_campaign_listing_filters_and_status(client, make_user):
    ngo_h = _ngo(client)
    cit, _ = make_user(email="c@example.com")
    n = client.post("/api/campaigns", json=_campaign(title="NGO drive here"), headers=ngo_h).json()
    c1 = client.post("/api/campaigns", json=_campaign(title="Citizen drive here"), headers=cit).json()
    assert n["organiser_type"] == "NGO"
    assert client.get("/api/campaigns?organiser_type=ngo").json()["total"] == 1
    assert client.get("/api/campaigns?organiser_type=citizen").json()["items"][0]["id"] == c1["id"]
    assert client.get("/api/campaigns?status=Upcoming").json()["total"] == 2
    assert client.get("/api/campaigns?status=Ongoing").json()["total"] == 0
    _start_now()(c1["id"])
    assert client.get("/api/campaigns?status=Awaiting wrap-up").json()["total"] == 1
    client.post(f"/api/campaigns/{c1['id']}/cancel", headers=cit)
    assert client.get("/api/campaigns?status=Cancelled").json()["total"] == 1
    assert client.get("/api/campaigns?mine=true", headers=cit).json()["total"] == 1
    assert client.get("/api/campaigns?mine=true").status_code == 401


def test_weekly_cap_on_paid_volunteering_but_hours_still_count(client, make_user):
    v, v_u = make_user(email="busy@example.com")
    for i in range(4):
        org, _ = make_user(email=f"org{i}@example.com")
        cid = client.post("/api/campaigns", json=_campaign(title=f"Drive number {i}"), headers=org).json()["id"]
        client.post(f"/api/campaigns/{cid}/join", headers=v)
        _start_now()(cid)
        r = client.post(f"/api/campaigns/{cid}/complete", json={"attended_user_ids": [v_u["id"]]}, headers=org).json()
    me = client.get("/api/auth/me", headers=v).json()
    assert me["points"] == 90  # three paid drives, the fourth only credits hours
    assert me["volunteer_hours"] == 12.0
    assert r["volunteers_paid"] == 0 and any("weekly" in n for n in r["notes"])


def _vac(**over):
    body = {"title": "Weekend clean-up crew", "role_type": "Volunteer", "description": "Help us clear lakes every weekend.", "slots": 1}
    body.update(over)
    return body


def test_only_ngos_post_vacancies_and_citizens_apply(client, make_user):
    ngo_h = _ngo(client)
    cit, _ = make_user(email="c@example.com")
    assert client.post("/api/vacancies", json=_vac(), headers=cit).status_code == 403
    assert client.post("/api/vacancies", json=_vac()).status_code == 401
    v = client.post("/api/vacancies", json=_vac(), headers=ngo_h).json()
    assert v["is_owner"] is True and v["is_open"] is True and v["ngo"]["is_ngo"] is True
    assert client.post("/api/vacancies", json=_vac(deadline=_iso(days=-1)), headers=ngo_h).status_code == 422

    assert client.post(f"/api/vacancies/{v['id']}/apply", json={"note": "I can help"}, headers=ngo_h).status_code == 403
    r = client.post(f"/api/vacancies/{v['id']}/apply", json={"note": "I can help"}, headers=cit)
    assert r.status_code == 200 and r.json()["my_application"] == "Applied" and r.json()["applicants_count"] == 1
    assert client.post(f"/api/vacancies/{v['id']}/apply", json={}, headers=cit).status_code == 409
    assert client.delete(f"/api/vacancies/{v['id']}/apply", headers=cit).json()["my_application"] == "Withdrawn"
    assert client.post(f"/api/vacancies/{v['id']}/apply", json={}, headers=cit).json()["my_application"] == "Applied"
    assert client.get("/api/vacancies", headers=cit).json()["items"][0]["my_application"] == "Applied"
    assert client.get("/api/vacancies?mine=true", headers=cit).json()["total"] == 0


def test_application_review_flow_and_completion_reward(client, make_user):
    ngo_h = _ngo(client)
    a, _ = make_user(email="a@example.com")
    b, _ = make_user(email="b@example.com")
    other_ngo = client.post("/api/auth/register", json={"name": "Other Trust", "email": "o2@x.org", "password": "secret1", "account_type": "ngo", "ngo_code": "ngo-secret"}).json()
    other_h = {"Authorization": f"Bearer {other_ngo['access_token']}"}
    vid = client.post("/api/vacancies", json=_vac(slots=1), headers=ngo_h).json()["id"]
    client.post(f"/api/vacancies/{vid}/apply", json={"note": "A"}, headers=a)
    client.post(f"/api/vacancies/{vid}/apply", json={"note": "B"}, headers=b)

    assert client.get(f"/api/vacancies/{vid}/applications", headers=other_h).status_code == 403
    assert client.get(f"/api/vacancies/{vid}/applications", headers=a).status_code == 403
    apps = client.get(f"/api/vacancies/{vid}/applications", headers=ngo_h).json()
    assert [x["note"] for x in apps] == ["A", "B"]
    aid, bid = apps[0]["id"], apps[1]["id"]

    assert client.patch(f"/api/vacancies/{vid}/applications/{aid}", json={"status": "Completed"}, headers=ngo_h).status_code == 409  # not accepted yet
    assert client.patch(f"/api/vacancies/{vid}/applications/{aid}", json={"status": "Accepted"}, headers=ngo_h).status_code == 200
    assert client.patch(f"/api/vacancies/{vid}/applications/{bid}", json={"status": "Accepted"}, headers=ngo_h).status_code == 409  # slots full
    assert client.patch(f"/api/vacancies/{vid}/applications/{bid}", json={"status": "Rejected"}, headers=ngo_h).status_code == 200
    assert client.delete(f"/api/vacancies/{vid}/apply", headers=a).status_code == 409  # accepted: cannot withdraw

    done = client.patch(f"/api/vacancies/{vid}/applications/{aid}", json={"status": "Completed"}, headers=ngo_h).json()
    assert done["status"] == "Completed" and done["points_awarded"] == 40
    assert client.get("/api/auth/me", headers=a).json()["points"] == 40
    assert client.get("/api/auth/me", headers=b).json()["points"] == 0
    mine = client.get("/api/vacancies/applications/mine", headers=a).json()
    assert mine[0]["status"] == "Completed" and mine[0]["vacancy"]["id"] == vid
    # a second completion cannot pay twice
    assert client.patch(f"/api/vacancies/{vid}/applications/{aid}", json={"status": "Completed"}, headers=ngo_h).status_code == 409


def test_closed_vacancy_rejects_applications(client, make_user):
    ngo_h = _ngo(client)
    cit, _ = make_user(email="c@example.com")
    vid = client.post("/api/vacancies", json=_vac(), headers=ngo_h).json()["id"]
    assert client.post(f"/api/vacancies/{vid}/close", headers=cit).status_code == 403
    assert client.post(f"/api/vacancies/{vid}/close", headers=ngo_h).json()["is_open"] is False
    assert client.post(f"/api/vacancies/{vid}/apply", json={}, headers=cit).status_code == 409
    assert client.get("/api/vacancies").json()["total"] == 0
    assert client.get("/api/vacancies?include_closed=true").json()["total"] == 1



# ---------------------------------------------------------------- Civic Academy
READING_TEXT = "Rainwater that is collected from a roof can be stored or sent down to recharge the groundwater under a plot. " * 3


def _course(**kw):
    body = {
        "title": "Rainwater harvesting basics",
        "summary": "How a roof becomes a water source.",
        "description": "A short course on collecting and using rainwater at home, with two real tasks.",
        "level": "Beginner",
        "category": "Water",
        "publish": True,
        "lessons": [
            {"kind": "video", "title": "Why harvest rain", "summary": "A short introduction video.", "video_url": "https://youtu.be/dQw4w9WgXcQ", "duration_seconds": 20},
            {"kind": "reading", "title": "The four parts", "summary": "Catchment, carry, filter, store.", "body": READING_TEXT},
            {"kind": "task", "title": "Photograph your roof", "summary": "Show your catchment.", "task_mode": "physical", "proof_type": "photo",
             "instructions": "Take one clear photo of the roof together with its downpipe."},
            {"kind": "task", "title": "Work out your yield", "summary": "Use the formula.", "task_mode": "online", "proof_type": "text",
             "instructions": "Write your roof area, apply the formula and give the litres per year."},
        ],
    }
    body.update(kw)
    return body


class _Clock:
    def __init__(self):
        from datetime import datetime, timezone
        self.t = datetime.now(timezone.utc)

    def __call__(self):
        return self.t

    def advance(self, seconds):
        from datetime import timedelta
        self.t += timedelta(seconds=seconds)


@pytest.fixture
def clock(monkeypatch):
    c = _Clock()
    monkeypatch.setattr("app.routers.academy.utcnow", c)
    return c


def _lesson_ids(client, cid, headers=None):
    return [l["id"] for l in client.get(f"/api/academy/courses/{cid}", headers=headers or {}).json()["lessons"]]


def test_course_authoring_rules(client, make_user):
    ngo_h = _ngo(client)
    cit, _ = make_user(email="c@example.com")
    assert client.post("/api/academy/courses", json=_course(), headers=cit).status_code == 403  # only NGOs author
    bad_video = _course(lessons=[{"kind": "video", "title": "No length", "summary": "A video lesson.", "video_url": "https://youtu.be/dQw4w9WgXcQ"}])
    assert client.post("/api/academy/courses", json=bad_video, headers=ngo_h).status_code == 422
    not_video = _course(lessons=[{"kind": "video", "title": "Wrong site", "summary": "A video lesson.", "video_url": "https://example.com/page", "duration_seconds": 60}])
    assert client.post("/api/academy/courses", json=not_video, headers=ngo_h).status_code == 422
    short_task = _course(lessons=[{"kind": "task", "title": "Vague task", "summary": "Do something useful.", "task_mode": "online", "proof_type": "text", "instructions": "Do it"}])
    assert client.post("/api/academy/courses", json=short_task, headers=ngo_h).status_code == 422
    one = _course(lessons=_course()["lessons"][:1])
    assert client.post("/api/academy/courses", json=one, headers=ngo_h).status_code == 422  # publish needs 2+ lessons / 5+ minutes

    draft = client.post("/api/academy/courses", json=_course(publish=False), headers=ngo_h).json()
    assert draft["status"] == "Draft" and draft["lessons_count"] == 4 and draft["task_count"] == 2 and draft["points"] == 60
    assert client.get("/api/academy/courses").json()["total"] == 0  # drafts are private
    assert client.get(f"/api/academy/courses/{draft['id']}").status_code == 404
    assert client.get(f"/api/academy/courses/{draft['id']}", headers=ngo_h).status_code == 200
    assert client.post(f"/api/academy/courses/{draft['id']}/enroll", headers=cit).status_code == 404

    other = client.post("/api/auth/register", json={"name": "Other Trust", "email": "o3@x.org", "password": "secret1", "account_type": "ngo", "ngo_code": "ngo-secret"}).json()
    other_h = {"Authorization": f"Bearer {other['access_token']}"}
    assert client.post(f"/api/academy/courses/{draft['id']}/publish", headers=other_h).status_code == 403
    assert client.post(f"/api/academy/courses/{draft['id']}/publish", headers=ngo_h).json()["status"] == "Published"
    assert client.get("/api/academy/courses").json()["total"] == 1

    # public outline shows tasks clearly but hides the lesson content until you enroll
    pub = client.get(f"/api/academy/courses/{draft['id']}").json()
    assert pub["lessons"][0]["video_ref"] is None and pub["lessons"][1]["body"] is None
    assert "photo of the roof" in pub["lessons"][2]["instructions"] and pub["lessons"][2]["task_mode"] == "physical"

    assert client.post(f"/api/academy/courses/{draft['id']}/enroll", headers=ngo_h).status_code == 403  # NGOs do not take courses
    assert client.post(f"/api/academy/courses/{draft['id']}/enroll", headers=cit).status_code == 201
    assert client.post(f"/api/academy/courses/{draft['id']}/enroll", headers=cit).status_code == 409
    assert client.patch(f"/api/academy/courses/{draft['id']}", json={"lessons": _course()["lessons"]}, headers=ngo_h).status_code == 409  # locked
    assert client.patch(f"/api/academy/courses/{draft['id']}", json={"title": "Rainwater harvesting, updated"}, headers=ngo_h).status_code == 200
    assert client.delete(f"/api/academy/courses/{draft['id']}", headers=ngo_h).status_code == 409


def test_video_cannot_be_skipped_and_lessons_are_sequential(client, make_user, clock):
    ngo_h = _ngo(client)
    cit, _ = make_user(email="c@example.com")
    cid = client.post("/api/academy/courses", json=_course(), headers=ngo_h).json()["id"]
    v, r, t1, t2 = _lesson_ids(client, cid, ngo_h)
    base = f"/api/academy/courses/{cid}/lessons"
    assert client.post(f"{base}/{v}/open", headers=cit).status_code == 403  # not enrolled
    client.post(f"/api/academy/courses/{cid}/enroll", headers=cit)

    assert client.post(f"{base}/{r}/open", headers=cit).status_code == 409  # lesson 2 is locked
    opened = client.post(f"{base}/{v}/open", headers=cit).json()
    assert opened["lesson"]["video_kind"] == "youtube" and opened["lesson"]["video_ref"] == "dQw4w9WgXcQ"
    assert opened["lesson"]["required_seconds"] == 18 and opened["enrollment"]["percent"] == 0
    beat = lambda pos: client.post(f"{base}/{v}/heartbeat", json={"position": pos}, headers=cit).json()["lesson"]["watched_seconds"]
    done = lambda: client.post(f"{base}/{v}/complete", headers=cit)

    assert beat(0) == 0  # first beat of a viewing only starts the clock
    assert done().status_code == 409  # nothing watched
    clock.advance(5)
    assert beat(5) == 5  # five real seconds of playback
    clock.advance(5)
    assert beat(2) == 5  # rewinding earns nothing...
    clock.advance(5)
    assert beat(7) == 7  # ...and the budget is time-based, so a late or jittery beat loses nothing
    clock.advance(5)
    assert beat(2) == 7  # rewatching old ground earns nothing new
    clock.advance(5)
    assert beat(7) == 7
    assert done().status_code == 409
    for pos in (12, 17):  # honest playback carries on from second 7
        clock.advance(5)
        beat(pos)
    assert done().status_code == 409  # 17 of the 18 required seconds
    clock.advance(5)
    assert beat(20) == 20
    finished = done()
    assert finished.status_code == 200 and finished.json()["lesson"]["state"] == "done"
    assert finished.json()["enrollment"]["percent"] == 25
    assert client.post(f"{base}/{r}/open", headers=cit).status_code == 200  # next lesson unlocked


def test_skipping_ahead_earns_only_real_time(client, make_user, clock):
    ngo_h = _ngo(client)
    cit, _ = make_user(email="c@example.com")
    cid = client.post("/api/academy/courses", json=_course(), headers=ngo_h).json()["id"]
    v = _lesson_ids(client, cid, ngo_h)[0]
    client.post(f"/api/academy/courses/{cid}/enroll", headers=cit)
    base = f"/api/academy/courses/{cid}/lessons/{v}"
    client.post(f"{base}/open", headers=cit)
    beat = lambda pos: client.post(f"{base}/heartbeat", json={"position": pos}, headers=cit).json()["lesson"]["watched_seconds"]
    beat(0)
    clock.advance(3)
    assert beat(20) <= 5  # jumped to the end after 3 real seconds: at most those seconds (plus slack) count
    for _ in range(10):  # a burst of beats earns nothing extra
        assert beat(20) <= 5
    assert client.post(f"{base}/complete", headers=cit).status_code == 409
    # beats for a lesson that is not a video, or from someone not enrolled, are refused
    other, _ = make_user(email="d@example.com")
    assert client.post(f"{base}/heartbeat", json={"position": 1}, headers=other).status_code == 403


def test_reading_needs_time_on_page(client, make_user, clock):
    ngo_h = _ngo(client)
    cit, _ = make_user(email="c@example.com")
    cid = client.post("/api/academy/courses", json=_course(lessons=[
        {"kind": "reading", "title": "Read me", "summary": "A reading lesson.", "body": READING_TEXT * 12},
        {"kind": "reading", "title": "Read me too", "summary": "Another reading lesson.", "body": READING_TEXT * 12},
    ]), headers=ngo_h).json()["id"]
    r1, r2 = _lesson_ids(client, cid, ngo_h)
    client.post(f"/api/academy/courses/{cid}/enroll", headers=cit)
    base = f"/api/academy/courses/{cid}/lessons"
    opened = client.post(f"{base}/{r1}/open", headers=cit).json()["lesson"]
    need = opened["required_seconds"]
    assert need >= 10 and opened["body"]
    assert client.post(f"{base}/{r1}/complete", headers=cit).status_code == 409
    clock.advance(need - 1)
    assert client.post(f"{base}/{r1}/complete", headers=cit).status_code == 409
    clock.advance(2)
    assert client.post(f"{base}/{r1}/complete", headers=cit).status_code == 200
    # closing and reopening restarts the clock on the next reading lesson
    client.post(f"{base}/{r2}/open", headers=cit)
    assert client.post(f"{base}/{r2}/complete", headers=cit).status_code == 409


def _finish_video_and_reading(client, cit, cid, clock):
    v, r, *_ = _lesson_ids(client, cid, cit)
    base = f"/api/academy/courses/{cid}/lessons"
    client.post(f"{base}/{v}/open", headers=cit)
    client.post(f"{base}/{v}/heartbeat", json={"position": 0}, headers=cit)
    for pos in (5, 10, 15, 20):
        clock.advance(5)
        client.post(f"{base}/{v}/heartbeat", json={"position": pos}, headers=cit)
    assert client.post(f"{base}/{v}/complete", headers=cit).status_code == 200
    client.post(f"{base}/{r}/open", headers=cit)
    clock.advance(60)
    assert client.post(f"{base}/{r}/complete", headers=cit).status_code == 200


def test_tasks_need_ngo_approval_then_certificate_and_points(client, make_user, clock):
    ngo_h = _ngo(client)
    other = client.post("/api/auth/register", json={"name": "Other Trust", "email": "o4@x.org", "password": "secret1", "account_type": "ngo", "ngo_code": "ngo-secret"}).json()
    other_h = {"Authorization": f"Bearer {other['access_token']}"}
    cit, _ = make_user(email="c@example.com")
    cid = client.post("/api/academy/courses", json=_course(), headers=ngo_h).json()["id"]
    _, _, t1, t2 = _lesson_ids(client, cid, ngo_h)
    client.post(f"/api/academy/courses/{cid}/enroll", headers=cit)
    base = f"/api/academy/courses/{cid}/lessons"
    _finish_video_and_reading(client, cit, cid, clock)

    assert client.post(f"{base}/{t2}/open", headers=cit).status_code == 409  # task 2 is locked behind task 1
    assert client.post(f"{base}/{t1}/open", headers=cit).status_code == 200
    assert client.post(f"{base}/{t1}/submit", json={}, headers=cit).status_code == 422  # photo required
    assert client.post(f"{base}/{t1}/submit", json={"proof_url": "/uploads/nope.png"}, headers=cit).status_code == 422  # must be a real upload
    assert client.post(f"{base}/{t1}/complete", headers=cit).status_code == 400  # tasks are never self-completed
    sub = client.post(f"{base}/{t1}/submit", json={"proof_url": _upload(client, cit)}, headers=cit).json()
    assert sub["lesson"]["state"] == "submitted" and sub["enrollment"]["percent"] < 100
    assert client.post(f"{base}/{t1}/submit", json={"proof_url": _upload(client, cit)}, headers=cit).status_code == 409  # waiting for review

    queue = client.get("/api/academy/submissions", headers=ngo_h).json()
    assert len(queue) == 1 and queue[0]["learner"]["name"] and queue[0]["proof_url"].startswith("/uploads/")
    assert client.get("/api/academy/submissions", headers=cit).status_code == 403
    assert client.get("/api/academy/submissions", headers=other_h).json() == []  # another NGO sees nothing
    pid = queue[0]["id"]
    assert client.patch(f"/api/academy/submissions/{pid}", json={"decision": "approve"}, headers=other_h).status_code == 403
    assert client.patch(f"/api/academy/submissions/{pid}", json={"decision": "reject"}, headers=ngo_h).status_code == 422  # a reason is required
    rej = client.patch(f"/api/academy/submissions/{pid}", json={"decision": "reject", "feedback": "The downpipe is not visible"}, headers=ngo_h)
    assert rej.status_code == 200 and rej.json()["item"]["status"] == "rejected"
    mine = client.get(f"/api/academy/courses/{cid}", headers=cit).json()["lessons"][2]
    assert mine["state"] == "rejected" and mine["feedback"] == "The downpipe is not visible"

    assert client.post(f"{base}/{t1}/submit", json={"proof_url": _upload(client, cit)}, headers=cit).json()["lesson"]["attempts"] == 2
    assert client.patch(f"/api/academy/submissions/{pid}", json={"decision": "approve"}, headers=ngo_h).status_code == 200
    assert client.patch(f"/api/academy/submissions/{pid}", json={"decision": "approve"}, headers=ngo_h).status_code == 409  # already reviewed

    assert client.get("/api/auth/me", headers=cit).json()["points"] == 0  # no points before the course is finished
    assert client.get("/api/academy/certificates/mine", headers=cit).json() == []
    assert client.post(f"{base}/{t2}/open", headers=cit).status_code == 200
    assert client.post(f"{base}/{t2}/submit", json={"proof_text": "too short"}, headers=cit).status_code == 422
    client.post(f"{base}/{t2}/submit", json={"proof_text": "My roof is 93 square metres so it yields about 70,000 litres a year."}, headers=cit)
    pid2 = client.get("/api/academy/submissions", headers=ngo_h).json()[0]["id"]
    result = client.patch(f"/api/academy/submissions/{pid2}", json={"decision": "approve"}, headers=ngo_h).json()
    assert result["course_completed"] is True

    assert client.get("/api/auth/me", headers=cit).json()["points"] == 60
    detail = client.get(f"/api/academy/courses/{cid}", headers=cit).json()
    assert detail["my"]["completed"] is True and detail["my"]["percent"] == 100 and detail["my"]["points_awarded"] == 60
    certs = client.get("/api/academy/certificates/mine", headers=cit).json()
    assert len(certs) == 1 and certs[0]["course_title"] == "Rainwater harvesting basics" and certs[0]["tasks_verified"] == 2
    code = certs[0]["code"]
    assert code.startswith("JS-")
    public = client.get(f"/api/academy/certificates/{code.lower()}")  # no login needed, case-insensitive
    assert public.status_code == 200 and public.json()["issuer"]["is_ngo"] is True
    assert client.get("/api/academy/certificates/JS-000-0000-ZZZZ").status_code == 404
    assert any(t["action_type"] == "course_complete" for t in client.get("/api/rewards/history", headers=cit).json()["items"])


def test_weekly_course_point_limit_and_archive(client, make_user, clock):
    ngo_h = _ngo(client)
    cit, _ = make_user(email="c@example.com")
    two_readings = lambda n: _course(title=f"Reading course {n}", lessons=[
        {"kind": "reading", "title": "Part one", "summary": "The first reading.", "body": READING_TEXT * 12},
        {"kind": "reading", "title": "Part two", "summary": "The second reading.", "body": READING_TEXT * 12},
    ])
    ids = [client.post("/api/academy/courses", json=two_readings(n), headers=ngo_h).json()["id"] for n in range(3)]
    awarded = []
    for cid in ids:
        client.post(f"/api/academy/courses/{cid}/enroll", headers=cit)
        for lid in _lesson_ids(client, cid, cit):
            client.post(f"/api/academy/courses/{cid}/lessons/{lid}/open", headers=cit)
            clock.advance(120)
            assert client.post(f"/api/academy/courses/{cid}/lessons/{lid}/complete", headers=cit).status_code == 200
        my = client.get(f"/api/academy/courses/{cid}", headers=cit).json()["my"]
        assert my["completed"] and my["certificate_code"]  # a certificate is always issued
        awarded.append(my["points_awarded"])
    assert awarded == [60, 60, 0]  # but only two courses a week pay points
    assert client.get("/api/auth/me", headers=cit).json()["points"] == 120

    assert client.post(f"/api/academy/courses/{ids[0]}/archive", headers=ngo_h).json()["status"] == "Archived"
    assert client.get("/api/academy/courses").json()["total"] == 2
    assert client.get(f"/api/academy/courses/{ids[0]}").status_code == 404  # strangers can no longer open it
    assert client.get(f"/api/academy/courses/{ids[0]}", headers=cit).status_code == 200  # learners keep their course
    assert client.get("/api/academy/courses?enrolled=true", headers=cit).json()["total"] == 3
    assert client.get("/api/academy/courses?mine=true", headers=ngo_h).json()["total"] == 3
    assert client.get("/api/academy/courses?enrolled=true").status_code == 401
