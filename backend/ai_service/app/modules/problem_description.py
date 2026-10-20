from app.modules.ollama_client import call_ollama_text


def process_problem_description(description: str) -> str:
    """Rewrite rough citizen notes into a clear, professional description."""
    if not description.strip():
        raise ValueError("Problem description cannot be empty.")

    prompt = f"""You are PrajaPulse, an assistant that refines citizen issue descriptions.
Rewrite the citizen's raw input into a clear, grammatical, and professional issue description suitable for civic authorities.

Rules:
- Preserve the exact meaning, location hints, and severity.
- Correct typos, grammar, and slang.
- Do NOT add imagined facts, dates, or causes.
- Return ONLY the improved description text.

Citizen's Raw Input:
{description.strip()}

Improved Description:"""

    return call_ollama_text(prompt)
