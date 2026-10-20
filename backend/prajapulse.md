# PrajaPulse (JanSevak) — Platform Blueprint & Specification

> **Fix Your City Together — A Civic Transformation Platform**  
> **Document Version:** 2.0 (Full 22-Feature Specification)  
> **Audience:** Developers, Architects, Contributors

---

## 1. Platform Overview
PrajaPulse is a civic-engagement ecosystem connecting citizens, communities, NGOs, and municipal authorities to collaboratively identify, prioritize, resolve, and prevent local infrastructure and public health issues (waste, water, pollution, road damage, and broken streetlights).

### Key Architectural Principle: 100% Free & Open-Source
- **Zero Cost:** The platform operates entirely on open-source, local technologies.
- **No Paid APIs:** LLM intelligence is powered by local Ollama models (`llama3.2:3b` and `llava`).
- **Zero-Config Database:** SQLite (`prajapulse.db`) for immediate development; scalable to MySQL/PostgreSQL in production.

---

## 2. Multi-Tier System Topology

```
┌────────────────────────────────────────────────────────┐
│               Frontend: React 19 + Vite                │
│       Mobile-First SPA on http://localhost:3000       │
└───────────────────────────┬────────────────────────────┘
                            │ REST calls
                            ▼
┌────────────────────────────────────────────────────────┐
│          Developer 2: Core Backend API                 │
│         FastAPI on http://localhost:8000               │
│                                                        │
│  - Authentication (JWT + Bcrypt)                       │
│  - SQLite Database (prajapulse.db)                     │
│  - Issues / Grievances CRUD & Filters                  │
│  - Democratic Voting & Citizen Comments                │
│  - Rewards & Gamification Engine (60 pts/day cap)      │
│  - AI Proxy Router (/api/ai/*)                         │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON / Vision
                            ▼
┌────────────────────────────────────────────────────────┐
│          Developer 1: AI & Vision Service              │
│         FastAPI on http://localhost:8001               │
│                                                        │
│  - Local Ollama LLM (llama3.2:3b)                      │
│  - Local Vision Model (llava)                          │
│  - Complaint Letter Generation                         │
│  - Hazard Risk Classification                          │
│  - Feed Prioritization                                 │
│  - Suggestive Remarks (Citizen vs Government)          │
│  - Multi-Turn Civic Chatbot                            │
└────────────────────────────────────────────────────────┘
```

---

## 3. The 22 Core PrajaPulse Features

### Group A: Core Reporting & Democratic Engagement (1–12)
1. **Locality Problem Feed:** Location-aware, filterable feed (Roads, Water, Sanitation, Streetlights, Safety, Parks) with sorting by recency and votes.
2. **Community Upvoting & Resident Confirmation:** Democratic verification where residents upvote issues. Strict 1 vote per citizen constraint.
3. **NGO Directory & Collaboration:** Verified partner directory where citizens request support and join volunteer campaigns.
4. **Rewards & Gamification:** Karma points awarded for verified civic actions (report +20, upvote +5, resolve +50). Daily 60-point cap.
5. **Contextual AI Chatbot:** Context-aware civic chatbot answering queries and providing guidance on municipal procedures.
6. **AI Photo Analysis:** Vision model (LLaVA) analyzes uploaded photos to detect problem type, size, severity, and visual evidence.
7. **Success Stories:** Fullscreen reels showcasing before/after transformations of permanently resolved issues.
8. **Root Cause Identification:** Links individual complaints to systemic infrastructure faults (e.g. repeated pothole linked to leaking underground water pipe).
9. **Dual Action Path (Citizen vs Government):** Clear classification of "What We Have to Do" (community cleanups) vs "What Government Has to Do" (municipal engineering repairs).
10. **Future Problem Predictions:** Pattern-based forecasting for recurring seasonal issues (e.g. monsoon drain clogging).
11. **Impact Predictions:** Estimates people benefited and cost saved before initiating community action.
12. **Daily Briefing & Notifications:** Morning city briefing card highlighting priority issues, trending problems, and resolved milestones.

