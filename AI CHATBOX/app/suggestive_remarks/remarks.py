
import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2:3b"


def generate_suggestive_remarks(
    issue: str,
    existing_description: str = ""
) -> list[str]:

    if not issue.strip():
        raise ValueError("Issue cannot be empty.")

    prompt = f"""
Generate exactly 3 short, constructive remarks for this civic issue.

Issue: {issue}
Existing description: {existing_description or "Not provided"}

Rules:
- Each remark must be under 25 words.
- Be polite, specific, and constructive.
- Do not invent facts, dates, locations, or complaint statuses.
- Avoid repeating the same idea.

Return JSON in exactly this format:
{{
  "remarks": [
    "First constructive remark",
    "Second constructive remark",
    "Third constructive remark"
  ]
}}
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

    if isinstance(result, dict):
        result = result.get("remarks")

    if (
        not isinstance(result, list)
        or len(result) != 3
        or not all(
            isinstance(item, str) and item.strip()
            for item in result
        )
    ):
        raise ValueError("AI returned invalid remarks.")

    return [item.strip() for item in result]
