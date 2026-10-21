"""PrajaPulse Core API - run with:
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import INSECURE_DEFAULT_SECRET, settings
from app.core.database import create_all_tables
from app.routers import academy, analytics, auth, campaigns, impact, issues, contests, notifications, proxy_ai, quizzes, rewards, uploads, users, vacancies, votes

logger = logging.getLogger("prajapulse")

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_all_tables()
    if settings.SECRET_KEY == INSECURE_DEFAULT_SECRET:
        logger.warning("SECRET_KEY is the default value - set a random one in .env before deploying.")
    yield


app = FastAPI(
    title="PrajaPulse Core API",
    version="2.0.0",
    description="Auth, civic issues, voting, rewards and the AI proxy for PrajaPulse (JanSevak).",
    lifespan=lifespan,
)

# Auth is a Bearer header (not cookies), so a wildcard origin is safe and credentials stay off.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")
for module in (auth, users, issues, votes, impact, campaigns, vacancies, academy, rewards, quizzes, contests, notifications, uploads, analytics, proxy_ai):
    api.include_router(module.router)
app.include_router(api)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": "prajapulse-core", "port": 8000}


@app.get("/api/health", tags=["Health"])
def api_health():
    return {"status": "ok", "service": "prajapulse-core", "version": app.version}
