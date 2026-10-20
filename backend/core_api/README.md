# Developer 2 Workspace: Core Backend API (`backend/core_api/`)

> **Assigned to:** Developer 2 (Core Backend, Database & Business Logic Engineer)  
> **Server Port:** `http://localhost:8000`  
> **Your Deliverable:** Central REST API serving authentication, complaints CRUD, voting, comments, and rewards.

---

## 🛑 STRICT RULES (What NOT to Touch)

1. ❌ **DO NOT TOUCH `frontend/`**: The frontend repository is locked. Do not edit, delete, or rename any frontend files.
2. ❌ **DO NOT TOUCH `backend/ai_service/`**: This is Developer 1's workspace (running on Port 8001 with Ollama models).
3. ❌ **DO NOT MODIFY `backend/CONTRACT.md`**: This is the immutable API contract between your Core API (8000) and Developer 1's AI Service (8001). Any changes must be mutually agreed upon.

---

## 🎯 What You Must Build (Step-by-Step)

You have been provided with starter boilerplate in `backend/core_api/app/`. Your job is to implement the business logic and database persistence for the following modules:

### Task 1: Authentication & User Accounts (`app/routers/auth.py` & `app/models/user.py`)
- `POST /api/auth/register`: Accept name, email, password, ward. Hash the password with bcrypt, save user in database, and return a JWT access token.
- `POST /api/auth/login`: Verify email + password, return JWT access token.
- `GET /api/auth/me`: Protected route (requires `Bearer <token>`). Return the current user's profile, karma points, and tier.
- `PATCH /api/auth/me`: Update editable profile fields (name, ward, avatar).

### Task 2: Civic Issues CRUD (`app/routers/issues.py` & `app/models/issue.py`)
- `GET /api/issues`: Return paginated list of civic grievances. Support query filters:
  - `category` (Roads, Water, Sanitation, Streetlights, Public Safety, Parks)
  - `status` (Reported, Under Review, In Progress, Resolved)
  - `priority` (Low, Medium, High, Urgent / Critical)
  - `sort` (recent, votes)
  - Include a boolean `has_upvoted` flag indicating if the requesting user voted on each issue.
- `POST /api/issues`: Protected route. Accept issue title, description, category, priority, address, lat/lng, and image URLs.
  - Save to database.
  - Automatically credit **+20 reward points** to the reporting citizen using the rewards engine.
- `GET /api/issues/{id}`: Return complete details of a specific issue, including timeline and comments.
- `PATCH /api/issues/{id}/status`: Transition issue status (`Reported` -> `Under Review` -> `In Progress` -> `Resolved`).
  - When marked `Resolved`, credit **+50 reward points** to the original reporter.

### Task 3: Upvoting & Comments (`app/routers/votes.py`)
- `POST /api/issues/{id}/upvote`: Protected route.
  - Enforce **strictly 1 vote per user per issue** (use database UniqueConstraint).
  - Increment issue upvotes counter.
  - Credit **+5 reward points** to the voter.
- `DELETE /api/issues/{id}/upvote`: Remove upvote and deduct the 5 points.
- `POST /api/issues/{id}/comments`: Add a discussion comment to the issue.
- `GET /api/issues/{id}/comments`: Return list of comments for an issue.

### Task 4: Rewards & Anti-Abuse Engine (`app/services/points_engine.py` & `app/routers/rewards.py`)
Implement the gamification rules specified in the project documentation:
- **Daily Cap:** Max **60 points** per user per day. Any points earned beyond 60 in a calendar day are clipped to 0.
- **Duplicate Prevention:** Record every point transaction with `(user_id, action_type, action_id)`. If the same action ID is submitted twice, reject duplicate points (fixes infinite points farming).
- **No Self-Verification:** Users cannot vote on or verify their own reports for points.
- **Tier Progression:**
  - Bronze: 0–99 pts
  - Silver: 100–299 pts
  - Gold: 300–749 pts
  - Platinum: 750–1,999 pts
  - Legend: 2,000+ pts
- Endpoints:
  - `GET /api/rewards/wallet`: Current balance, tier, progress to next tier, points earned today, recent transactions.
  - `GET /api/rewards/history`: Transaction ledger.
  - `GET /api/rewards/leaderboard`: Top 20 ranking citizens.

### Task 5: AI Proxy Endpoints (`app/routers/proxy_ai.py`)
When the frontend requests AI features, your server proxies the request to Developer 1's AI Service on Port 8001:
- `POST /api/ai/chatbot` -> forwards to `http://localhost:8001/api/chatbot`
- `POST /api/ai/complaint/generate` -> forwards to `http://localhost:8001/api/complaint/generate`
- `POST /api/ai/hazard-alerts` -> forwards to `http://localhost:8001/api/hazard-alerts`
- `POST /api/ai/suggestive-remarks` -> forwards to `http://localhost:8001/api/suggestive-remarks`
*(Check `backend/CONTRACT.md` for exact JSON payloads and response structures).*

---

## 🚀 How to Run Your Service

### 1. Setup Virtual Environment
```bash
cd backend/core_api
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default SQLite database (`prajapulse.db`) is configured out of the box.

### 3. Start the Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API documentation:
👉 **`http://localhost:8000/docs`**

### 4. Optional: Seed Demo Accounts
```bash
python seed_data.py
```
Creates 3 test citizens:
- `ayush@example.com` / `demo123` (Gold tier, 340 pts)
- `priya@example.com` / `demo123` (Silver tier, 180 pts)
- `rahul@example.com` / `demo123` (Bronze tier, 40 pts)
along with 5 realistic civic complaints.
