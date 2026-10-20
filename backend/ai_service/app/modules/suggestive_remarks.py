from typing import Dict, List, Any
from app.modules.ollama_client import call_ollama_json


def generate_suggestive_remarks(issue: str, existing_description: str = "") -> Dict[str, List[str]]:
    """Generate two-column suggestive remarks: what citizens can do vs what government must do."""
    if not issue.strip():
        raise ValueError("Issue cannot be empty.")

    prompt = f"""You are PrajaPulse, an AI civic advisor.
For this civic issue, provide actionable guidance for both the community/citizens and the local municipal authority.

Issue: {issue.strip()}
Details: {existing_description.strip() or 'None provided'}

Rules:
- citizen_actions: 2 to 4 safe, constructive actions citizens can do (e.g., place warning markers, organize cleanup, document with photos).
- government_actions: 2 to 4 specific engineering/administrative steps the municipal department must take.
- Keep each point under 20 words.
- Return ONLY a JSON object in this format:
{{
  "citizen_actions": ["Action 1", "Action 2", "Action 3"],
  "government_actions": ["Action 1", "Action 2", "Action 3"]
}}"""

    result = call_ollama_json(prompt, max_retries=2)

    citizen = result.get("citizen_actions", [])
    govt = result.get("government_actions", [])

    # Validate types and non-empty
    if not isinstance(citizen, list) or not citizen:
        citizen = [
            "Document issue location with clear photographs",
            "Alert neighboring residents to exercise caution",
            "Submit report through official citizen grievance portal",
        ]
    if not isinstance(govt, list) or not govt:
        govt = [
            "Deploy field engineering inspection team to assess damage",
            "Initiate repair work under ward maintenance SLA",
            "Provide formal resolution update on public portal",
        ]

    return {
        "citizen_actions": [str(x).strip() for x in citizen if str(x).strip()][:5],
        "government_actions": [str(x).strip() for x in govt if str(x).strip()][:5],
    }
