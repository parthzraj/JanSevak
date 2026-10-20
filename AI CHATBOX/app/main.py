import json
from app.chatbot.chatbot import chat_with_prajapulse
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from requests.exceptions import RequestException
from app.problem_description.processor import process_problem_description
from app.complaint_generator.generator import generate_complaint
from app.hazard_alerts.detector import detect_hazard
from app.feed_prioritization.prioritizer import prioritize_complaints
from app.suggestive_remarks.remarks import generate_suggestive_remarks
from typing import Literal
from fastapi import UploadFile, File, Form
from app.complaint_generator.image_generator import analyze_civic_image
from fastapi import UploadFile, File, Form
from app.complaint_generator.image_generator import analyze_civic_image
app = FastAPI(
    title="PrajaPulse AI API",
    description="AI services for civic complaint management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComplaintRequest(BaseModel):
    issue: str
    location: str
    additional_details: str = ""


@app.get("/")
def home():
    return {
        "message": "PrajaPulse AI API is running",
        "module": "Complaint Generator",
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "jansevak-ai"}


@app.post("/api/complaint/generate")
def create_complaint(request: ComplaintRequest):
    try:
        complaint = generate_complaint(
            issue=request.issue,
            location=request.location,
            additional_details=request.additional_details,
        )
        return {"success": True, "complaint": complaint}

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Ollama. Check that it is running.",
        )
class ChatRequest(BaseModel):
    message: str


@app.post("/api/chatbot")
def chatbot(request: ChatRequest):
    try:
        answer = chat_with_prajapulse(request.message)
        return {
            "success": True,
            "reply": answer
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Ollama. Check that it is running."
        )
    
class ProblemDescriptionRequest(BaseModel):
    description: str


@app.post("/api/problem-description")
def improve_problem_description(request: ProblemDescriptionRequest):
    try:
        result = process_problem_description(request.description)
        return {
            "success": True,
            "description": result
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Ollama. Check that it is running."
        )

class HazardRequest(BaseModel):
    issue: str
    location: str


@app.post("/api/hazard-alerts")
def create_hazard_alert(request: HazardRequest):
    try:
        result = detect_hazard(
            issue=request.issue,
            location=request.location
        )
        return {"success": True, "alert": result}

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Ollama. Check that it is running."
        )

    except (json.JSONDecodeError, KeyError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="The AI returned an invalid response. Please retry."
        )

class FeedPrioritizationRequest(BaseModel):
    complaints: list[dict]


@app.post("/api/feed/prioritize")
def prioritize_feed(request: FeedPrioritizationRequest):
    try:
        ranked = prioritize_complaints(request.complaints)
        return {"success": True, "complaints": ranked}

    except (ValueError, KeyError) as error:
        raise HTTPException(status_code=400, detail=str(error))

    except RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Ollama. Check that it is running."
        )

    except (json.JSONDecodeError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="The AI returned an invalid response. Please retry."
        )

class SuggestiveRemarksRequest(BaseModel):
    issue: str
    existing_description: str = ""


@app.post("/api/suggestive-remarks")
def suggest_remarks(request: SuggestiveRemarksRequest):
    try:
        remarks = generate_suggestive_remarks(
            issue=request.issue,
            existing_description=request.existing_description,
        )
        return {"success": True, "remarks": remarks}

    except ValueError as error:
        raise HTTPException(status_code=502, detail=str(error))

    except RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Ollama. Check that it is running."
        )

    except (json.JSONDecodeError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="The AI returned an invalid response. Please retry."
        )

@app.post("/api/complaint/analyze-image")
async def analyze_complaint_image(
    image: UploadFile = File(...),
):
    try:
        # Accept only supported image formats.
        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Upload a JPG, PNG, or WEBP image.",
            )

        image_bytes = await image.read()

        # Limit uploads to 10 MB.
        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is empty.",
            )

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Image size must be 10 MB or less.",
            )

        description = analyze_civic_image(image_bytes)

        return {
            "success": True,
            "image_description": description,
            "requires_review": True,
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "Image analysis failed. Check that Ollama is running "
                "and the llava model is available."
            ),
        ) from error

@app.post("/api/complaint/prepare-with-image")
async def prepare_complaint_with_image(
    mode: Literal["AI", "SELF", "AI_SELF"] = Form(...),
    image: UploadFile = File(...),
    location: str = Form(""),
    issue: str = Form(""),
    draft: str = Form(""),
    additional_details: str = Form(""),
):
    try:
        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Upload a JPG, PNG, or WEBP image.",
            )

        image_bytes = await image.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Please upload an image.",
            )

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Image size must be 10 MB or less.",
            )

        if mode == "SELF":
            if not draft.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Please enter your complaint.",
                )

            complaint = draft.strip()
            image_description = None

        else:
            if not location.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Location is required.",
                )

            image_description = analyze_civic_image(image_bytes)

            if mode == "AI":
                if not issue.strip() and not image_description.strip():
                    raise HTTPException(
                        status_code=400,
                        detail="Please describe the issue.",
                    )

                complaint = generate_complaint(
                    issue=(
                        f"Citizen-reported issue: {issue.strip() or 'Not provided'}\n"
                        f"Visible image details: {image_description}"
                    ),
                    location=location,
                    additional_details=additional_details,
                )

            else:  # AI_SELF
                if not draft.strip():
                    raise HTTPException(
                        status_code=400,
                        detail="Please enter your complaint draft.",
                    )

                combined_text = f"""
Citizen's draft:
{draft.strip()}

Location:
{location.strip()}

Visible details from the photo:
{image_description}

Additional citizen details:
{additional_details or "Not provided"}
"""
                complaint = process_problem_description(combined_text)

        return {
            "success": True,
            "mode": mode,
            "complaint": complaint,
            "image_description": image_description,
            "image_filename": image.filename,
            "requires_review": True,
            "message": "Review the complaint before submitting.",
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to Ollama. Check that it is running.",
        )
