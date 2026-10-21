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
    confidence: float = 0.85


class PhotoVerifyResponse(BaseModel):
    decision: str
    is_civic_issue: bool
    confidence: float
    detected_issue: str
    suggested_category: str
    reason: str
    unsafe_content: bool


class CitizenSolution(BaseModel):
    title: str
    description: str
    actionableStep: str


class MunicipalMitigation(BaseModel):
    department: str
    plan: str
    status: str
    targetDate: str


class ChecklistItem(BaseModel):
    id: str
    text: str
    points: int


class PredictiveAlertResponse(BaseModel):
    id: str
    season: str
    seasonLabel: str
    title: str
    category: str
    severity: str
    probability: int
    expectedTimeline: str
    daysAway: int
    affectedZones: List[str]
    historicalPrecedent: str
    problemDescription: str
    citizenImpact: List[str]
    citizenSolutions: List[CitizenSolution]
    municipalMitigation: List[MunicipalMitigation]
    checklist: List[ChecklistItem]
    helpline: str


class PredictiveAlertsListResponse(BaseModel):
    alerts: List[PredictiveAlertResponse]


class StreetRiskRequest(BaseModel):
    street: str = Field(..., min_length=1)


class StreetRiskResponse(BaseModel):
    zone: str
    riskLevel: str
    probability: int
    predictedHazard: str
    actionRequired: str


class ImpactVerifyResponse(BaseModel):
    verdict: str  # "approved", "rejected", "flagged"
    is_civic_niche: bool
    is_location_match: bool
    impact_score: int
    impact_tier: str  # "Transformational", "Significant", "Moderate", "Routine / Low"
    confidence: float
    reason: str
    rejection_reasons: List[str] = []
    key_transformation: str = ""
    community_takeaway: str = ""
    suggested_badges: List[str] = []

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
        confidence=0.85,
    )


# ── New AI Feature Endpoints (Lite Fallback) ───────────────────────────

