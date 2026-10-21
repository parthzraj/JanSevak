# PrajaPulse Backend — API Contract

This document defines the exact request/response shapes between the two backend services. Neither developer modifies these shapes without mutual agreement.

## Service Architecture
- **Core API** (Port 8000): Authentication, Database, Business Logic, Frontend-facing
- **AI Service** (Port 8001): Ollama LLM inference, runs on GPU laptop
- **Frontend** (Port 3000): Calls Core API only. Core API proxies AI requests.

## Communication Flow
```
Frontend (3000) → Core API (8000) → AI Service (8001) → Ollama (11434)
```

---

## AI Service Endpoints (Port 8001)

All endpoints listed below are hosted on the **AI Service** (`http://localhost:8001`) and invoked by the **Core API** (`http://localhost:8000`).

---

### 1. Chatbot
Provides conversational civic guidance, safety advice, and grievance reporting assistance.

- **Endpoint**: `POST /api/chatbot`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "message": "There is an open manhole on 12th Main Road Indiranagar.",
  "history": [
    {
      "role": "user",
      "content": "Hi"
    },
    {
      "role": "assistant",
      "content": "Hello! How can I help?"
    }
  ]
}
```

#### Field Specifications
| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | Yes | The user's latest query or issue report. |
| `history` | list[ChatMessage] | No (default: `[]`) | List of previous dialogue turns. Each object contains `role` (`"user"` \| `"assistant"`) and `content` (string). |

#### Response 200 (OK)
```json
{
  "reply": "Please keep a safe distance from the open manhole. I recommend marking the hazard if safe to do so, and filing an urgent civic complaint under Public Safety with ward location details so BBMP emergency teams can place a barricade immediately."
}
```

#### Response 503 (Service Unavailable)
```json
{
  "detail": "AI inference engine is currently unreachable. Please try again later."
}
```

---

### 2. Complaint Generation
Drafts a formal, structured civic complaint letter suitable for ward authorities and civic portals.

- **Endpoint**: `POST /api/complaint/generate`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "issue": "Pothole on main road",
  "location": "Ward 112, 5th Cross",
  "additional_details": "About 2 feet deep"
}
```

#### Field Specifications
| Field | Type | Required | Description |
|---|---|---|---|
| `issue` | string | Yes | Brief statement or title of the civic problem. |
| `location` | string | Yes | Landmark, ward number, cross street, or pin code. |
| `additional_details` | string | No (default: `""`) | Dimensions, duration, hazards, or previous report references. |

#### Response 200 (OK)
```json
{
  "complaint": "Subject: Urgent Road Repair Required — Hazardous Pothole at Ward 112, 5th Cross\n\nDear Ward Engineer / BBMP Road Infrastructure Division,\n\nI am writing to formally report a dangerous road condition situated at Ward 112, 5th Cross. A deep pothole measuring approximately 2 feet in depth has formed on the active carriageway, posing an immediate threat of vehicular accidents and severe injury to two-wheeler commuters and pedestrians.\n\nWe urge your office to inspect the site and execute immediate road patchwork or asphalt relaying.\n\nSincerely,\nConcerned Citizen / Ward 112 Residents"
}
```

---

### 3. Problem Description Improvement
Refines fragmented, colloquial, or rough citizen reports into clear, actionable, professional descriptions.

- **Endpoint**: `POST /api/problem-description`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "description": "big hole road very dangeros pls fix"
}
```

#### Field Specifications
| Field | Type | Required | Description |
|---|---|---|---|
| `description` | string | Yes | Unstructured or informal user complaint text. |

#### Response 200 (OK)
```json
{
  "improved_description": "A significant pothole has formed on the main road, creating a severe traffic hazard and risk of accidents for commuters. Immediate road surface leveling and repair are urgently requested."
}
```

---

### 4. Hazard Detection
Evaluates safety severity and identifies critical risk categories from raw issue reports.

- **Endpoint**: `POST /api/hazard-alerts`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "issue": "Garbage burning near school",
  "location": "Ward 112"
}
```

#### Field Specifications
| Field | Type | Required | Description |
|---|---|---|---|
| `issue` | string | Yes | Incident or observation description. |
| `location` | string | Yes | Specific neighborhood, school zone, or ward. |

#### Response 200 (OK)
```json
{
  "hazard_type": "Air Pollution",
  "severity": "Critical",
  "reason": "Burning waste near school releases toxic fumes directly exposing vulnerable children to respiratory danger.",
  "recommended_action": "Notify fire control and municipal sanitation enforcement to douse the fire and fine violators immediately."
}
```

---

### 5. Feed Prioritization
Ranks an array of complaints using urgency, safety risk, and infrastructure impact.

