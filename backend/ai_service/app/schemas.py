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