FALLBACK_ALERTS = {
    "Monsoon": [
        {
            "id": "lite-monsoon-flood",
            "season": "Monsoon",
            "seasonLabel": "Upcoming Monsoon Season",
            "title": "Waterlogging & Stormwater Drain Overflow Risk",
            "category": "Water",
            "severity": "Critical",
            "probability": 88,
            "expectedTimeline": "Expected during peak monsoon months",
            "daysAway": 45,
            "affectedZones": ["Low-lying areas", "Underpass zones", "Canal-adjacent streets", "Basement-level buildings"],
            "historicalPrecedent": "Based on historical data: waterlogging complaints surge by 300% during initial monsoon weeks due to clogged drains and construction debris.",
            "problemDescription": "Heavy rainfall rates exceeding 40mm/hour combined with accumulated silt in drainage systems create high risk of surface flooding and basement inundation.",
            "citizenImpact": [
                "Flooding in residential basements and underground parking",
                "Contaminated water entering drinking water sumps",
                "Severe traffic disruption on arterial roads",
                "Risk of vehicle damage in low-lying underpasses",
            ],
            "citizenSolutions": [
                {"title": "Elevate Sump Covers", "description": "Raise inspection covers above driveway level to prevent dirty floodwater from entering drinking water supply.", "actionableStep": "Seal or elevate sump covers at least 6 inches above ground level."},
                {"title": "Clear Rooftop Drains", "description": "Dry leaves block terrace drains causing ponding that leaks into electrical conduits.", "actionableStep": "Clean terrace drain mouths and install wire-mesh leaf guards."},
                {"title": "Install Backwater Valves", "description": "Stormwater backpressure can force sewage back through basement drains.", "actionableStep": "Have a plumber install non-return flap valves in basement drain outlets."},
            ],
            "municipalMitigation": [
                {"department": "Storm Water Drains Division", "plan": "Mechanized desilting of primary culverts and secondary feeder canals.", "status": "Scheduled", "targetDate": "Before monsoon onset"},
                {"department": "Traffic Management", "plan": "Pre-position flood barricades and diversion signage at known waterlogging hotspots.", "status": "Scheduled", "targetDate": "Before monsoon onset"},
            ],
            "checklist": [
                {"id": "chk-sump", "text": "Sump cover elevated and sealed", "points": 10},
                {"id": "chk-terrace", "text": "Terrace drains cleaned and leaf guards installed", "points": 10},
                {"id": "chk-backwater", "text": "Basement backwater valves checked or installed", "points": 15},
                {"id": "chk-grating", "text": "Reported any blocked road gratings via portal", "points": 10},
            ],
            "helpline": "Municipal Emergency: 1800-XXX-XXXX",
        },
        {
            "id": "lite-monsoon-road",
            "season": "Monsoon",
            "seasonLabel": "Upcoming Monsoon Season",
            "title": "Road Surface Damage & Pothole Formation",
            "category": "Roads",
            "severity": "High",
            "probability": 82,
            "expectedTimeline": "Within first 2 weeks of heavy rain",
            "daysAway": 50,
            "affectedZones": ["Recently repaired roads", "Utility trench backfills", "Bus route corridors", "Heavy vehicle zones"],
            "historicalPrecedent": "Road damage complaints increase by 200% during monsoon due to water seepage into sub-base layers of recently patched roads.",
            "problemDescription": "Water infiltration into poorly compacted road patches and utility cable trenches causes rapid pothole formation, especially on heavily trafficked routes.",
            "citizenImpact": [
                "Dangerous potholes forming overnight after heavy rain",
                "Vehicle suspension damage and accident risk",
                "Two-wheeler riders at high risk on waterlogged roads",
                "Increased commute times due to road diversions",
            ],
            "citizenSolutions": [
                {"title": "Report Pre-Monsoon Road Cracks", "description": "Existing cracks expand rapidly when water enters. Report them before monsoon.", "actionableStep": "Use the portal to flag cracked road surfaces now."},
                {"title": "Drive with Caution After Rain", "description": "New potholes are hidden under standing water after initial showers.", "actionableStep": "Reduce speed and avoid driving through water-covered road sections."},
            ],
            "municipalMitigation": [
                {"department": "Roads & Infrastructure", "plan": "Pre-monsoon hot-mix patching of identified weak spots on arterial roads.", "status": "In Progress", "targetDate": "Before monsoon onset"},
            ],
            "checklist": [
                {"id": "chk-cracks", "text": "Reported visible road cracks in your area", "points": 10},
                {"id": "chk-trench", "text": "Flagged uncompacted utility trenches", "points": 10},
            ],
            "helpline": "Road Maintenance Helpline: 1800-XXX-XXXX",
        },
    ],
    "Summer": [
        {
            "id": "lite-summer-water",
            "season": "Summer",
            "seasonLabel": "Peak Summer Season",
            "title": "Water Supply Shortage & Tanker Dependency",
            "category": "Water",
            "severity": "High",
            "probability": 78,
            "expectedTimeline": "Peak impact during April-May",
            "daysAway": 120,
            "affectedZones": ["Peripheral wards", "Elevated terrain areas", "Dense residential blocks", "New construction zones"],
            "historicalPrecedent": "Water supply complaints peak in April-May with a 150% increase over baseline due to reservoir depletion and increased demand.",
            "problemDescription": "Rising temperatures increase water demand while reservoir levels drop. Peripheral areas face reduced pressure and intermittent supply.",
            "citizenImpact": [
                "Irregular and reduced water supply schedules",
                "Dependence on expensive private tanker water",
                "Low pressure in upper-floor apartments",
                "Risk of waterborne diseases from alternative sources",
            ],
            "citizenSolutions": [
                {"title": "Install Rainwater Harvesting", "description": "Collect and store rainwater to supplement municipal supply during shortages.", "actionableStep": "Install rooftop rainwater collection with basic filtration."},
                {"title": "Fix Household Leaks", "description": "Dripping taps and toilet cisterns waste significant water daily.", "actionableStep": "Inspect and fix all leaking taps, pipes and toilet flush mechanisms."},
            ],
            "municipalMitigation": [
                {"department": "Water Supply Board", "plan": "Equitable tanker distribution schedule for affected wards.", "status": "Scheduled", "targetDate": "April onwards"},
            ],
            "checklist": [
                {"id": "chk-leaks", "text": "Fixed all household water leaks", "points": 10},
                {"id": "chk-harvest", "text": "Rainwater harvesting system installed or planned", "points": 20},
                {"id": "chk-store", "text": "Emergency water storage containers cleaned and filled", "points": 10},
            ],
            "helpline": "Water Supply Helpline: 1800-XXX-XXXX",
        },
    ],
    "Post-Monsoon": [
        {
            "id": "lite-postmon-dengue",
            "season": "Post-Monsoon",
            "seasonLabel": "Post-Monsoon Period",
            "title": "Dengue & Vector-Borne Disease Outbreak Risk",
            "category": "Public Safety",
            "severity": "High",
            "probability": 75,
            "expectedTimeline": "September-November peak",
            "daysAway": 90,
            "affectedZones": ["Areas with stagnant water", "Construction sites", "Open plots", "Dense neighborhoods"],
            "historicalPrecedent": "Dengue cases typically spike 3-4 weeks after monsoon ends due to stagnant water breeding grounds.",
            "problemDescription": "Accumulated stagnant water from monsoon rains provides breeding grounds for Aedes mosquitoes, leading to dengue and chikungunya outbreaks.",
            "citizenImpact": [
                "Increased mosquito-borne illness cases",
                "Children and elderly at higher health risk",
                "Healthcare facility overcrowding",
                "Lost workdays due to illness",
            ],
            "citizenSolutions": [
                {"title": "Eliminate Stagnant Water", "description": "Empty all containers, flower pots, and coolers that collect rainwater.", "actionableStep": "Do a weekly dry day — empty all water-collecting containers every Sunday."},
                {"title": "Report Stagnant Water Sites", "description": "Construction sites and open plots with standing water are major breeding grounds.", "actionableStep": "Report stagnant water accumulations via the civic portal."},
            ],
            "municipalMitigation": [
                {"department": "Health & Vector Control", "plan": "Ward-level fogging drives and larval surveys in high-risk zones.", "status": "Scheduled", "targetDate": "Post-monsoon period"},
            ],
            "checklist": [
                {"id": "chk-stagnant", "text": "Eliminated all stagnant water sources at home", "points": 10},
                {"id": "chk-cooler", "text": "Cleaned and dried desert coolers and tanks", "points": 10},
                {"id": "chk-report-water", "text": "Reported stagnant water sites in neighborhood", "points": 15},
            ],
            "helpline": "Health Emergency: 1800-XXX-XXXX",
        },
    ],
    "Winter": [
        {
            "id": "lite-winter-smog",
            "season": "Winter",
            "seasonLabel": "Winter Season",
            "title": "Air Quality Deterioration & Smog Advisory",
            "category": "Public Safety",
            "severity": "Moderate",
            "probability": 70,
            "expectedTimeline": "December-January peak",
            "daysAway": 150,
            "affectedZones": ["Industrial buffer zones", "High-traffic corridors", "Construction-heavy areas", "Low-wind zones"],
            "historicalPrecedent": "Winter temperature inversions trap pollutants near ground level, with AQI regularly exceeding 200 in urban areas.",
            "problemDescription": "Cold weather temperature inversions combined with construction dust and vehicle emissions create persistent smog conditions.",
            "citizenImpact": [
                "Respiratory issues especially for children and elderly",
                "Reduced visibility affecting road safety",
                "Outdoor workers face health hazards",
                "School disruptions during severe smog days",
            ],
            "citizenSolutions": [
                {"title": "Report Open Burning", "description": "Waste burning and construction debris burning are major contributors to winter smog.", "actionableStep": "Report any open waste burning to the portal immediately."},
                {"title": "Use Public Transport", "description": "Reducing vehicle trips directly improves local air quality.", "actionableStep": "Carpool or use public transport at least 3 days a week during winter."},
            ],
            "municipalMitigation": [
                {"department": "Environment & Pollution Control", "plan": "Enforce construction dust management norms and anti-burning drives.", "status": "Scheduled", "targetDate": "November onwards"},
            ],
            "checklist": [
                {"id": "chk-burning", "text": "Reported any open burning in neighborhood", "points": 15},
                {"id": "chk-transport", "text": "Using public transport or carpooling", "points": 10},
            ],
            "helpline": "Pollution Control Board: 1800-XXX-XXXX",
        },
    ],
}


