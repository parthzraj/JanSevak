
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2:3b"

SYSTEM_PROMPT = """
You are PrajaPulse Assistant, a helpful civic engagement chatbot.
Help citizens report potholes, garbage, water leakage, and broken
streetlights.

Be polite and concise. Explain what details a useful complaint needs.
Never invent complaint IDs, complaint statuses, or official updates.
Never claim that a complaint has been submitted.
If you do not know an official procedure, say so honestly.
"""


def chat_with_prajapulse(message: str) -> str:
    if not message.strip():
        raise ValueError("Message cannot be empty.")

    prompt = f"""
{SYSTEM_PROMPT}

Citizen's message:
{message}

Your response:
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
