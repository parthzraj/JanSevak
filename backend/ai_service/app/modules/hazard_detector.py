from typing import Dict, Any
from app.modules.ollama_client import call_ollama_json

ALLOWED_SEVERITIES = {"Low", "Medium", "High", "Critical"}


def detect_hazard(issue: str, location: str) -> Dict[str, Any]:
    """Classify a reported issue into hazard category, severity, reason, and action."""
    if not issue.strip():
        raise ValueError("Issue cannot be empty.")
    if not location.strip():
        raise ValueError("Location cannot be empty.")
    if len(issue) > 500:
        raise ValueError("Issue too long (max 500 characters).")
    if len(location) > 200:
        raise ValueError("Location too long (max 200 characters).")

    prompt = f"""You are PrajaPulse, a civic hazard triage specialist.
Assess this reported civic problem and return a JSON object evaluating its hazard risk.

Reported Issue: {issue.strip()}
Location: {location.strip()}

Severity criteria:
- Critical: Immediate risk of death or severe injury (e.g. live exposed wires in rain, open deep manhole, toxic gas/fire).
- High: Severe disruption or imminent hazard (e.g. major road crater, sewage flood in residential area, water pipeline burst).
- Medium: Needs timely intervention before escalating (e.g. garbage dump, non-functional streetlights on dark road).
- Low: Routine maintenance (e.g. faded street sign, dry leaves in park).

Return ONLY a JSON object with this exact structure:
{{
  "hazard_type": "short category name (e.g., Electrical Hazard, Structural Risk, Sanitation)",
  "severity": "Low" or "Medium" or "High" or "Critical",
  "reason": "1-2 sentence explanation grounded strictly in the report",
  "recommended_action": "concrete immediate action recommended"
}}

Example output:
{{
  "hazard_type": "Road Hazard",
  "severity": "High",
  "reason": "Deep pothole near bus stop poses risk of vehicle damage and pedestrian injury.",
  "recommended_action": "Deploy barricades immediately and schedule asphalt repair within 24 hours."
}}"""

    result = call_ollama_json(prompt, max_retries=2)

    # Validate severity
    severity = str(result.get("severity", "Medium")).capitalize()
    if severity not in ALLOWED_SEVERITIES:
        severity = "Medium"

    return {
        "hazard_type": str(result.get("hazard_type", "General Civic Issue")).strip(),
        "severity": severity,
        "reason": str(result.get("reason", "Assessment based on citizen report.")).strip(),
        "recommended_action": str(result.get("recommended_action", "Forward to local ward engineer.")).strip(),
    }
