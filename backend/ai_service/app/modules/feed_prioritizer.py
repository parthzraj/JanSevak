import json
from typing import List, Dict, Any
from app.modules.ollama_client import call_ollama_json


def prioritize_complaints(complaints: List[Dict[str, Any]]) -> List[str]:
    """Rank complaints by urgency, returning the list of complaint IDs in descending urgency order."""
    if not complaints:
        return []
    if len(complaints) > 20:
        raise ValueError("Too many complaints. Maximum 20 at a time.")

    # Normalize original IDs to string to prevent int-str mismatch bugs
    original_ids = [str(c.get("id")) for c in complaints if "id" in c]
    if not original_ids:
        raise ValueError("Every complaint must contain an 'id' field.")
    for c in complaints:
        if "title" not in c:
            raise ValueError("Every complaint must contain a 'title' field.")

    truncated = []
    for c in complaints:
        tc = {**c}
        if "description" in tc and len(str(tc["description"])) > 100:
            tc["description"] = str(tc["description"])[:100] + "..."
        truncated.append(tc)

    prompt = f"""You are PrajaPulse, a civic prioritization assistant.
Rank the following complaints from highest to lowest urgency based on public safety, life risk, and disruption impact.

Complaints list:
{json.dumps(truncated, ensure_ascii=False)}

Rules:
- High priority to: open manholes, live wires, flooding, water contamination, major traffic blocks.
- Lower priority to: routine litter, minor cracks, cosmetic issues.
- Return ONLY valid JSON in this exact structure:
{{
  "ranked_ids": ["id1", "id2", ...]
}}
- You MUST include every provided ID exactly once. Use string IDs.
"""

    result = call_ollama_json(prompt, max_retries=2)
    raw_ranked = result.get("ranked_ids", [])

    if not isinstance(raw_ranked, list):
        raise ValueError("AI did not return a valid list of ranked_ids.")

    # Normalize returned IDs to string
    ranked_str_ids = [str(x).strip() for x in raw_ranked]

    # Verify that all original IDs are present
    if set(ranked_str_ids) != set(original_ids):
        # Fallback: keep AI order for valid IDs, append any missing original IDs at the end
        valid_ranked = [i for i in ranked_str_ids if i in set(original_ids)]
        missing = [i for i in original_ids if i not in set(valid_ranked)]
        ranked_str_ids = valid_ranked + missing

    return ranked_str_ids
