#!/usr/bin/env bash
# Starts the whole backend inside ONE Render web service (so it stays within the free instance hours):
#   AI Lite (8001) + Core API (8000) are internal; the gateway listens on Render's $PORT and routes between them.
# Every start rebuilds the demo data (Render's free disk is wiped on restart anyway).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

(cd "$ROOT/backend/lite" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --log-level warning) &

cd "$ROOT/backend/core_api"
python demo_data.py --reset
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level warning &

# wait until the Core API answers before opening the public port
for i in $(seq 1 40); do
  python - <<'PY' && break || sleep 1
import urllib.request, sys
try:
    urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=2); sys.exit(0)
except Exception:
    sys.exit(1)
PY
done

# Real AI (the GPU laptop's tunnel address) if REAL_AI_URL is set; AI Lite stays as the automatic fallback.
if [ -n "${REAL_AI_URL:-}" ]; then
  export AI_URL="$REAL_AI_URL"
  export AI_FALLBACK_URL="http://127.0.0.1:8001"
fi
export GATEWAY_PORT="${PORT:-10000}"
exec python "$ROOT/deploy/gateway.py"