### Group B: Intelligence & Prevention (13–18)
13. **Solution Database:** Searchable archive of resolved case studies and repeatable action templates.
14. **Problem Interconnection Mapping:** Graph engine identifying primary root causes that trigger multiple symptoms.
15. **Predictive Pre-Crisis Alerts:** Proactive warnings for monsoon flood risks, pipeline bursts, and vector-borne disease outbreaks.
16. **Impact Visualization:** Ward cleanliness velocity graphs, resolution times, and community scorecards.
17. **Leaderboards & Challenges:** Public rankings across wards and categories (Swachh Warriors, Water Protectors).
18. **Hotspot Clustering:** Spatial and temporal grouping of issues revealing recurring dumping spots or dark corridors.

### Group C: Accountability & Inclusion (19–22)
19. **Citizen Education Engine:** Gamified civic quizzes and interactive literacy modules with badge certifications.
20. **Government Accountability Dashboard:** Public tracking of municipal response times and resolution SLAs.
21. **Multilingual & Accessibility:** Multi-language interface, offline storage resilience, and clean screen-reader layout.
22. **Government Integrations:** REST API hooks for bi-directional municipal grievance synchronization.

---

## 4. Rewards System Specification (Crucial for Developer 2)

### A. Points Allocation Table
| Civic Activity | Verified Action / Evidence | Points Awarded |
|---|---|:---:|
| **Report a civic problem** | Verified report submitted with description & location | **+20 pts** |
| **Add clear photograph** | Photo evidence attached | **+10 pts** |
| **Accurate location tag** | Precise GPS or landmark tagged | **+5 pts** |
| **Upvote neighbor's report** | Site verification upvote (max 1 vote per issue) | **+5 pts** |
| **Organize cleanup drive** | Verified community cleanup event conducted | **+40 pts** |
| **Mobilize 5+ volunteers** | Attendance confirmed | **+15 pts** |
| **Complete documentation** | Before/after photos submitted | **+10 pts** |
| **Attend verified cleanup** | Verified volunteer attendance | **+20 pts** |
| **Confirm resolution** | Verify issue resolved after 30 days | **+25 pts** |
| **Civic Knowledge Quiz** | Pass quiz module (first attempt only) | **+10 to +25 pts** |
| **Academy Module** | Complete civic literacy lesson | **+15 to +60 pts** |

### B. Anti-Abuse Rules & Fairness Controls
1. **Daily Points Cap:** Strictly max **60 points** per user per calendar day. Any action that would push daily earnings over 60 is capped.
2. **Duplicate Prevention:** Every reward transaction stores `(user_id, action_type, action_id)`. Re-submitting the same action or re-taking a completed quiz earns **0 points**.
3. **No Self-Verification:** A citizen cannot upvote or verify their own reported issues for points.
4. **Launch Rule (Zero Cash Liability):** Points represent **Karma & Recognition** (Tiers, Badges, Digital Certificates). There is **no monetary or cash payout liability** at launch.

### C. Tier Milestones
- **Bronze:** 0 – 99 pts (Basic profile badge)
- **Silver:** 100 – 299 pts (Community volunteer badge)
- **Gold:** 300 – 749 pts (Ward champion status)
- **Platinum:** 750 – 1,999 pts (Civic recognition candidate)
- **Legend:** 2,000+ pts (Civic Hall of Fame & Honor Roll)

---

## 5. Database Schema Summary (from `sources and data/*.sql`)

The repository contains full MySQL schema dumps representing the complete 50-table production data model:
1. `prajapulse_citizen_dataset_1000.sql` (18 tables): `citizen_profiles`, `issue_interactions`, `issue_votes`, `issue_evidence`, `ai_predictions`, `suggested_actions`, `root_cause_analysis`, `impact_forecasts`, `citizen_notifications`, `positive_stories`, `cleanup_events`, etc.
2. `prajapulse_ngo_dataset_1000.sql` (32 tables): `organizations`, `campaigns`, `volunteer_registrations`, `attendance_records`, `evidence_records`, `verification_reviews`, etc.

For the MVP, Developer 2 builds the core tables (`users`, `civic_issues`, `issue_votes`, `issue_comments`, `reward_transactions`, `notifications`) inside SQLite using SQLAlchemy ORM.

---

## 6. Shared Interface Contract
For all endpoint payloads and response contracts between Developer 2's Core API and Developer 1's AI Service, refer to **`backend/CONTRACT.md`**.
