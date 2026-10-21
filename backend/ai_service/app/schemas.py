from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question or query")
    history: List[ChatMessage] = Field(default_factory=list, description="Previous chat messages")


class ChatResponse(BaseModel):
    reply: str


class ComplaintRequest(BaseModel):
    issue: str = Field(..., min_length=2, description="Short issue summary (e.g., Pothole)")
    location: str = Field(..., min_length=2, description="Address or ward")
    additional_details: str = Field(default="", description="Optional additional context")


class ComplaintResponse(BaseModel):
    complaint: str


class ProblemDescriptionRequest(BaseModel):
    description: str = Field(..., min_length=2, description="Rough citizen description")


class ProblemDescriptionResponse(BaseModel):
    improved_description: str


class HazardRequest(BaseModel):
    issue: str = Field(..., min_length=2, description="Issue description")
    location: str = Field(..., min_length=2, description="Location of the issue")


class HazardResponse(BaseModel):
    hazard_type: str
    severity: str  # "Low", "Medium", "High", "Critical"
    reason: str
    recommended_action: str


class FeedPrioritizationRequest(BaseModel):
    complaints: List[Dict[str, Any]] = Field(..., min_length=1, description="List of complaint objects with an 'id' field")


class FeedPrioritizationResponse(BaseModel):
    ranked_ids: List[str]


class SuggestiveRemarksRequest(BaseModel):
    issue: str = Field(..., min_length=2, description="The reported issue title or category")
    existing_description: str = Field(default="", description="Existing citizen notes")


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
    decision: str  # "pass", "reject", or "uncertain"
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
    status: str  # 'Scheduled', 'In Progress', 'Completed'
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
    street: str = Field(..., min_length=1, description="Street or area name to check")


class StreetRiskResponse(BaseModel):
    zone: str
    riskLevel: str  # 'High', 'Moderate', 'Low'
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

