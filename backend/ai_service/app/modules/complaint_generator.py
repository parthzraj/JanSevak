from app.modules.ollama_client import call_ollama_text


def generate_complaint(issue: str, location: str, additional_details: str = "") -> str:
    """Generate a formal, well-structured civic grievance letter."""
    if not issue.strip():
        raise ValueError("Issue cannot be empty.")
    if not location.strip():
        raise ValueError("Location cannot be empty.")

    prompt = f"""You are PrajaPulse, an AI civic grievance assistant.
Write a formal, polite, and factually grounded complaint that a citizen can submit to their local municipal corporation (e.g. BBMP, Municipal Corporation).

Reported Problem: {issue.strip()}
Location: {location.strip()}
Additional Citizen Details: {additional_details.strip() or 'None provided'}

Requirements:
1. Include a clear, formal Subject line.
2. State the exact problem and location.
3. Highlight public safety, sanitation, or traffic impact factually (no exaggerated claims).
4. Request inspection and resolution under municipal citizen charter SLAs.
5. Keep tone respectful, constructive, and firm.
6. Do NOT invent dates, reference numbers, or claims not mentioned.
7. Return ONLY the complete complaint letter.
"""
    return call_ollama_text(prompt)
