
import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2:3b"


def detect_hazard(issue: str, location: str) -> dict:
    """Classify a reported civic hazard and suggest a response priority."""

    if not issue.strip():
        raise ValueError("Issue cannot be empty.")

    if not location.strip():
        raise ValueError("Location cannot be empty.")

    prompt = f"""
You are PrajaPulse, a civic hazard triage assistant.

Assess the reported issue and return ONLY valid JSON with these fields:
{{
  "hazard_type": "short category",
  "severity": "Low, Medium, High, or Critical",
  "reason": "brief explanation based only on the report",
  "recommended_action": "sensible next step"
}}

Rules:
- Use only information provided in the report.
- Do not invent injuries, damage, or other facts.
- Critical means an apparently immediate threat to life or serious injury.
- High means a potentially dangerous situation requiring urgent attention.
- Medium means a problem needing timely attention.
- Low means a routine civic issue.
- If details are insufficient, choose a cautious classification and say so.
- This is preliminary AI triage, not a verified emergency assessment.

Reported issue: {issue}
Location: {location}
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        },
        timeout=180
    )
    response.raise_for_status()

    result = json.loads(response.json()["response"])

    allowed_severities = {"Low", "Medium", "High", "Critical"}
    if result.get("severity") not in allowed_severities:
        raise ValueError("The AI returned an invalid severity.")

    return result
