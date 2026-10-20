# PrajaPulse AI Lite — Zero-GPU Fallback Service

A lightweight fallback that mirrors all 9 AI endpoints from `backend/ai_service` but uses **template-based responses** instead of Ollama/LLM inference.

**No GPU, no Ollama, no large models needed.** Runs on any machine with Python and FastAPI.

## When to use this

- **Developer 2** can test frontend AI integration without needing the GPU laptop online.
- **Demo-day backup** if Ollama is slow, GPU memory runs out, or the AI laptop is unavailable.
- The frontend can be configured to fall back to this service automatically.

## Setup

```bash
cd backend/lite
py -m venv .venv
.venv\Scripts\activate      # Windows
uv pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Endpoints (identical contract to ai_service)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/api/chatbot` | Template civic chatbot |
| POST | `/api/complaint/generate` | Template grievance letter |
| POST | `/api/problem-description` | Basic text cleanup |
| POST | `/api/hazard-alerts` | Keyword-based hazard triage |
| POST | `/api/feed/prioritize` | Keyword + upvote ranking |
| POST | `/api/suggestive-remarks` | Static citizen/govt actions |
| POST | `/api/complaint/analyze-image` | Placeholder image analysis |
| POST | `/api/complaint/prepare-with-image` | Placeholder vision + draft |

## Switching between Lite and Real

Set `VITE_AI_API_URL` in the frontend:
- Real AI: `VITE_AI_API_URL=http://<gpu-laptop-ip>:8001`
- Lite fallback: `VITE_AI_API_URL=http://localhost:8001` (run lite on same machine)