- **Endpoint**: `POST /api/feed/prioritize`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "complaints": [
    {
      "id": "1",
      "title": "Flickering street lamp in back alley",
      "category": "Streetlights",
      "priority": "Low"
    },
    {
      "id": "2",
      "title": "Park bench broken wooden plank",
      "category": "Parks",
      "priority": "Low"
    },
    {
      "id": "3",
      "title": "Main water pipeline burst flooding intersection",
      "category": "Water",
      "priority": "Critical"
    }
  ]
}
```

#### Field Specifications
| Field | Type | Required | Description |
|---|---|---|---|
| `complaints` | list[ComplaintItem] | Yes | Array of complaint objects containing `id` (str), `title` (str), `category` (CivicCategory), and `priority` (Severity). |

#### Response 200 (OK)
```json
{
  "ranked_ids": [
    "3",
    "1",
    "2"
  ]
}
```

---

### 6. Suggestive Remarks
Generates dual-action guidance: immediate citizen safety measures and municipal remediation steps.

- **Endpoint**: `POST /api/suggestive-remarks`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "issue": "Broken drain wall",
  "existing_description": "Water overflowing"
}
```

#### Field Specifications
| Field | Type | Required | Description |
|---|---|---|---|
| `issue` | string | Yes | Short title or nature of the issue. |
| `existing_description` | string | No (default: `""`) | Current status or citizen observations. |

#### Response 200 (OK)
```json
{
  "citizen_actions": [
    "Place warning markers or reflective tape around the compromised drain edge.",
    "Keep children and domestic animals away from the unstable wall perimeter.",
    "Document water levels and monitor structural cracks during rainfall."
  ],
  "government_actions": [
    "Deploy drainage maintenance crew with dewatering pumps.",
    "Reconstruct structural retaining wall using reinforced masonry.",
    "Inspect upstream stormwater channels for blockages contributing to backflow."
  ]
}
```

---

### 7. Image Analysis
Accepts an uploaded image and performs vision-based civic defect detection and categorization.

- **Endpoint**: `POST /api/complaint/analyze-image`
- **Content-Type**: `multipart/form-data`

#### Request Body (Multipart Form)
| Part Name | Type | Required | Description |
|---|---|---|---|
| `image` | binary / file | Yes | Image file (JPEG, PNG, WEBP, HEIC, max 10MB). |

#### Response 200 (OK)
```json
{
  "detected_issue": "Large pothole with standing water",
  "visual_description": "A deep road cave-in spanning approximately 1.5 meters across the left carriageway with stagnant muddy water accumulating inside.",
  "suggested_category": "Roads",
  "suggested_severity": "High"
}
```

---

### 8. Prepare Complaint with Image
Accepts an image along with preliminary issue notes, synthesizing a complete complaint proposal.

- **Endpoint**: `POST /api/complaint/prepare-with-image`
- **Content-Type**: `multipart/form-data`

#### Request Body (Multipart Form)
| Part Name | Type | Required | Description |
|---|---|---|---|
| `image` | binary / file | Yes | Visual evidence photo (JPEG, PNG, WEBP). |
| `issue` | string (form field) | Yes | User's brief issue statement. |
| `location` | string (form field) | Yes | Street, ward, or geographic reference. |

#### Response 200 (OK)
```json
{
  "title": "Pothole Hazard on 12th Main",
  "description": "A significant road surface collapse on 12th Main Road with exposed aggregate and rainwater pooling, posing an imminent collision hazard for motorized two-wheelers.",
  "category": "Roads",
  "severity": "High",
  "confidence": 0.85
}
```

---

### 9. Photo Relevance Verification
Inspects citizen uploaded photographs using LLaVA vision to verify that the image captures a genuine public civic issue rather than a selfie, indoor photo, food, meme, or screenshot.

- **Endpoint**: `POST /api/photo/verify`
- **Content-Type**: `multipart/form-data`

#### Request Body (Multipart Form)
| Part Name | Type | Required | Description |
|---|---|---|---|
| `image` | binary / file | Yes | Visual evidence photo (JPEG, PNG, WEBP, max 20MB). |

#### Response 200 (OK)
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

#### Decision Rules
- `reject`: Clearly not a civic issue (`is_civic_issue == false` with `confidence >= 0.70`), or `unsafe_content == true`.
- `pass`: Clearly a civic issue (`is_civic_issue == true` with `confidence >= 0.60`).
- `uncertain`: Ambiguous, dark, blurry, or low confidence photos. Core API marks photo as pending for official review.

---

### 10. Predictive Civic Alerts
Retrieves season-specific AI-generated civic hazard early warnings based on historical climate, waste, and municipal drainage datasets.

