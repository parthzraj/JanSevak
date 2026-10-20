"""
PrajaPulse AI Lite — Zero-GPU fallback service.

Same 9 endpoints as the real AI service (backend/ai_service on port 8001),
but returns template-based responses instead of LLM inference.

Use cases:
  - Developer 2 can test frontend integration without a GPU laptop online.
  - Demo-day backup if Ollama or GPU is unavailable.
  - Runs on any machine with Python + FastAPI, no Ollama needed.

Start:  python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
"""

import logging
import random
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prajapulse-lite")

app = FastAPI(
    title="PrajaPulse AI Lite (Fallback)",
    description="Template-based fallback for AI endpoints. No GPU required.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas (mirror ai_service exactly) ────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: List[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str

class ComplaintRequest(BaseModel):
    issue: str = Field(..., min_length=2)
    location: str = Field(..., min_length=2)
    additional_details: str = Field(default="")

class ComplaintResponse(BaseModel):
    complaint: str

class ProblemDescriptionRequest(BaseModel):
    description: str = Field(..., min_length=2)

class ProblemDescriptionResponse(BaseModel):
    improved_description: str

class HazardRequest(BaseModel):
    issue: str = Field(..., min_length=2)
    location: str = Field(..., min_length=2)

class HazardResponse(BaseModel):
    hazard_type: str
    severity: str
    reason: str
    recommended_action: str

class FeedPrioritizationRequest(BaseModel):
    complaints: List[Dict[str, Any]] = Field(..., min_length=1)

class FeedPrioritizationResponse(BaseModel):
    ranked_ids: List[str]

class SuggestiveRemarksRequest(BaseModel):
    issue: str = Field(..., min_length=2)
    existing_description: str = Field(default="")

class SuggestiveRemarksResponse(BaseModel):
    citizen_actions: List[str]
    government_actions: List[str]

class ImageAnalysisResponse(BaseModel):
    detected_issue: str
    visual_description: str
    suggested_category: str
    suggested_severity: str

class PrepareWithImageResponse(BaseModel):
    title: str
    description: str
    category: str
    severity: str

# ── Template Responses ─────────────────────────────────────────────────

CHATBOT_RESPONSES = [
    "Thank you for your question. To report a civic issue, please provide the exact location, a clear photo, and a brief description of the problem. You can file a report through the 'Create Report' section.",
    "I can help you with civic issues in your ward. Please describe the problem you're facing — whether it's a pothole, garbage, water leak, or streetlight issue — and I'll guide you on the next steps.",
    "For tracking your complaint, please check the 'My Reports' section. If you need to escalate, you can contact your ward office directly.",
]

SEVERITY_MAP = {
    "pothole": "High", "road": "High", "crater": "High",
    "wire": "Critical", "electric": "Critical", "fire": "Critical", "manhole": "Critical",
    "garbage": "Medium", "waste": "Medium", "litter": "Medium",
    "light": "Medium", "lamp": "Medium",
    "water": "High", "sewage": "High", "flood": "High",
    "park": "Low", "bench": "Low", "sign": "Low",
}

CATEGORY_MAP = {
    "pothole": "Roads", "road": "Roads", "footpath": "Roads", "crack": "Roads",
    "water": "Water", "sewage": "Water", "drain": "Water", "flood": "Water", "pipe": "Water",
    "garbage": "Sanitation", "waste": "Sanitation", "dump": "Sanitation", "trash": "Sanitation",
    "light": "Streetlights", "lamp": "Streetlights", "bulb": "Streetlights",
    "wire": "Public Safety", "electric": "Public Safety", "manhole": "Public Safety", "fire": "Public Safety",
    "park": "Parks", "tree": "Parks", "garden": "Parks", "playground": "Parks",
}

def _detect_category(text: str) -> str:
    lower = text.lower()
    for keyword, cat in CATEGORY_MAP.items():
        if keyword in lower:
            return cat
    return "Roads"

def _detect_severity(text: str) -> str:
    lower = text.lower()
    for keyword, sev in SEVERITY_MAP.items():
        if keyword in lower:
            return sev
    return "Medium"

# ── Endpoints ──────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "prajapulse-lite",
        "mode": "template-fallback",
        "port": 8001,
        "gpu_required": False,
    }


@app.post("/api/chatbot", response_model=ChatResponse)
def chatbot_endpoint(req: ChatRequest):
    reply = random.choice(CHATBOT_RESPONSES)
    return ChatResponse(reply=reply)


