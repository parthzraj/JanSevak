
import base64
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
VISION_MODEL = "llava"


def analyze_civic_image(image_bytes: bytes) -> str:
    if not image_bytes:
        raise ValueError("Please upload an image.")

    encoded_image = base64.b64encode(image_bytes).decode("utf-8")

    prompt = """
Analyze this image for a possible civic issue, such as garbage,
potholes, damaged roads, waterlogging, or broken streetlights.

Describe only what is visible. Do not invent the location,
date, cause, or other facts. If unclear, say so.
Return a concise description.
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": VISION_MODEL,
            "prompt": prompt,
            "images": [encoded_image],
            "stream": False,
        },
        timeout=300,
    )

    response.raise_for_status()
    return response.json()["response"].strip()
