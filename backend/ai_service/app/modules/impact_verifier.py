"""AI Impact Reel Verification and Community Impact Classifier.

Analyzes resolved civic issues with before & after photos to determine:
1. Civic Niche: Is this public civic infrastructure or non-civic content (cooking, selfies, memes, pets)?
2. Location & Context Consistency: Are before and after photos from the same physical site?
3. Community Impact & Scale: Is this transformational civic redressal or routine/trivial roadside sweeping?
"""

import base64
import json
import logging
import re
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image, ImageDraw

from app import config
from app.modules.ollama_client import call_ollama_vision

logger = logging.getLogger(__name__)

# Valid civic categories
CIVIC_CATEGORIES = {
    "Roads",
    "Water",
    "Sanitation",
    "Streetlights",
    "Public Safety",
    "Parks",
    "Community",
    "Drainage",
    "Environment",
}

# Non-civic niche keywords (cooking, pets, selfies, memes, gaming, ecommerce)
NON_CIVIC_KEYWORDS = {
    "cook", "cooking", "recipe", "kitchen", "dish", "curry", "paneer", "roti", "biryani",
    "chicken", "food", "tasty", "delicious", "restaurant", "baking", "cake", "snack",
    "selfie", "outfit", "makeup", "ootd", "fashion", "haircut", "portrait",
    "meme", "funny", "joke", "prank", "tiktok", "dance", "gaming", "gameplay", "pubg",
    "pet", "puppy", "dog", "cat", "kitten", "kitten playing", "aquarium", "zoo",
    "shopping", "unboxing", "discount", "sale", "crypto", "trading", "movie", "cinema",
    "vacation", "resort", "hotel", "beach sunset",
}

# Transformational & High Impact civic keywords
HIGH_IMPACT_KEYWORDS = {
    "mass drive", "mass cleanup", "mega drive", "campaign", "volunteer", "volunteers",
    "dumpsite", "dump yard", "blackspot", "black spot", "chronic dump", "multi-ton", "tons of waste",
    "sinkhole", "crater", "road collapse", "arterial road", "overhaul", "reconstruction", "re-paved",
    "waterlogging", "flood mitigation", "drain desilting", "culvert rebuilt", "stormwater overhaul",
    "embankment", "reclaimed", "rejuvenation", "park restoration", "playground makeover",
    "exposed wiring", "transformer", "hazard eliminated", "saplings planted", "beautification",
    "community garden", "wall art", "sanitation drive", "100+ citizens", "ward milestone",
    "resurfaced entire stretch", "longstanding hazard", "culvert", "junction redesign",
}

# Routine / Low Impact keywords that do NOT qualify for Impact Reels
ROUTINE_KEYWORDS = {
    "daily sweeping", "swept road", "swept dust", "routine sweeping", "swept sidewalk",
    "broomed", "broom sweep", "routine janitorial", "picked few leaves", "picked a bottle",
    "regular sweep", "daily dusting", "minor sweeping", "front yard sweep", "brooming",
    "just cleaning", "regular cleaning", "normal cleaning", "routine cleaning",
    "regular cleaning of roadside", "cleaning of roadside garbage", "roadside garbage cleaning",
    "just regular cleaning", "minor garbage pick", "picked some garbage", "swept garbage",
}


