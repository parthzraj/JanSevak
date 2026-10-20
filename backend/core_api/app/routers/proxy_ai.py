"""Thin proxy from the frontend (via this Core API) to Developer 1's AI service on port 8001.

Request/response shapes are defined in backend/CONTRACT.md. We validate the request,
forward it, and pass the AI service's JSON back unchanged. Failure mapping:
  * AI service down / timing out  -> 503 {"detail": "AI inference engine is currently unreachable..."}
  * AI service answered non-JSON  -> 502
  * AI service answered 4xx/5xx   -> same status + its "detail" (500+ becomes 502)

The two legacy un-prefixed paths (/api/chatbot, /api/complaint/generate) exist because the
current frontend (src/lib/api.ts) calls them directly on port 8000.
"""
import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.core.security import get_current_user, get_optional_user
from app.models.user import User
from app.schemas.ai import (
    ChatbotRequest,
    ComplaintGenerateRequest,
    FeedPrioritizeRequest,
    HazardAlertRequest,
    ProblemDescriptionRequest,
    SuggestiveRemarksRequest,
)

UNAVAILABLE = "AI inference engine is currently unreachable. Please try again later."
MAX_IMAGE_BYTES = 10 * 1024 * 1024


def _auth_dependency(user: User | None = Depends(get_optional_user)) -> None:
    if settings.AI_PROXY_REQUIRE_AUTH and user is None:
        raise HTTPException(status_code=401, detail="Login required to use AI features")


router = APIRouter(tags=["AI Proxy"], dependencies=[Depends(_auth_dependency)])


async def _forward(path: str, *, json: dict | None = None, data: dict | None = None, files: dict | None = None):
    url = f"{settings.AI_SERVICE_URL.rstrip('/')}{path}"
    timeout = httpx.Timeout(settings.AI_TIMEOUT_SECONDS, connect=5.0)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, json=json, data=data, files=files)
    except httpx.RequestError:  # connection refused, DNS, timeout, reset ...
        raise HTTPException(status_code=503, detail=UNAVAILABLE)

    try:
        body = resp.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="AI service returned an invalid response")

    if resp.status_code >= 400:
        detail = body.get("detail") if isinstance(body, dict) else None
        if resp.status_code == 503:
            raise HTTPException(status_code=503, detail=detail or UNAVAILABLE)
        status_code = resp.status_code if resp.status_code < 500 else 502
        raise HTTPException(status_code=status_code, detail=detail or "AI service request failed")
    return body


# ---- JSON endpoints ----------------------------------------------------------------------
@router.post("/ai/chatbot")
@router.post("/chatbot", include_in_schema=False)  # legacy path used by the current frontend
async def chatbot(body: ChatbotRequest):
    return await _forward("/api/chatbot", json=body.model_dump())


@router.post("/ai/complaint/generate")
@router.post("/complaint/generate", include_in_schema=False)  # legacy path used by the current frontend
async def complaint_generate(body: ComplaintGenerateRequest):
    return await _forward("/api/complaint/generate", json=body.model_dump())


@router.post("/ai/problem-description")
async def problem_description(body: ProblemDescriptionRequest):
    return await _forward("/api/problem-description", json=body.model_dump())


@router.post("/ai/hazard-alerts")
async def hazard_alerts(body: HazardAlertRequest):
    return await _forward("/api/hazard-alerts", json=body.model_dump())


@router.post("/ai/suggestive-remarks")
async def suggestive_remarks(body: SuggestiveRemarksRequest):
    return await _forward("/api/suggestive-remarks", json=body.model_dump())


@router.post("/ai/feed/prioritize")
async def feed_prioritize(body: FeedPrioritizeRequest):
    return await _forward("/api/feed/prioritize", json=body.model_dump())


# ---- multipart (vision) endpoints ---------------------------------------------------------
async def _read_image(image: UploadFile) -> tuple[str, bytes, str]:
    content = await image.read(MAX_IMAGE_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Image file is empty")
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image is larger than 10 MB")
    return image.filename or "upload.jpg", content, image.content_type or "application/octet-stream"


@router.post("/ai/complaint/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    return await _forward("/api/complaint/analyze-image", files={"image": await _read_image(image)})


@router.post("/ai/complaint/prepare-with-image")
async def prepare_with_image(
    image: UploadFile = File(...), issue: str = Form(...), location: str = Form(...)
):
    return await _forward(
        "/api/complaint/prepare-with-image",
        data={"issue": issue, "location": location},
        files={"image": await _read_image(image)},
    )


@router.get("/ai/health")
async def ai_health():
    """Is Developer 1's service reachable? Handy while both of you are developing."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            resp = await client.get(f"{settings.AI_SERVICE_URL.rstrip('/')}/")
        return {"reachable": True, "status_code": resp.status_code, "url": settings.AI_SERVICE_URL}
    except httpx.RequestError:
        return {"reachable": False, "url": settings.AI_SERVICE_URL}
