# JanSevak AI backend

FastAPI backend for JanSevak's AI features. The service exposes the chatbot,
complaint drafting, problem-description, hazard-alert, prioritization, and
image-analysis endpoints from `app/main.py`.

## Local setup

From the repository root:

```powershell
cd "AI CHATBOX"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The AI modules call Ollama at `http://localhost:11434` using
`llama3.2:3b`. Install Ollama and run `ollama pull llama3.2:3b` before using
AI endpoints.

The frontend calls this backend through `VITE_API_URL` (default:
`http://localhost:8000`). Start the frontend separately:

```powershell
cd frontend
npm install
npm run dev
```

Check `http://localhost:8000/health` to verify the backend is running.
