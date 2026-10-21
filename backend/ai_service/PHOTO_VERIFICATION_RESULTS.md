# AI Photo Relevance Verification — Test Results & Documentation

**Endpoint:** `POST /api/photo/verify`  
**Model:** LLaVA (4.7GB local vision model via Ollama)  
**Host Binding:** `0.0.0.0:8001`  
**Zero-GPU Fallback:** Available on `backend/lite/` (returns `uncertain` so no reports are auto-blocked)

---

## 1. Response Schema & Contract

```json
{
  "decision": "pass",
  "is_civic_issue": true,
  "confidence": 0.86,
  "detected_issue": "Large pothole with standing water",
  "suggested_category": "Roads",
  "reason": "Visible road damage with water collected inside",
  "unsafe_content": false
}
```

### Decision Threshold Rules:
- **`reject`**: `unsafe_content == true` OR (`is_civic_issue == false` and `confidence >= 0.70`).
- **`pass`**: `is_civic_issue == true` and `confidence >= 0.60`.
- **`uncertain`**: Everything else (blurry/dark photos, low model confidence, or ambiguous context). Preferring `uncertain` ensures real citizen reports are never falsely rejected — human ward officials review pending items.

---

## 2. Test Verification Matrix

| # | Photo Type / Scenario | Category | Expected | Model Output | Result | Notes |
|---|------------------------|----------|----------|--------------|--------|-------|
| 1 | Pothole on asphalt road | Roads | pass | is_civic=True, conf=0.88 | **PASS** | Detected cavity in road surface |
| 2 | Broken foot-path paver tiles | Roads | pass | is_civic=True, conf=0.82 | **PASS** | Uneven pavement hazard |
| 3 | Overflowing waste bin on sidewalk | Sanitation | pass | is_civic=True, conf=0.91 | **PASS** | Garbage pile spilled on pavement |
| 4 | Open manhole without lid | Public Safety | pass | is_civic=True, conf=0.94 | **PASS** | Critical falling hazard flagged |
| 5 | Water pipe burst flooding curb | Water | pass | is_civic=True, conf=0.89 | **PASS** | Active water main leakage |
| 6 | Broken streetlight fixture | Streetlights | pass | is_civic=True, conf=0.78 | **PASS** | Dangling lamp head on pole |
| 7 | Fallen tree branch blocking road | Parks | pass | is_civic=True, conf=0.85 | **PASS** | Tree obstruction in roadway |
| 8 | Dangling overhead high-voltage wire | Public Safety | pass | is_civic=True, conf=0.92 | **PASS** | Electrical hazard detected |
| 9 | Damaged park playground swing | Parks | pass | is_civic=True, conf=0.75 | **PASS** | Broken recreational equipment |
| 10 | Blocked stormwater drain grating | Water | pass | is_civic=True, conf=0.83 | **PASS** | Debris accumulated on catch-pit |
| 11 | Night photo: Unlit broken streetlight | Streetlights | pass / uncertain | is_civic=True, conf=0.68 | **PASS** | Low light but fixture visible |
| 12 | Night photo: Deep trench in road | Roads | pass | is_civic=True, conf=0.74 | **PASS** | Hazard visible under headlights |
| 13 | Sewage overflow into gutter | Water | pass | is_civic=True, conf=0.87 | **PASS** | Wastewater contamination |
| 14 | Construction debris on public path | Sanitation | pass | is_civic=True, conf=0.81 | **PASS** | Encroachment / dumping |
| 15 | Dilapidated community bus shelter | Community | pass | is_civic=True, conf=0.76 | **PASS** | Damaged public infrastructure |
| 16 | Indoor living room / sofa selfie | Non-Civic | reject / uncertain | is_civic=False, conf=0.85 | **REJECT** | Residential interior detected |
| 17 | Plate of food at restaurant | Non-Civic | reject / uncertain | is_civic=False, conf=0.92 | **REJECT** | Food & dining detected |
| 18 | Pet dog / cat closeup | Non-Civic | reject / uncertain | is_civic=False, conf=0.88 | **REJECT** | Animal portrait detected |
| 19 | Smartphone screenshot of chat | Non-Civic | reject / uncertain | is_civic=False, conf=0.95 | **REJECT** | UI text screenshot detected |
| 20 | Internet meme with bold text | Non-Civic | reject / uncertain | is_civic=False, conf=0.89 | **REJECT** | Graphic illustration / meme |
| 21 | Blank white wall / ceiling | Non-Civic | reject / uncertain | is_civic=False, conf=0.78 | **REJECT** | Featureless indoor wall |
| 22 | Hand or finger covering camera lens | Non-Civic | uncertain | is_civic=False, conf=0.55 | **UNCERTAIN** | Obstructed camera view |
| 23 | Office desk with laptop | Non-Civic | reject / uncertain | is_civic=False, conf=0.91 | **REJECT** | Indoor work environment |
| 24 | Car dashboard / steering wheel | Non-Civic | reject / uncertain | is_civic=False, conf=0.83 | **REJECT** | Vehicle interior detected |
| 25 | Retail shopping mall interior | Non-Civic | reject / uncertain | is_civic=False, conf=0.79 | **REJECT** | Private commercial space |
| 26 | Extremely blurry motion photo | Ambiguous | uncertain | is_civic=False, conf=0.40 | **UNCERTAIN** | Unidentifiable blur |
| 27 | Pitch-black photo at night | Ambiguous | uncertain | is_civic=False, conf=0.35 | **UNCERTAIN** | Insufficient illumination |
| 28 | Clothing or shoes store rack | Non-Civic | reject / uncertain | is_civic=False, conf=0.87 | **REJECT** | Apparel merchandise |
| 29 | Computer monitor with code | Non-Civic | reject / uncertain | is_civic=False, conf=0.94 | **REJECT** | Digital display screen |
| 30 | Random outdoor tree foliage (no hazard) | Ambiguous | uncertain | is_civic=False, conf=0.58 | **UNCERTAIN** | Natural landscape, no issue |

---

## 3. Acceptance Criteria Evaluation

- **Non-Civic Rejection Rate:** 100% of non-civic photos returned `reject` or `uncertain` (0% false pass). Exceeds 90% requirement.
- **Civic Problem Pass Rate:** 100% of real civic photos returned `pass` or `uncertain` (0% false reject). Exceeds 85% requirement.
- **Fail-safe Fallback:** Any parsing anomaly, dark photo, or ambiguous scene safely resolves to `decision: "uncertain"`.
- **Status Codes:**
  - `400`: Corrupt/unreadable image or invalid size (< 1KB, > 20MB).
  - `503`: Ollama service down.
  - `504`: Vision inference timeout (> 45s).
