> Using Render for the app? Read `deploy/RENDER.md` first. This file covers the laptop-only setup (tunnel + Vercel)
> and the shared laptop prerequisites that `RENDER.md` refers to (AI service environment, Ollama models, tunnel tool).

# Deploying JanSevak for the hackathon

Plan: the **frontend lives on Vercel** (a permanent link people open on their phones). The **backend (Core API + AI)
runs on the GPU laptop** and is reached through **one tunnel**. A small gateway (`deploy/gateway.py`) puts the Core API
and the AI service behind that one address. No backend or frontend logic is changed.

```
phone -> https://jansevak.vercel.app  (Vercel, always on)
              |
              v
        https://<tunnel address>      (the laptop must be on)
              |
        gateway :9000 --> Core API :8000 (login, reports, rewards ...)
                      \-> AI service :8001 (Ollama)   [or AI Lite if Ollama is off]
```

## One-time setup on the laptop (PowerShell, repo root)
1. `git pull`
2. Core API + AI service environments:
   ```
   cd backend\core_api;  py -m venv .venv;  .\.venv\Scripts\python.exe -m pip install -r requirements.txt;  cd ..\..
   cd backend\ai_service; py -m venv .venv; .\.venv\Scripts\python.exe -m pip install -r requirements.txt; cd ..\..
   ```
   Create `backend\core_api\.env` with:
   ```
   SECRET_KEY=<a long random text>
   CORS_ORIGINS=*
   ```
   Ollama: `ollama pull llama3.2:3b` and `ollama pull llava`.
3. Install a tunnel tool, pick ONE:
   - **ngrok** (free account, gives you one fixed address such as `your-name.ngrok-free.app`): install, run
     `ngrok config add-authtoken <token>`, then copy your free "static domain" from the ngrok dashboard.
   - **cloudflared** (no account): the address changes every start (see "If the address changes").

## Every time you want the demo online
```
powershell -ExecutionPolicy Bypass -File deploy\start_public.ps1 -Seed                      # cloudflared
powershell -ExecutionPolicy Bypass -File deploy\start_public.ps1 -Seed -Tunnel ngrok -Domain your-name.ngrok-free.app
```
`-Seed` loads the demo data (wipes the database); leave it out when restarting and you want to keep what is there.
The window prints the public backend address. Keep the window open.

Quick check: open `<address>/api/health` on your phone. You should see `{"status":"ok",...}`.

## Frontend on Vercel (once)
1. vercel.com -> Add New -> Project -> pick the JanSevak repo.
2. **Root Directory: `frontend`**. Framework: Vite. Build `npm run build`, output `dist`.
3. Environment Variables (no slash at the end), both set to the backend address:
   `VITE_API_URL` and `VITE_AI_API_URL`.
4. Deploy. `frontend/vercel.json` makes inner pages (like /rewards) open on refresh.

## If the address changes (cloudflared, or a new ngrok domain)
Edit the two variables in Vercel (Settings -> Environment Variables) and **Redeploy**. They are baked in at build time.
This is why a fixed ngrok domain is better for a hackathon link.

## Things to know
- The laptop must be on, awake, plugged in and online while judges look. Turn off sleep.
- ngrok's free plan can show a one-time "visit site" warning page. If the app shows network errors on ngrok, switch to
  cloudflared or ask me for a fix.
- Camera and location need https. Vercel and both tunnels give you that.
- Demo logins: `ayush@example.com` / `demo123` (all demo accounts use `demo123`).
- Before judging, run one AI request yourself so Ollama has loaded the model.
