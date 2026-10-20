
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2:3b"


def generate_complaint(
    issue: str,
    location: str,
    additional_details: str = ""
) -> str:
    """Generate a clear civic complaint using Ollama."""

    if not issue.strip():
        raise ValueError("Issue cannot be empty.")

    if not location.strip():
        raise ValueError("Location cannot be empty.")

    prompt = f"""
You are PrajaPulse, an AI assistant for civic engagement.

Write a clear, polite and factual complaint that a citizen
can submit to the relevant local authority.

Problem: {issue}
Location: {location}
Additional details: {additional_details or "Not provided"}

Requirements:
- Add a short subject line.
- Explain the reported problem clearly.
- Describe its possible impact without inventing facts.
- Request appropriate action from the authority.
- Do not invent dates, evidence or personal details.
- Return only the complaint text.
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False
        },
        timeout=180
    )
    response.raise_for_status()

    return response.json()["response"].strip()