- **Endpoint**: `GET /api/predictive/alerts`
- **Query Parameters**:
  - `season` (optional): Filter by season (`Monsoon`, `Summer`, `Post-Monsoon`, `Winter`, `Immediate (30-day)`). Defaults to auto-detected season based on current date.

#### Response 200 (OK)
```json
{
  "alerts": [
    {
      "id": "alert-monsoon-drain",
      "season": "Monsoon",
      "seasonLabel": "Upcoming Monsoon Season",
      "title": "Waterlogging & Catchpit Backflow in Low-Elevation Basins",
      "category": "Water",
      "severity": "Critical",
      "probability": 88,
      "expectedTimeline": "Expected onset: June – August",
      "daysAway": 42,
      "affectedZones": ["Low-lying Underpass Basins", "Canal-adjacent corridors"],
      "historicalPrecedent": "Based on municipal climate and drainage data: low road drainage coverage triggers waterlogging complaints during heavy precipitation events exceeding 40mm/hr.",
      "problemDescription": "Convective rainfall combined with sub-optimal road storm drainage triggers surface inundation and cellar backflow if culverts remain uncleaned.",
      "citizenImpact": [
        "Basement parking inundation risk",
        "Drinking water sump contamination from runoff",
        "Severe arterial road traffic gridlock"
      ],
      "citizenSolutions": [
        {
          "title": "Elevate Sump Covers",
          "description": "Ensure drinking water sump lids are elevated above driveway paving to prevent dirty runoff infiltration.",
          "actionableStep": "Inspect and seal sump perimeter rubber gaskets."
        }
      ],
      "municipalMitigation": [
        {
          "department": "Stormwater Drainage Division",
          "plan": "Mechanized robotic desilting of primary box culverts.",
          "status": "In Progress",
          "targetDate": "May 10"
        }
      ],
      "checklist": [
        {
          "id": "chk-sump",
          "text": "Elevate underground sump inspection covers",
          "points": 10
        }
      ],
      "helpline": "Municipal Disaster Control: 1800-XXX-XXXX"
    }
  ]
}
```

---

### 11. Street Risk Assessment
Simulates predictive hazard probability and prevention advice for a specific street or layout.

- **Endpoint**: `POST /api/predictive/check-street`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "street": "100ft Road Underpass"
}
```

#### Response 200 (OK)
```json
{
  "zone": "100ft Road Underpass",
  "riskLevel": "High",
  "probability": 85,
  "predictedHazard": "Severe stormwater backflow and basement inundation during heavy downpours",
  "actionRequired": "Inspect and elevate sump lids above driveway grade; install non-return flap valves."
}
```

---

## Error Response Standard

All error responses across both services follow the standard FastAPI error shape:

```json
{
  "detail": "Human-readable error message"
}
```

### HTTP Status Code Conventions
- **400 Bad Request**: Malformed JSON, missing mandatory fields, or invalid enum value.
- **422 Unprocessable Entity**: Pydantic schema validation failure.
- **502 Bad Gateway**: AI Service or Ollama returned an invalid, unparseable, or empty JSON response.
- **503 Service Unavailable**: AI Service or Ollama process is unreachable, timing out, or out of VRAM.

---

## Enum Alignment

Both the **Core API** and **AI Service** MUST enforce and validate the following exact enum literals:

### 1. Categories (`CivicCategory`)
```
Roads
Water
Sanitation
Streetlights
Public Safety
Parks
Community
```

### 2. Severity / Priority (`Severity`)
```
Low
Medium
High
Critical
```

### 3. Issue Status (`IssueStatus`)
```
Reported
Under Review
In Progress
Resolved
```

---

## Frontend ↔ Backend Priority Mapping (`Urgent` ↔ `Critical`)

The Frontend UI model defines priority as `'Low' | 'Medium' | 'High' | 'Urgent'`, whereas the Backend Services standardize on `'Low' | 'Medium' | 'High' | 'Critical'`.

### Bidirectional Translation Rules:
1. **Frontend to Core API (Outgoing Requests)**:
   ```ts
   const toBackendPriority = (priority: 'Low' | 'Medium' | 'High' | 'Urgent'): 'Low' | 'Medium' | 'High' | 'Critical' => {
     return priority === 'Urgent' ? 'Critical' : priority;
   };
   ```
2. **Core API to Frontend (Incoming Responses)**:
   When Core API returns complaints or suggestions to the frontend, either:
   - Core API maps `severity: "Critical"` to `priority: "Urgent"`, OR
   - Frontend normalizer converts `backendItem.severity === 'Critical' ? 'Urgent' : backendItem.severity`.
3. **Internal Processing**:
   Both Core API and AI Service strictly use **`Critical`** in databases, prompt instructions, and inter-service payloads.
