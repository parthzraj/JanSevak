from app.modules.ollama_client import call_ollama_text


def process_problem_description(description: str) -> str:
    """Rewrite rough citizen notes into a clear, professional description."""
    if not description.strip():
        raise ValueError("Problem description cannot be empty.")
    if len(description) > 2000:
        raise ValueError("Description too long (max 2000 characters).")

    prompt = f"""You are PrajaPulse, an assistant that refines citizen issue descriptions.
Rewrite the citizen's raw input into a clear, grammatical, and professional issue description suitable for civic authorities.

Rules:
- Preserve the exact meaning, location hints, and severity.
- Correct typos, grammar, and slang.
- Do NOT add imagined facts, dates, or causes.
- Return ONLY the improved description text.
- Keep the output under 100 words.

Example:
Input: "road pe big hole h near school bachhe gir rahe h plz fix kro"
Output: "A large pothole has formed on the road near the school, causing children to trip and fall regularly. This poses a significant safety hazard and requires immediate repair."

Citizen's Raw Input:
{description.strip()}

Improved Description:"""

    return call_ollama_text(prompt)
