import json
import logging
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.schemas import (
    ChatRequest, ChatResponse,
    ComplaintRequest, ComplaintResponse,
    ProblemDescriptionRequest, ProblemDescriptionResponse,
    HazardRequest, HazardResponse,
    FeedPrioritizationRequest, FeedPrioritizationResponse,
    SuggestiveRemarksRequest, SuggestiveRemarksResponse,
    ImageAnalysisResponse, PrepareWithImageResponse,
    PhotoVerifyResponse, PredictiveAlertsListResponse,
    StreetRiskRequest, StreetRiskResponse,
)
from app.modules.chatbot import chat_with_prajapulse
from app.modules.complaint_generator import generate_complaint
from app.modules.problem_description import process_problem_description
from app.modules.hazard_detector import detect_hazard
from app.modules.feed_prioritizer import prioritize_complaints
from app.modules.suggestive_remarks import generate_suggestive_remarks
from app.modules.image_analyzer import analyze_civic_image, prepare_complaint_with_image
from app.modules.photo_verifier import verify_photo
from app.modules.predictive_engine import get_predictive_alerts, check_street_risk

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prajapulse-ai")

app = FastAPI(
    title="PrajaPulse AI Service",
    description="Stateless Ollama LLM and Vision Service for Civic Action",
    version="2.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS if "*" not in config.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def warmup_models():
    """Pre-load models into GPU memory on server start for faster first requests."""
    if not config.MODEL_WARMUP_ON_STARTUP:
        logger.info("Model warmup disabled via config.")
        return
    try:
        logger.info("Warming up text model (%s)...", config.TEXT_MODEL)
        from app.modules.ollama_client import call_ollama_text
        call_ollama_text("Hi", timeout=60)
        logger.info("Text model warmed up successfully.")
    except Exception as e:
        logger.warning("Text model warmup failed (non-fatal): %s", e)
    try:
        logger.info("Warming up vision model (%s)...", config.VISION_MODEL)
        import base64
        from PIL import Image as PILImage
        import io as sio
        tiny = PILImage.new("RGB", (8, 8), color=(128, 128, 128))
        buf = sio.BytesIO()
        tiny.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode()
        from app.modules.ollama_client import call_ollama_vision
        call_ollama_vision("Describe.", b64, timeout=120)
        logger.info("Vision model warmed up successfully.")
    except Exception as e:
        logger.warning("Vision model warmup failed (non-fatal): %s", e)


@app.get("/")
def health_check():
    """Service status and configured models."""
    return {
        "status": "ok",
        "service": "prajapulse-ai",
        "port": 8001,
        "ollama_url": config.OLLAMA_URL,
        "text_model": config.TEXT_MODEL,
        "vision_model": config.VISION_MODEL,
    }


@app.post("/api/chatbot", response_model=ChatResponse)
def chatbot_endpoint(req: ChatRequest):
    """Contextual multi-turn civic chatbot."""
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in req.history]
        reply = chat_with_prajapulse(req.message, history=history_dicts)
        return ChatResponse(reply=reply)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in chatbot")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.post("/api/complaint/generate", response_model=ComplaintResponse)
def complaint_generate_endpoint(req: ComplaintRequest):
    """Generate formal grievance letter for civic authorities."""
    try:
        complaint = generate_complaint(req.issue, req.location, req.additional_details)
        return ComplaintResponse(complaint=complaint)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in complaint generation")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/problem-description", response_model=ProblemDescriptionResponse)
def problem_description_endpoint(req: ProblemDescriptionRequest):
    """Rewrite rough citizen notes into clear grammatical grievance."""
    try:
        improved = process_problem_description(req.description)
        return ProblemDescriptionResponse(improved_description=improved)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in problem description")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/hazard-alerts", response_model=HazardResponse)
def hazard_alerts_endpoint(req: HazardRequest):
    """Triage civic hazards into category, severity, rationale, and action."""
    try:
        result = detect_hazard(req.issue, req.location)
        return HazardResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in hazard alerts")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feed/prioritize", response_model=FeedPrioritizationResponse)
def feed_prioritize_endpoint(req: FeedPrioritizationRequest):
    """Rank list of complaints by life threat and public disruption priority."""
    try:
        ranked_ids = prioritize_complaints(req.complaints)
        return FeedPrioritizationResponse(ranked_ids=ranked_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in feed prioritization")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/suggestive-remarks", response_model=SuggestiveRemarksResponse)
def suggestive_remarks_endpoint(req: SuggestiveRemarksRequest):
    """Generate dual-path guidance: what citizens can do vs what government must do."""
    try:
        remarks = generate_suggestive_remarks(req.issue, req.existing_description)
        return SuggestiveRemarksResponse(**remarks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in suggestive remarks")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/complaint/analyze-image", response_model=ImageAnalysisResponse)
def analyze_image_endpoint(image: UploadFile = File(...)):
    """Vision analysis of uploaded civic photo using LLaVA. Synchronous def runs in threadpool."""
    try:
        contents = image.file.read()
        analysis = analyze_civic_image(contents)
        return ImageAnalysisResponse(**analysis)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in image analysis")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/complaint/prepare-with-image", response_model=PrepareWithImageResponse)
def prepare_with_image_endpoint(
    image: UploadFile = File(...),
    issue: str = Form(default=""),
    location: str = Form(default=""),
):
    """Multi-stage vision + complaint drafting from a single uploaded photo."""
    try:
        contents = image.file.read()
        prepared = prepare_complaint_with_image(contents, issue=issue, location=location)
        return PrepareWithImageResponse(**prepared)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in prepare with image")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/photo/verify", response_model=PhotoVerifyResponse)
def photo_verify_endpoint(image: UploadFile = File(...)):
    """Verify if an uploaded photo is a real civic issue (not selfie/meme/food)."""
    try:
        contents = image.file.read()
        result = verify_photo(contents)
        return PhotoVerifyResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in photo verification")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/predictive/alerts", response_model=PredictiveAlertsListResponse)
def predictive_alerts_endpoint(season: str = None):
    """Get AI-generated predictive civic alerts for a given season."""
    try:
        alerts = get_predictive_alerts(season)
        return PredictiveAlertsListResponse(alerts=alerts)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in predictive alerts")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predictive/check-street", response_model=StreetRiskResponse)
def street_risk_endpoint(req: StreetRiskRequest):
    """AI-powered street/area hazard risk assessment."""
    try:
        result = check_street_risk(req.street)
        return StreetRiskResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception("Error in street risk check")
        raise HTTPException(status_code=500, detail=str(e))

