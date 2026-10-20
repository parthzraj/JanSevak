# PrajaPulse AI Service (`backend/ai_service/`)

> **Owner:** Developer 1 (GPU Laptop / AI Specialist)  
> **Runs on:** `http://localhost:8001`  
> **Ollama requirement:** `llama3.2:3b` and `llava`

---

## 🚀 Quick Setup (Step-by-Step)

### Step 1: Install Ollama & Pull Models
1. Download Ollama from [ollama.ai](https://ollama.ai) (Windows/Mac/Linux).
2. Open a terminal and download the two required models:
   ```bash
   ollama pull llama3.2:3b
   ollama pull llava
   ```
3. Verify Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Step 2: Set up Python Environment
In the `backend/ai_service/` directory:
```bash
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### Step 3: Run the Service
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
The API documentation (Swagger UI) is immediately available at:
👉 **`http://localhost:8001/docs`**

### Step 4: Run the Verification Script
Open a second terminal window (with the venv activated) and run:
```bash
python test_ai_manual.py
```
This script exercises all 9 endpoints with realistic civic data and reports PASS/FAIL status.

---

## 🌐 Connecting With Your Teammate (Developer 2)

Your teammate's Core API runs on Port 8000 and needs to reach your service on Port 8001.

### Option A: Both on the Same Wi-Fi (LAN)
1. Find your IP address on Windows (`ipconfig` -> IPv4 Address, e.g. `192.168.1.45`).
2. Run your server bound to all interfaces:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```
3. Tell your teammate your URL: `http://192.168.1.45:8001`. They set `AI_SERVICE_URL=http://192.168.1.45:8001` in their `.env`.

### Option B: Cloudflare Tunnel or ngrok (Free & Instant)
```bash
# Using ngrok:
ngrok http 8001
# Using Cloudflare:
cloudflared tunnel --url http://localhost:8001
```
Share the generated `https://xyz.trycloudflare.com` URL with your teammate!

---

## 📋 The 9 Endpoints Reference Table

| Method | Path | Description | Model |
|---|---|---|---|
| `GET` | `/` | Health check & configured models | None |
| `POST` | `/api/chatbot` | Multi-turn contextual civic assistant | `llama3.2:3b` |
| `POST` | `/api/complaint/generate` | Generates formal grievance letter | `llama3.2:3b` |
| `POST` | `/api/problem-description` | Rewrites rough citizen input into clear text | `llama3.2:3b` |
| `POST` | `/api/hazard-alerts` | Triages hazard category, severity & next steps | `llama3.2:3b` (JSON) |
| `POST` | `/api/feed/prioritize` | Ranks complaints list by life safety urgency | `llama3.2:3b` (JSON) |
| `POST` | `/api/suggestive-remarks` | Dual-path advice: citizen actions vs municipal steps | `llama3.2:3b` (JSON) |
| `POST` | `/api/complaint/analyze-image` | Multi-modal vision analysis of uploaded photo | `llava` |
| `POST` | `/api/complaint/prepare-with-image` | Single photo upload -> full title & description | `llava` + `llama3.2:3b` |

---

## 🛠️ Key Improvements Over Original Prototype

1. **Fixed Fatal `NameError`:** Added missing `import json` to prevent crashes when JSON parsing fails.
2. **Fixed Event-Loop Blocking:** Changed all endpoints from `async def` with blocking sync calls to regular `def`, allowing FastAPI to execute inference in its background threadpool.
3. **JSON Retries:** Added automatic retry with stricter prompts in `ollama_client.py` when small 3B models output malformed JSON.
4. **Image Resizing:** Uses Pillow to scale camera photos down to 1024px before base64 encoding, dropping vision analysis latency from ~90s to ~8s.
5. **Feed Prioritizer Bug Fix:** Normalized all IDs to strings before comparing sets so numeric IDs from LLM don't falsely trigger validation errors.
6. **CORS Middleware:** Added proper CORS headers so browsers do not block frontend or cross-origin requests.
