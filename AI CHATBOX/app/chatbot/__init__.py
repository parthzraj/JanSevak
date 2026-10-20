
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2:3b"

SYSTEM_PROMPT = """
You are PrajaPulse Assistant, a helpful civic engagement chatbot.

You help citizens understand how to report civic problems such as
potholes, garbage accumulation, water leakage, and broken streetlights.

Rules:
- Be polite, clear, and concise.
- Help users understand how to write useful civic complaints.
- Ask for the location when it is needed.
- Never invent complaint IDs, complaint statuses, or official updates.
- If you do not know an official procedure, say so honestly.
- Do not claim that a complaint has been submitted.
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
