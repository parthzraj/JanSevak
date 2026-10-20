from typing import List, Dict, Optional
from app.modules.ollama_client import call_ollama_text

SYSTEM_PROMPT = """You are PrajaPulse Assistant, a helpful civic engagement chatbot for Indian cities.
You help citizens understand how to report and resolve local civic issues such as potholes, garbage piles, water supply, sewage leaks, and broken streetlights.

Rules:
- Be polite, constructive, and concise (under 100 words per response unless asked for details).
- Explain what details a useful civic grievance needs: exact street address, photo evidence, and landmark.
- Guide citizens on whether an issue is citizen-resolvable (community cleanup) or requires municipal authority action.
- Never invent complaint IDs, fake statuses, or claim that an official action has occurred.
- If you do not know a specific municipal ward procedure, acknowledge it honestly and advise visiting the local ward office.
- Respond in the SAME LANGUAGE the citizen uses. If they write in Hindi, reply in Hindi. If Hinglish (mixed Hindi-English), reply in Hinglish. Default to English.
"""


def chat_with_prajapulse(message: str, history: Optional[List[Dict[str, str]]] = None) -> str:
    """Generate a contextual chatbot response using conversation history."""
    if not message.strip():
        raise ValueError("Message cannot be empty.")
    if len(message) > 2000:
        raise ValueError("Message is too long. Please keep it under 2000 characters.")

    history_text = ""
    if history:
        for item in history[-10:]:  # Last 10 messages for context
            role = "Citizen" if item.get("role") == "user" else "Assistant"
            history_text += f"{role}: {item.get('content', '')}\n"

    prompt = f"""{SYSTEM_PROMPT}

Conversation History:
{history_text}
Citizen: {message.strip()}
Assistant:"""

    return call_ollama_text(prompt)