@app.post("/api/photo/verify", response_model=PhotoVerifyResponse)
def photo_verify_endpoint(image: UploadFile = File(...)):
    """Lite fallback: always returns 'uncertain' since no vision model is available."""
    contents = image.file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Image cannot be empty.")
    return PhotoVerifyResponse(
        decision="uncertain",
        is_civic_issue=False,
        confidence=0.0,
        detected_issue="",
        suggested_category="",
        reason="Photo verification requires the full AI service with vision model support. This photo will be reviewed manually.",
        unsafe_content=False,
    )


@app.get("/api/predictive/alerts", response_model=PredictiveAlertsListResponse)
def predictive_alerts_endpoint(season: str = None):
    """Lite fallback: returns template-based predictive alerts."""
    if season and season != "All" and season in FALLBACK_ALERTS:
        alerts = FALLBACK_ALERTS[season]
    else:
        # Return all alerts across seasons
        alerts = []
        for s_alerts in FALLBACK_ALERTS.values():
            alerts.extend(s_alerts)
    return PredictiveAlertsListResponse(alerts=alerts)


@app.post("/api/predictive/check-street", response_model=StreetRiskResponse)
def street_risk_endpoint(req: StreetRiskRequest):
    """Lite fallback: returns template-based street risk assessment."""
    term = req.street.lower()
    risk_level = "Moderate"
    probability = 65
    hazard = "General seasonal weather-related risks. Specific risk assessment requires the full AI service."
    action = "Monitor local conditions and report any issues via the civic portal."

    if any(w in term for w in ["underpass", "low", "canal", "nala", "creek"]):
        risk_level = "High"
        probability = 85
        hazard = "High flooding and waterlogging risk due to low elevation and proximity to water channels."
        action = "Avoid during heavy rain. Ensure basement pumps are working. Install backwater valves."
    elif any(w in term for w in ["main", "highway", "ring", "national"]):
        risk_level = "Moderate"
        probability = 72
        hazard = "Road surface damage and pothole formation risk from heavy traffic combined with weather."
        action = "Drive carefully after rain. Report potholes immediately via the portal."
    elif any(w in term for w in ["colony", "layout", "nagar", "society"]):
        risk_level = "Moderate"
        probability = 60
        hazard = "Localized drainage issues and waste accumulation during seasonal transitions."
        action = "Ensure community drains are clear. Organize neighborhood cleanup drives."

    return StreetRiskResponse(
        zone=req.street,
        riskLevel=risk_level,
        probability=probability,
        predictedHazard=hazard,
        actionRequired=action,
    )


