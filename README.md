# JanSevak

**AI-powered civic engagement for reporting, prioritizing, and resolving local issues.**

JanSevak connects citizens, NGOs, and government authorities in one civic platform. Citizens
can report local problems, add evidence, support community reports, follow resolution progress,
and participate in community initiatives. AI services help turn reports into useful civic
intelligence without replacing official review or community accountability.

## Highlights

- **Civic issue reporting** with photos, location details, status tracking, and resolution history.
- **AI-assisted reporting** for complaint generation, problem descriptions, image analysis,
  hazard alerts, and suggestive remarks.
- **AI-prioritized feed and daily briefing** with the top three urgent civic issues from the
  active feed plus briefing updates and impact information returned by the AI/data flow.
- **Per-user 7:00 AM briefing lifecycle**: the briefing becomes available after 7:00 AM local
  time every day. Acknowledgment is stored independently for each signed-in user and calendar
  day, so one citizen's acknowledgment never dismisses another citizen's briefing.
- **Community participation** through upvotes, comments, evidence, maps, and issue sharing.
- **Rewards and gamification** with points, badges, quizzes, learning modules, and certificates.
- **NGO and volunteer collaboration** for drives, initiatives, and community action.
- **Predictive civic alerts** for recurring hazards and prevention planning.
- **Official accountability** through issue status updates, response timelines, and analytics.

## Architecture

| Service | Location | Default port | Responsibility |
| --- | --- | ---: | --- |
| Frontend | `frontend/` | `3000` | React, TypeScript, Vite, Tailwind CSS, and the citizen experience |
| Core API | `backend/core_api/` | `8000` | Authentication, users, civic issues, votes, comments, rewards, notifications, uploads, and AI proxy |
| AI service | `backend/ai_service/` | `8001` | Ollama-backed civic chatbot, report assistance, image analysis, hazard analysis, and feed prioritization |
| Lite AI service | `backend/lite/` | `8001` | Zero-GPU fallback used when Ollama is unavailable |

The Core API stores application data in SQLite. The frontend calls the Core API, and the Core
API proxies AI requests to the AI service.

## Quick start on Windows

### Prerequisites

- Node.js and npm
- Python 3.10 or newer
- PowerShell
- Ollama is optional. Install it and pull the configured models to use the full local AI service;
  otherwise the launcher starts the lite fallback.

### One-click startup

From the repository root:

```powershell
.\run.bat
```

The launcher starts:

- Frontend: <http://localhost:3000>
- Core API: <http://localhost:8000>
- AI service or lite fallback: <http://localhost:8001>

It also opens the frontend in the browser. Press **Enter** in the launcher window to stop the
services.

### Manual frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Useful frontend commands:

```powershell
npm run lint
npm run build
```

### Manual Core API setup

```powershell
cd backend\core_api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed_data.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Core API documentation is available at <http://localhost:8000/docs>.

### Full AI service setup (optional)

Install Ollama and pull the configured models:

```powershell
ollama pull llama3.2:3b
ollama pull llava
```

Then run the AI service:

```powershell
cd backend\ai_service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

The AI service documentation is available at <http://localhost:8001/docs>. See
[backend/ai_service/README.md](./backend/ai_service/README.md) for model and endpoint details.

## Demo accounts

After running `python seed_data.py` in `backend/core_api/`, use password `demo123`:

| Email | Account |
| --- | --- |
| `ayush@example.com` | Citizen |
| `priya@example.com` | Citizen |
| `rahul@example.com` | Citizen |
| `official@example.com` | Municipal official |

Each account has its own briefing acknowledgment state. To verify this behavior, acknowledge
the briefing with one account, log out, and sign in with another account on the same browser.
The second account will still receive its own daily briefing.

## Testing

Frontend type-check and production build:

```powershell
cd frontend
npm run lint
npm run build
```

Core API tests:

```powershell
cd backend\core_api
python -m pytest -q
```

## Project documentation

- [Frontend documentation](./frontend/README.md)
- [Core API documentation](./backend/core_api/README.md)
- [AI service documentation](./backend/ai_service/README.md)
- [API contract](./backend/CONTRACT.md)
- [Backend roles](./backend/roles.md)

## Project status

JanSevak is an active civic technology project. Core reporting, authentication, community
engagement, AI assistance, rewards, notifications, and briefing flows are implemented. Some
integrations and predictive capabilities depend on the configured data, local services, and
available AI models.

## Contributing

Contributions, suggestions, and feedback are welcome. Please keep changes focused, preserve the
existing service boundaries, and update the relevant documentation when behavior or setup changes.

## License

A license has not yet been specified. Check the repository for licensing information before
reusing or distributing the code.

---

**Jansevak - Your community. Your voice. Your impact.**
