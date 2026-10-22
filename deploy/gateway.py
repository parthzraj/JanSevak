"""One public door for the whole backend.

The app talks to two servers: the Core API (port 8000) and the AI service (port 8001). A free tunnel gives us
ONE public address, so this tiny gateway listens on one port (9000) and forwards each request to the right server
by its path. Nothing in either backend is changed.

Run (from backend/core_api, using its venv):  python ../../deploy/gateway.py
Settings (environment variables, all optional): CORE_URL, AI_URL, AI_FALLBACK_URL, GATEWAY_PORT

AI_URL is the real AI (for example the GPU laptop's tunnel address). If it cannot be reached, the request is retried
on AI_FALLBACK_URL (the no-GPU AI Lite), so the app keeps answering while the laptop is off.
"""
import os

import httpx
import uvicorn
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import Response
from starlette.routing import Route

CORE_URL = os.getenv("CORE_URL", "http://127.0.0.1:8000").rstrip("/")
AI_URL = os.getenv("AI_URL", "http://127.0.0.1:8001").rstrip("/")
AI_FALLBACK_URL = os.getenv("AI_FALLBACK_URL", "").rstrip("/")
PORT = int(os.getenv("GATEWAY_PORT", "9000"))

# Paths the frontend sends straight to the AI service. Everything else belongs to the Core API.
AI_PATHS = (
    "/api/chatbot", "/api/complaint", "/api/problem-description", "/api/hazard-alerts", "/api/feed",
    "/api/suggestive-remarks", "/api/photo", "/api/predictive",
)
HOP_BY_HOP = {"connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers",
              "transfer-encoding", "upgrade", "host", "content-length", "accept-encoding", "content-encoding"}

client = httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0), follow_redirects=False)


def is_ai(path: str) -> bool:
    return path.startswith(AI_PATHS)


async def send(method: str, base: str, request: Request, headers: dict, body: bytes, timeout=None):
    url = base + request.url.path + ("?" + request.url.query if request.url.query else "")
    kwargs = {"timeout": timeout} if timeout else {}
    return await client.request(method, url, content=body, headers=headers, **kwargs)


async def forward(request: Request) -> Response:
    path = request.url.path
    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP_BY_HOP}
    body = await request.body()
    upstream = None
    try:
        if is_ai(path):
            try:
                # real AI first; a dead tunnel answers 5xx or does not connect at all
                upstream = await send(request.method, AI_URL, request, headers, body, httpx.Timeout(180.0, connect=6.0))
                if upstream.status_code in (502, 503, 504, 520, 521, 522, 523, 524, 530) and AI_FALLBACK_URL:
                    upstream = None
            except httpx.HTTPError:
                if not AI_FALLBACK_URL:
                    raise
            if upstream is None:
                upstream = await send(request.method, AI_FALLBACK_URL, request, headers, body)
        else:
            upstream = await send(request.method, CORE_URL, request, headers, body)
    except httpx.HTTPError:
        return Response('{"detail":"The server behind this address is not reachable right now."}', status_code=502,
                        media_type="application/json", headers={"Access-Control-Allow-Origin": "*"})
    out = {k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP}
    return Response(upstream.content, status_code=upstream.status_code, headers=out)


async def health(request: Request) -> Response:
    return Response('{"status":"ok","service":"jansevak-gateway"}', media_type="application/json")


app = Starlette(routes=[
    Route("/gateway/health", health),
    Route("/{path:path}", forward, methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]),
])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")