@app.post("/api/impact/verify", response_model=ImpactVerifyResponse)
def impact_verify_endpoint(
    before_image: Optional[UploadFile] = File(None),
    after_image: Optional[UploadFile] = File(None),
    title: str = Form(""),
    category: str = Form(""),
    description: str = Form(""),
    resolution_note: str = Form(""),
    before_image_b64: Optional[str] = Form(None),
    after_image_b64: Optional[str] = Form(None),
):
    """Lite fallback: rule-based civic impact and before/after verification."""
    full_text = f"{title} {category} {description} {resolution_note}".lower()

    non_civic = ["cook", "recipe", "kitchen", "paneer", "chicken", "biryani", "food", "selfie", "outfit", "meme", "pet", "dog", "cat", "gameplay", "dance"]
    routine = ["daily sweeping", "swept road", "swept dust", "routine sweeping", "swept sidewalk", "broomed", "broom sweep", "routine janitorial", "regular sweep", "just cleaning", "regular cleaning", "normal cleaning", "cleaning of roadside garbage", "roadside garbage cleaning"]
    high = ["mass drive", "mass cleanup", "campaign", "volunteer", "volunteers", "dumpsite", "blackspot", "chronic dump", "multi-ton", "sinkhole", "crater", "waterlogging", "desilting", "culvert", "reclaimed", "rejuvenation", "beautification", "saplings"]

    rejection_reasons = []
    is_civic = not any(w in full_text for w in non_civic)
    if not is_civic:
        rejection_reasons.append("Non-Civic Content: Reel does not match municipal or public infrastructure domain.")

    river_lake = any(w in resolution_note.lower() for w in ["river", "lake", "ocean", "beach", "mountain", "bedroom"])
    street_waste = any(w in f"{title} {description}".lower() for w in ["garbage", "dump", "pothole", "manhole", "sewage", "street", "road"])
    is_location_match = not (river_lake and street_waste)
    if not is_location_match:
        rejection_reasons.append("Location Mismatch: 'Before' photo shows street grievance while 'After' shows an unrelated scene.")

    found_high = [w for w in high if w in full_text]
    found_routine = [w for w in routine if w in full_text]

    is_routine_maintenance = bool(found_routine and not found_high)
    if is_routine_maintenance:
        score = 35
        tier = "Routine / Low"
        rejection_reasons.append("Routine / Trivial Maintenance: Impact Reels require transformational community achievements, mass drives, or major repairs. Daily routine sweeping does not qualify.")
    else:
        score = 85 if found_high else 65
        tier = "Transformational" if score >= 80 else "Significant"

    verdict = "approved" if (is_civic and is_location_match and tier != "Routine / Low" and score >= 50) else "rejected"
    reason = f"Verified {tier.lower()} civic redressal." if verdict == "approved" else (" | ".join(rejection_reasons) if rejection_reasons else "Does not qualify for Impact Reels.")

    badges = ["Transformational Milestone", "High Impact Drive"] if tier == "Transformational" else ["Verified Civic Fix"]

    return ImpactVerifyResponse(
        verdict=verdict,
        is_civic_niche=is_civic,
        is_location_match=is_location_match,
        impact_score=score,
        impact_tier=tier,
        confidence=0.85,
        reason=reason,
        rejection_reasons=rejection_reasons,
        key_transformation=f"{category or 'Civic'} improvement demonstrated." if is_civic else "Non-civic content.",
        community_takeaway="Proactive civic reporting and collective community work drive real neighborhood change.",
        suggested_badges=badges,
    )
