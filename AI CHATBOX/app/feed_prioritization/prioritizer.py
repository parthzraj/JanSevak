
import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2:3b"

PRIORITY_SCORES = {
    "Critical": 4,
    "High": 3,
    "Medium": 2,
    "Low": 1,
}


def prioritize_complaints(complaints: list[dict]) -> list[dict]:
    """Rank complaints by preliminary urgency using AI."""

    if not complaints:
        return []

    prompt = f"""
You are PrajaPulse, a civic complaint prioritization assistant.

Rank the following complaints by urgency, highest first.

Return ONLY a valid JSON object in this format:
{{
  "ranked_ids": ["id1", "id2"]
}}

Rules:
- Prioritize immediate risks to life and serious injury.
- Next prioritize dangerous infrastructure and major disruptions.
- Routine maintenance issues should generally rank lower.
- Do not invent facts or treat unverified allegations as confirmed.
- Include every provided complaint ID exactly once.
- Use only IDs from the input.

Complaints:
{json.dumps(complaints, ensure_ascii=False)}
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        },
        timeout=180,
    )
    response.raise_for_status()

    result = json.loads(response.json()["response"])
    ranked_ids = result.get("ranked_ids")

    original_ids = [str(c["id"]) for c in complaints]

    if (
        not isinstance(ranked_ids, list)
        or len(ranked_ids) != len(original_ids)
        or set(ranked_ids) != set(original_ids)
    ):
        raise ValueError("AI returned an invalid complaint ranking.")

    lookup = {str(c["id"]): c for c in complaints}

    return [
        {**lookup[complaint_id], "priority_rank": rank}
        for rank, complaint_id in enumerate(ranked_ids, start=1)
    ]
