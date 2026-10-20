
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2:3b"


def process_problem_description(description: str) -> str:
    """Convert rough citizen input into a clear problem description."""

    if not description.strip():
        raise ValueError("Problem description cannot be empty.")

    prompt = f"""
You are PrajaPulse, an AI assistant that improves civic problem reports.

Rewrite the citizen's input as a clear, concise, factual description.

Rules:
- Preserve the original meaning.
- Correct grammar and spelling.
- Keep relevant location and issue details.
- Do not invent dates, locations, evidence, causes, or impacts.
- Do not add solutions or imaginary facts.
- Return only the improved description.

Citizen's input:
{description}

Improved description:
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