@app.post("/api/complaint/generate", response_model=ComplaintResponse)
def complaint_generate_endpoint(req: ComplaintRequest):
    complaint = f"""Subject: Urgent Civic Complaint — {req.issue}

Dear Sir/Madam,

I am writing to bring to your urgent attention the following civic issue affecting residents in our locality.

Reported Problem: {req.issue}
Location: {req.location}
{f"Additional Details: {req.additional_details}" if req.additional_details else ""}

This issue poses a risk to public safety and daily convenience. I request your office to kindly arrange for an immediate site inspection and initiate corrective action under the municipal citizen charter service level agreements.

I trust that the municipal corporation will take prompt action. I look forward to a timely resolution.

Sincerely,
A Concerned Citizen via PrajaPulse"""
    return ComplaintResponse(complaint=complaint)


@app.post("/api/problem-description", response_model=ProblemDescriptionResponse)
def problem_description_endpoint(req: ProblemDescriptionRequest):
    # Simple cleanup: capitalize first letter, ensure period at end
    improved = req.description.strip()
    if improved:
        improved = improved[0].upper() + improved[1:]
        if not improved.endswith("."):
            improved += "."
        improved += " This issue requires timely attention from the concerned municipal authorities."
    return ProblemDescriptionResponse(improved_description=improved)


@app.post("/api/hazard-alerts", response_model=HazardResponse)
def hazard_alerts_endpoint(req: HazardRequest):
    category = _detect_category(req.issue)
    severity = _detect_severity(req.issue)
    return HazardResponse(
        hazard_type=f"{category} Hazard",
        severity=severity,
        reason=f"Reported issue at {req.location}: {req.issue}. Assessment based on keyword analysis.",
        recommended_action=f"Deploy inspection team to {req.location} and initiate repair under ward maintenance SLA.",
    )


@app.post("/api/feed/prioritize", response_model=FeedPrioritizationResponse)
def feed_prioritize_endpoint(req: FeedPrioritizationRequest):
    # Sort by: severity keywords in title/description, then by upvotes
    def score(c: Dict[str, Any]) -> int:
        text = f"{c.get('title', '')} {c.get('description', '')}".lower()
        s = 0
        if any(w in text for w in ["manhole", "electric", "wire", "fire", "collapse"]):
            s += 100
        elif any(w in text for w in ["sewage", "flood", "water", "pothole", "accident"]):
            s += 50
        elif any(w in text for w in ["garbage", "waste", "light"]):
            s += 20
        s += int(c.get("upvotes", 0))
        return s

    sorted_complaints = sorted(req.complaints, key=score, reverse=True)
    ranked_ids = [str(c.get("id", "")) for c in sorted_complaints]
    return FeedPrioritizationResponse(ranked_ids=ranked_ids)


@app.post("/api/suggestive-remarks", response_model=SuggestiveRemarksResponse)
def suggestive_remarks_endpoint(req: SuggestiveRemarksRequest):
    return SuggestiveRemarksResponse(
        citizen_actions=[
            "Document the issue with clear photographs and GPS location",
            "Alert neighboring residents to exercise caution",
            "Place temporary warning markers if safe to do so",
            "Submit a formal report through the civic grievance portal",
        ],
        government_actions=[
            "Deploy field inspection team to assess the situation",
            "Initiate repair work under ward maintenance SLA",
            "Install temporary safety measures at the site",
            "Provide formal resolution update on the public portal",
        ],
    )


@app.post("/api/complaint/analyze-image", response_model=ImageAnalysisResponse)
def analyze_image_endpoint(image: UploadFile = File(...)):
    # Read file to validate it exists, but don't process it
    contents = image.file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Image cannot be empty.")
    return ImageAnalysisResponse(
        detected_issue="Civic issue detected in uploaded photo",
        visual_description="The uploaded photograph shows a potential civic infrastructure problem. A detailed analysis would require the full AI service with vision model support.",
        suggested_category="Roads",
        suggested_severity="Medium",
    )


@app.post("/api/complaint/prepare-with-image", response_model=PrepareWithImageResponse)
def prepare_with_image_endpoint(
    image: UploadFile = File(...),
    issue: str = Form(default=""),
    location: str = Form(default=""),
):
    contents = image.file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Image cannot be empty.")

    title = issue.strip() or "Reported Civic Issue"
    return PrepareWithImageResponse(
        title=f"Civic Report: {title[:50]}",
        description=f"Issue reported{f' at {location}' if location.strip() else ''}: {title}. Photo evidence attached. Detailed AI analysis requires the full AI service.",
        category="Roads",
        severity="Medium",
    )
