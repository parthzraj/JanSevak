# PrajaPulse Core API (`backend/core_api/`)

Developer 2's service: auth, civic issues, voting, comments, rewards, notifications, uploads and the
proxy to the AI service. Runs on **port 8000**, stores data in **SQLite** (no setup, no cost).

> Do not touch `frontend/`, `backend/ai_service/` or `backend/CONTRACT.md`.

## Run it

```bash
cd backend/core_api
python -m venv .venv
.venv\Scripts\activate          # Windows   (Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          # Mac/Linux: cp .env.example .env
python seed_data.py             # optional demo data (add --reset to wipe first)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger UI: http://localhost:8000/docs (click **Authorize**, log in with an email + password).

Tests: `python -m pytest -q` (uses a throw-away database, no AI service needed).

## Demo accounts (`python seed_data.py`, password `demo123`)

| Email | Tier | Points | Notes |
|---|---|---|---|
| ayush@example.com | Gold | 340 | citizen |
| priya@example.com | Silver | 180 | citizen |
| rahul@example.com | Bronze | 40 | citizen |
| official@example.com | - | 0 | municipal official: the only role that can change issue status |

## Endpoints (all under `/api`)

| Area | Endpoint |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me` (name, ward, `avatar_url` = `preset:<man|woman|neutral>-N`, an `/uploads/...` photo, or `""` to reset) (`POST /auth/token` is the form login used by Swagger) |
| Issues | `GET /issues` (`category`, `status`, `priority`, `q`, `sort=recent\|votes`, `page`, `page_size`), `POST /issues`, `GET /issues/{id}`, `PATCH /issues/{id}/status` (official/admin only) |
| Delete | `DELETE /issues/{id}` (own report while status is still `Reported`; admins any report; the points it earned are taken back) |
| Votes | `POST /issues/{id}/upvote`, `DELETE /issues/{id}/upvote` |
| Users | `GET /users/{id}` (public profile: no email) |
| Analytics | `GET /analytics/summary` (live counts for the signed-in user and for the whole community: status, categories, resolution rate, average hours to resolve) |
| Evidence & supporters | `POST /issues/{id}/evidence` (multipart `files`, 1-3 photos, +10 pts once per issue, not on your own report), `GET /issues/{id}/supporters` |
| Comments | `POST /issues/{id}/comments`, `GET /issues/{id}/comments` |
| Rewards | `GET /rewards/wallet`, `GET /rewards/history`, `GET /rewards/leaderboard`, `POST /rewards/claim` (quiz / academy only) |
| Notifications | `GET /notifications`, `PATCH /notifications/{id}/read`, `POST /notifications/read-all` |
| Uploads | `POST /uploads` (multipart `file`, returns `{"url": "/uploads/..."}`; send that URL in `image_urls` when creating an issue) |
| AI proxy | `POST /ai/chatbot`, `/ai/complaint/generate`, `/ai/problem-description`, `/ai/hazard-alerts`, `/ai/suggestive-remarks`, `/ai/feed/prioritize`, `/ai/complaint/analyze-image`, `/ai/complaint/prepare-with-image`; `GET /ai/health` |
| Health | `GET /` and `GET /api/health` |

The proxy forwards to `AI_SERVICE_URL` (default `http://localhost:8001`) using the shapes in `CONTRACT.md`.
If Developer 1's service is down you get `503 {"detail": "AI inference engine is currently unreachable..."}`.
`POST /api/chatbot` and `POST /api/complaint/generate` (no `/ai`) also work, because the current frontend
(`src/lib/api.ts`) calls those paths directly.

## Rewards rules (implemented in `app/services/points_engine.py`)

* Report +20 (+10 if it has a photo, +5 if it has an address or GPS), upvote someone else's report +5,
  your report gets resolved +50. Cleanup / volunteer actions are in the points table for the NGO flow later.
* **Daily cap 60 points** per calendar day (Asia/Kolkata, change with `DAY_RESET_TZ`). Extra points are clipped.
* **No duplicates:** `(user_id, action_type, action_id)` is unique, so the same action never pays twice.
* **No self-verification:** you cannot upvote your own report.
* Removing an upvote takes back what it paid, once. Vote/unvote cycles cannot farm points.
* Tiers: Bronze 0-99, Silver 100-299, Gold 300-749, Platinum 750-1999, Legend 2000+.

## Report quality rules (`app/services/report_quality.py`, switch off with `STRICT_REPORT_RULES=false`)

A new report needs at least one uploaded photo, a title of 8+ characters, a real description (30+ characters, 6+ words,
not repeated characters) and a location (address of 5+ characters, or GPS / map pin). A report that repeats an existing
one is rejected with `409`: the same user within 24 h, or anybody within ~150 m in the same category with a similar
title/description in the last 14 days; the body of that error has `code` and the existing `issue_id`.
Limit: `MAX_REPORTS_PER_DAY` (default 10) per user. Deleted reports stay as hidden empty rows so ids are never reused.

## Photo checks (`app/services/image_check.py`)

Every upload (report photos and evidence) must fully decode with Pillow, so a valid header followed by
garbage, or a truncated file, is rejected (422). Accepted images are re-encoded: EXIF/GPS and hidden extra
bytes are dropped and the stored file is a plain JPEG/PNG (max side 2560 px). Evidence photos are also
rejected if tiny (<100 px) or blank, and a perceptual hash blocks re-using the same picture (even resized or
re-saved) on any issue (409). Points are only awarded after all checks pass.

## Decisions worth knowing about

* **Priority:** stored as `Critical` (per `CONTRACT.md`). The API accepts `Urgent` as input, and every issue
  response has `priority` (`Critical`) plus `priority_ui` (`Urgent`) so the frontend can use either.
* **Officials:** `roles.md` didn't say who may change status. Letting any user do it would let reporters
  resolve their own issue for +50, so I added a `role` column (`citizen` / `official` / `admin`).
  To promote someone: `UPDATE users SET role='official' WHERE email='...';`
* **Passwords:** hashed with the `bcrypt` package directly. `passlib` breaks with current bcrypt versions.
* **`POST /rewards/claim`** exists because quizzes are scored in the browser. The server cannot check the quiz,
  so it limits the points per type, allows one claim per quiz id, and applies the daily cap. A determined user
  can still invent quiz ids up to the 60-point cap; a server-side quiz catalogue would close that.
* **AI proxy is open by default** (the frontend has no login wired up yet). Set `AI_PROXY_REQUIRE_AUTH=true` once it does.
* Set a real `SECRET_KEY` in `.env` before deploying anywhere public.
