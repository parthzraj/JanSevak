import base64
import json
import logging
import re
from io import BytesIO
from PIL import Image
from app.modules.ollama_client import call_ollama_vision
from app import config

logger = logging.getLogger(__name__)

CIVIC_CATEGORIES = ["Roads", "Water", "Sanitation", "Streetlights", "Public Safety", "Parks", "Community"]


def verify_photo(image_bytes: bytes, timeout: int = 45) -> dict:
    """Verify if an uploaded photo shows a real civic issue."""
    if not image_bytes:
        raise ValueError("No image data provided.")
    if len(image_bytes) > config.MAX_IMAGE_SIZE_BYTES:
        raise ValueError(f"Image too large. Maximum size is {config.MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB.")
    if len(image_bytes) < config.MIN_IMAGE_SIZE_BYTES:
        raise ValueError("Image too small or corrupted.")

    # Resize to ~1024px
    try:
        img = Image.open(BytesIO(image_bytes))
        max_dim = 1024
        if max(img.size) > max_dim:
            ratio = max_dim / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        buf = BytesIO()
        img_format = "JPEG" if img.mode in ("RGB", "L") else "PNG"
        if img.mode == "RGBA":
            img = img.convert("RGB")
            img_format = "JPEG"
        img.save(buf, format=img_format)
        b64 = base64.b64encode(buf.getvalue()).decode()
    except Exception as e:
        raise ValueError(f"Cannot read image: {e}")

    prompt = """You are a civic issue photo verification system. Analyze this image carefully.

Answer these questions:
1. Is this a photo of a public/civic problem such as a pothole, garbage pile, sewage leak, water leak, broken streetlight, damaged footpath, fallen tree, unsafe wiring, flooding, or similar infrastructure issue?
2. Is this a selfie, indoor photo, food, pet, meme, screenshot, blank wall, or other non-civic content?

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "is_civic_issue": true/false,
  "confidence": 0.0 to 1.0,
  "detected_issue": "short description of the civic issue or empty string",
  "category": "one of: Roads, Water, Sanitation, Streetlights, Public Safety, Parks, Community, or empty string",
  "reason": "one sentence explaining your assessment",
  "unsafe_content": true/false
}"""

    try:
        raw = call_ollama_vision(prompt, b64, timeout=timeout)
        # Parse defensively
        raw = re.sub(r'^```(?:json)?\s*', '', raw.strip())
        raw = re.sub(r'\s*```$', '', raw)
        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            # Try to extract JSON from the text
            match = re.search(r'\{[^{}]*\}', raw, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group())
                except json.JSONDecodeError:
                    return _uncertain_result("Could not parse model response")
            else:
                return _uncertain_result("Could not parse model response")

        # Extract and validate fields
        is_civic = bool(result.get("is_civic_issue", False))
        confidence = float(result.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))  # clamp
        detected_issue = str(result.get("detected_issue", "")).strip()
        category = str(result.get("category", "")).strip()
        reason = str(result.get("reason", "")).strip()
        unsafe = bool(result.get("unsafe_content", False))

        # Validate category
        if category not in CIVIC_CATEGORIES:
            category = ""

        # Compute decision from thresholds
        if unsafe:
            decision = "reject"
        elif not is_civic and confidence >= 0.70:
            decision = "reject"
        elif is_civic and confidence >= 0.60:
            decision = "pass"
        else:
            decision = "uncertain"

        return {
            "decision": decision,
            "is_civic_issue": is_civic,
            "confidence": round(confidence, 2),
            "detected_issue": detected_issue,
            "suggested_category": category,
            "reason": reason,
            "unsafe_content": unsafe,
        }
    except (ConnectionError, TimeoutError):
        raise
    except Exception as e:
        logger.warning("Photo verification error: %s", e)
        return _uncertain_result(str(e))


def _uncertain_result(reason: str) -> dict:
    return {
        "decision": "uncertain",
        "is_civic_issue": False,
        "confidence": 0.0,
        "detected_issue": "",
        "suggested_category": "",
        "reason": reason,
        "unsafe_content": False,
    }