def _create_side_by_side_composite(before_bytes: bytes, after_bytes: bytes) -> Tuple[bytes, str]:
    """Combine before and after images side-by-side with clear label headers for vision model."""
    try:
        img_b = Image.open(BytesIO(before_bytes)).convert("RGB")
        img_a = Image.open(BytesIO(after_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Could not decode before or after image: {e}")

    # Standardize height to 480px while maintaining aspect ratio (cap width to 600px)
    target_h = 480
    def resize_img(im: Image.Image) -> Image.Image:
        w, h = im.size
        ratio = target_h / float(h)
        new_w = min(600, max(240, int(w * ratio)))
        return im.resize((new_w, target_h), Image.Resampling.LANCZOS)

    img_b_resized = resize_img(img_b)
    img_a_resized = resize_img(img_a)

    header_h = 36
    divider_w = 6
    total_w = img_b_resized.width + divider_w + img_a_resized.width
    total_h = target_h + header_h

    # Create canvas
    canvas = Image.new("RGB", (total_w, total_h), color=(15, 23, 42))  # slate-900
    draw = ImageDraw.Draw(canvas)

    # Paste images
    canvas.paste(img_b_resized, (0, header_h))
    canvas.paste(img_a_resized, (img_b_resized.width + divider_w, header_h))

    # Draw divider line
    draw.rectangle(
        [(img_b_resized.width, 0), (img_b_resized.width + divider_w, total_h)],
        fill=(234, 88, 12),  # orange-600 accent
    )

    # Text headers
    draw.text((12, 10), "BEFORE: REPORTED GRIEVANCE", fill=(254, 205, 211))  # rose-200
    draw.text((img_b_resized.width + divider_w + 12, 10), "AFTER: CIVIC RESOLUTION", fill=(187, 247, 208))  # green-200

    buf = BytesIO()
    canvas.save(buf, format="JPEG", quality=88)
    composite_bytes = buf.getvalue()
    b64 = base64.b64encode(composite_bytes).decode("ascii")
    return composite_bytes, b64


def _check_image_identical(img1_bytes: bytes, img2_bytes: bytes) -> bool:
    """Detect if before and after photos are identical duplicate files."""
    if img1_bytes == img2_bytes:
        return True
    try:
        im1 = Image.open(BytesIO(img1_bytes)).convert("L").resize((32, 32))
        im2 = Image.open(BytesIO(img2_bytes)).convert("L").resize((32, 32))
        diff = sum(abs(p1 - p2) for p1, p2 in zip(im1.getdata(), im2.getdata()))
        avg_diff = diff / (32 * 32)
        return avg_diff < 3.0  # virtually indistinguishable
    except Exception:
        return False


def _heuristic_analysis(
    title: str,
    category: str,
    description: str,
    resolution_note: str,
    has_before: bool = False,
    has_after: bool = False,
    is_identical: bool = False,
) -> Dict[str, Any]:
    """Fast, deterministic semantic & metadata classifier used standalone or as fallback."""
    full_text = f"{title} {category} {description} {resolution_note}".lower()

    rejection_reasons: List[str] = []

    # 1. Non-civic keyword check
    found_non_civic = [w for w in NON_CIVIC_KEYWORDS if re.search(rf"\b{re.escape(w)}\b", full_text)]
    is_civic = len(found_non_civic) == 0

    if not is_civic:
        rejection_reasons.append(
            f"Non-Civic Content: Reel topic appears unrelated to public municipal infrastructure (flagged: {', '.join(found_non_civic[:3])})."
        )

    # 2. Location match / Context check
    river_lake = any(w in resolution_note.lower() for w in ["river", "lake", "ocean", "beach", "mountain", "bedroom", "kitchen", "living room"])
    street_waste = any(w in f"{title} {description}".lower() for w in ["garbage", "dump", "pothole", "manhole", "sewage", "street", "road", "pavement", "curb"])
    legit_water_remedy = any(w in resolution_note.lower() for w in ["river cleaning", "riverfront", "lake rejuvenation", "water body", "culvert", "drain"])

    if is_identical:
        is_location_match = False
        rejection_reasons.append("Identical Images: 'Before' and 'After' photos appear identical; no visible resolution work demonstrated.")
    elif river_lake and street_waste and not legit_water_remedy:
        is_location_match = False
        rejection_reasons.append("Location Mismatch: 'Before' photo shows street grievance while 'After' shows an unrelated scene (river/nature/interior).")
    else:
        is_location_match = True

    # 3. Community Impact & Scale check
    found_high = [w for w in HIGH_IMPACT_KEYWORDS if re.search(rf"\b{re.escape(w)}\b", full_text)]
    found_routine = [w for w in ROUTINE_KEYWORDS if re.search(rf"\b{re.escape(w)}\b", full_text)]

    # If it's a routine/regular cleaning and NOT a mass drive or major infrastructure project:
    is_routine_maintenance = bool(found_routine and not found_high)

    # Also detect plain brief notes like "cleaned garbage" or "swept the street"
    brief_note = len(resolution_note.strip().split()) <= 4 and any(w in resolution_note.lower() for w in ["clean", "cleaned", "swept", "done", "fixed"])
    if brief_note and not found_high:
        is_routine_maintenance = True

    if is_routine_maintenance:
        score = 35
        tier = "Routine / Low"
        rejection_reasons.append(
            "Routine / Trivial Maintenance: Impact Reels require transformational community achievements, mass drives, or major repairs. Daily routine sweeping does not qualify."
        )
    else:
        score = 65  # standard civic resolution default
        if found_high:
            score += min(30, len(found_high) * 12)
        if len(resolution_note.strip()) > 60:
            score += 8
        if category in {"Sanitation", "Roads", "Drainage", "Public Safety"}:
            score += 5

        score = max(50, min(98, score))

        if score >= 80:
            tier = "Transformational"
        elif score >= 65:
            tier = "Significant"
        else:
            tier = "Moderate"

    # Final verdict
    if is_civic and is_location_match and tier != "Routine / Low" and score >= 50:
        verdict = "approved"
        reason = f"Verified {tier.lower()} civic redressal: Demonstrates meaningful public transformation with matching location context."
    else:
        verdict = "rejected"
        reason = " | ".join(rejection_reasons) if rejection_reasons else "Does not meet community impact requirements."

    # Badges
    badges = []
    if tier == "Transformational":
        badges.extend(["Transformational Milestone", "High Impact Drive"])
    elif tier == "Significant":
        badges.append("Verified Civic Fix")
    if found_high:
        badges.append("Community Campaign")

    return {
        "verdict": verdict,
        "is_civic_niche": is_civic,
        "is_location_match": is_location_match,
        "impact_score": score,
        "impact_tier": tier,
        "confidence": 0.88,
        "reason": reason,
        "rejection_reasons": rejection_reasons,
        "key_transformation": f"{category} issue resolved with verifiable improvements." if is_civic else "Non-civic subject.",
        "community_takeaway": (
            "Proactive citizen reporting combined with rapid civic redressal sets a high standard for neighborhood upkeep."
            if is_civic else "Share civic infrastructure stories to inspire community participation."
        ),
        "suggested_badges": badges,
    }


def verify_impact_reel(
    before_image_bytes: Optional[bytes] = None,
    after_image_bytes: Optional[bytes] = None,
    title: str = "",
    category: str = "",
    description: str = "",
    resolution_note: str = "",
    timeout: int = 35,
) -> Dict[str, Any]:
    """Verify an impact reel's before & after images and civic impact using LLaVA vision + NLP heuristic."""
    has_before = bool(before_image_bytes and len(before_image_bytes) >= config.MIN_IMAGE_SIZE_BYTES)
    has_after = bool(after_image_bytes and len(after_image_bytes) >= config.MIN_IMAGE_SIZE_BYTES)

    is_identical = False
    if has_before and has_after:
        is_identical = _check_image_identical(before_image_bytes, after_image_bytes)

    # First run the fast heuristic evaluation
    heuristic = _heuristic_analysis(
        title=title,
        category=category,
        description=description,
        resolution_note=resolution_note,
        has_before=has_before,
        has_after=has_after,
        is_identical=is_identical,
    )

    # If it's blatantly non-civic from text, or location mismatch, or routine maintenance, return immediately
    if not heuristic["is_civic_niche"] or not heuristic["is_location_match"] or heuristic["impact_tier"] == "Routine / Low":
        return heuristic

    # If we don't have both images, return the heuristic directly
    if not (has_before and has_after):
        return heuristic

    if is_identical:
        return heuristic

    # We have both images: build side-by-side composite and query Ollama LLaVA
    try:
        _, composite_b64 = _create_side_by_side_composite(before_image_bytes, after_image_bytes)

        prompt = f"""You are an expert civic auditing and community impact classification system.
You are inspecting a side-by-side composite image:
- The LEFT image is labeled "BEFORE": the reported civic grievance.
- The RIGHT image is labeled "AFTER": the claimed civic resolution.

Context:
Title: {title}
Category: {category}
Grievance Description: {description}
Resolution Note: {resolution_note}

Strictly evaluate 3 criteria:

1. CIVIC NICHE CHECK:
- Does this belong to civic/municipal infrastructure or public welfare (potholes, roads, garbage dumps, solid waste, water leakage, sewage, streetlights, public parks, drain desilting)?
- Is it NON-CIVIC (cooking/recipes, food dishes, selfies, pets, memes, dancing, gaming, personal indoor furniture)? If non-civic, set is_civic_niche to false.

2. LOCATION & SCENE CONSISTENCY:
- Do the BEFORE and AFTER images represent the SAME physical location or scene?
- Look for matching physical landmarks: buildings, road curvature, curbs, wall textures, utility poles, fences.
- If BEFORE is a garbage pile on a street and AFTER is a random river, lake, meme, or completely different room/road, set is_location_match to false.

3. COMMUNITY IMPACT & TRANSFORMATION DEPTH:
- Evaluate whether this is a SIGNIFICANT / TRANSFORMATIONAL civic improvement versus TRIVIAL / ROUTINE maintenance.
- Transformational (80-100 score): Major illegal dumpsite cleared, mass cleanliness drive with community/volunteers, crater/sinkhole reconstruct, arterial road rebuild, storm drain unclogged preventing flooding, reclaimed public ground.
- Significant (65-79 score): Substantial pothole repair, fixed bursting water pipe, restored series of streetlights.
- Routine / Low (<50 score): Routine street sweeping, regular broom sweeping of roadside dust, picking up two leaves, standard daily municipal sweep with no learning or inspiring value for community reels.

Respond with ONLY valid JSON (no markdown formatting, no other text):
{{
  "is_civic_niche": true,
  "is_location_match": true,
  "impact_score": 85,
  "impact_tier": "Transformational",
  "verdict": "approved",
  "rejection_reasons": [],
  "reason": "1-2 sentence assessment",
  "key_transformation": "short summary of visible work done",
  "community_takeaway": "educational or inspiring takeaway for citizens",
  "suggested_badges": ["Community Milestone", "Mass Drive"]
}}"""

        raw = call_ollama_vision(prompt, composite_b64, timeout=timeout)
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw)

        match = re.search(r"\{[^{}]*\}", raw, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            is_civic = bool(parsed.get("is_civic_niche", True))
            is_loc_match = bool(parsed.get("is_location_match", True))
            score = int(parsed.get("impact_score", heuristic["impact_score"]))
            score = max(0, min(100, score))
            tier = str(parsed.get("impact_tier", "Significant")).strip()
            reasons = parsed.get("rejection_reasons", [])
            if not isinstance(reasons, list):
                reasons = [str(reasons)]

            # Check if LLM marked low impact or routine
            if score < 50 or "routine" in tier.lower():
                tier = "Routine / Low"
                if "Routine / Trivial Maintenance" not in " ".join(reasons):
                    reasons.append("Routine / Trivial Maintenance: Impact Reels are reserved for transformational civic milestones and mass drives.")

            if not is_civic:
                reasons.append("Non-Civic Content: Reel does not match municipal or public infrastructure domain.")
            if not is_loc_match:
                reasons.append("Location Mismatch: 'Before' and 'After' photos appear to be from different locations.")

            verdict = "approved" if (is_civic and is_loc_match and score >= 50 and tier != "Routine / Low") else "rejected"

            badges = parsed.get("suggested_badges", heuristic["suggested_badges"])
            if not isinstance(badges, list):
                badges = [str(badges)]

            return {
                "verdict": verdict,
                "is_civic_niche": is_civic,
                "is_location_match": is_loc_match,
                "impact_score": score,
                "impact_tier": tier,
                "confidence": 0.92,
                "reason": str(parsed.get("reason", heuristic["reason"])),
                "rejection_reasons": reasons,
                "key_transformation": str(parsed.get("key_transformation", heuristic["key_transformation"])),
                "community_takeaway": str(parsed.get("community_takeaway", heuristic["community_takeaway"])),
                "suggested_badges": badges,
            }

    except Exception as e:
        logger.warning("Vision-based impact verification fell back to heuristic: %s", e)

    # Return reliable heuristic if vision model timed out or had JSON issues
    return heuristic
