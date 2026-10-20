from app.modules.ollama_client import call_ollama_text


def generate_complaint(issue: str, location: str, additional_details: str = "") -> str:
    """Generate a formal, well-structured civic grievance letter."""
    if not issue.strip():
        raise ValueError("Issue cannot be empty.")
    if not location.strip():
        raise ValueError("Location cannot be empty.")
    if len(issue) > 500:
        raise ValueError("Issue description too long (max 500 characters).")
    if len(location) > 200:
        raise ValueError("Location too long (max 200 characters).")
    if len(additional_details) > 1000:
        raise ValueError("Additional details too long (max 1000 characters).")

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
8. Keep the letter between 150-250 words.
"""
    return call_ollama_text(prompt)
