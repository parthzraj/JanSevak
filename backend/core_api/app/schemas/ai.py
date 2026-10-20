"""Request bodies for the AI proxy. They mirror backend/CONTRACT.md so bad
requests fail fast here (422) instead of reaching the GPU laptop."""
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.issue import to_backend_priority


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatbotRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=50)


class ComplaintGenerateRequest(BaseModel):
    issue: str = Field(min_length=1, max_length=1000)
    location: str = Field(min_length=1, max_length=500)
    additional_details: str = Field(default="", max_length=3000)


class ProblemDescriptionRequest(BaseModel):
    description: str = Field(min_length=1, max_length=4000)


class HazardAlertRequest(BaseModel):
    issue: str = Field(min_length=1, max_length=1000)
    location: str = Field(min_length=1, max_length=500)


class SuggestiveRemarksRequest(BaseModel):
    issue: str = Field(min_length=1, max_length=1000)
    existing_description: str = Field(default="", max_length=3000)


class ComplaintItem(BaseModel):
    id: str
    title: str
    category: Literal["Roads", "Water", "Sanitation", "Streetlights", "Public Safety", "Parks", "Community"]
    priority: Literal["Low", "Medium", "High", "Critical", "Urgent"]

    @field_validator("id", mode="before")
    @classmethod
    def _id_to_str(cls, v):
        return str(v)

    @field_validator("priority")
    @classmethod
    def _map_priority(cls, v: str) -> str:
        return to_backend_priority(v)  # AI service only knows 'Critical'


class FeedPrioritizeRequest(BaseModel):
    complaints: list[ComplaintItem] = Field(min_length=1, max_length=100)
