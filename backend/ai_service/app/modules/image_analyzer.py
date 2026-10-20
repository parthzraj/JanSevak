import io
import base64
from typing import Dict
from PIL import Image
from app.modules.ollama_client import call_ollama_vision, call_ollama_text


def resize_image_to_base64(image_bytes: bytes, max_dim: int = 1024) -> str:
    """Resize image to reasonable resolution (max 1024px) and return base64 string.

    Drastically reduces vision inference latency from minutes to seconds.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        # Convert RGBA / P mode to RGB for JPEG encoding
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Resize if dimensions exceed max_dim
        width, height = img.size
        if width > max_dim or height > max_dim:
            if width > height:
                new_w = max_dim
                new_h = int(height * (max_dim / width))
            else:
                new_h = max_dim
                new_w = int(width * (max_dim / height))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")
    except Exception as e:
        # Fallback to direct raw base64 if PIL fails
        return base64.b64encode(image_bytes).decode("utf-8")


def analyze_civic_image(image_bytes: bytes) -> Dict[str, str]:
    """Use LLaVA to inspect photo and identify civic problem details."""
    if not image_bytes:
        raise ValueError("Image cannot be empty.")

    b64_image = resize_image_to_base64(image_bytes)

    prompt = """Inspect this photograph for municipal or public civic issues (e.g., potholes, garbage accumulation, sewage leaks, broken streetlights, broken footpaths, tree collapse).

Answer in 3 concise points:
1. Detected issue (1 short phrase)
2. Detailed visual description (2 sentences describing what is visible)
3. Suggested category (Choose one: Roads, Water, Sanitation, Streetlights, Public Safety, Parks)
4. Suggested severity (Choose one: Low, Medium, High, Critical)
"""

    response_text = call_ollama_vision(prompt, b64_image)

    # Heuristic category detection from response
    lower = response_text.lower()
    category = "Roads"
    if "garbage" in lower or "waste" in lower or "trash" in lower or "sanitation" in lower:
        category = "Sanitation"
    elif "water" in lower or "sewage" in lower or "drain" in lower or "flood" in lower:
        category = "Water"
    elif "light" in lower or "lamp" in lower or "electric" in lower:
        category = "Streetlights"
    elif "park" in lower or "tree" in lower or "garden" in lower:
        category = "Parks"
    elif "wire" in lower or "hazard" in lower or "danger" in lower:
        category = "Public Safety"

    severity = "High" if any(w in lower for w in ["critical", "severe", "urgent", "danger", "deep"]) else "Medium"

    first_line = response_text.split("\n")[0].replace("1.", "").replace("Detected issue:", "").strip()

    return {
        "detected_issue": first_line if len(first_line) > 3 else "Reported Civic Hazard",
        "visual_description": response_text.strip(),
        "suggested_category": category,
        "suggested_severity": severity,
    }


def prepare_complaint_with_image(image_bytes: bytes, issue: str = "", location: str = "") -> Dict[str, str]:
    """Combines photo vision analysis with formal text drafting."""
    analysis = analyze_civic_image(image_bytes)

    combined_issue = f"{issue.strip() or analysis['detected_issue']}. Visual details: {analysis['visual_description'][:200]}"
    target_location = location.strip() or "Ward Area"

    title = f"{analysis['suggested_category']} Issue: {analysis['detected_issue'][:50]}"

    return {
        "title": title,
        "description": analysis["visual_description"],
        "category": analysis["suggested_category"],
        "severity": analysis["suggested_severity"],
    }
