import csv
import datetime
import logging
import os
import re
from typing import Any, Dict, List, Optional
from app.modules.ollama_client import call_ollama_json

logger = logging.getLogger(__name__)

# Civic categories and severity levels
VALID_CATEGORIES = ["Roads", "Water", "Sanitation", "Streetlights", "Public Safety", "Parks", "Community"]
VALID_SEVERITIES = ["Critical", "High", "Moderate", "Advisory"]
VALID_STATUSES = ["Scheduled", "In Progress", "Completed"]


def _sanitize_text(text: str) -> str:
    """Sanitize any city-specific naming to generic city terms."""
    if not isinstance(text, str):
        text = str(text)
    # Remove any forbidden regional terms defensively
    scrubbed = re.sub(r'(?i)pune\s*university', 'Central University', text)
    scrubbed = re.sub(r'(?i)pune', 'Metro', scrubbed)
    return scrubbed


# ---------------------------------------------------------------------------
# Module-level Dataset Loading & Seasonal Knowledge Base
# ---------------------------------------------------------------------------
def _load_csv_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    data_dir = os.path.join(base_dir, "data")

    climate_stats = {
        "avg_rainfall": 820.0,
        "max_rainfall": 1411.0,
        "avg_max_temp": 41.2,
        "peak_temp": 43.0,
        "min_temp": 2.8,
    }
    waste_stats = {
        "total_waste_tpd": 1250.0,
        "top_waste_zones": ["Deccan Gymkhana", "Kothrud", "Dhole Patil", "Hadapsar"],
        "zone_waste": {},
    }
    drainage_stats = {
        "avg_drainage_pct": 46.5,
        "low_drainage_wards": ["Vadgaon Sheri (1.8%)", "Bopodi Gaonthan (3.6%)", "Viman Nagar (6.0%)"],
        "records": [],
    }
    disposal_stats = {
        "primary_facility": "Central Processing and SLF Facility",
        "capacity_tpd": 350.0,
    }

    # 1. Climate data
    climate_path = os.path.join(data_dir, "climate_data.csv")
    if os.path.exists(climate_path):
        try:
            rainfalls = []
            max_temps = []
            min_temps = []
            with open(climate_path, "r", encoding="utf-8-sig", errors="ignore") as f:
                reader = csv.reader(f)
                _ = next(reader, None)  # Skip header
                for row in reader:
                    if len(row) >= 4:
                        try:
                            if row[1].strip():
                                max_temps.append(float(row[1].strip()))
                            if row[2].strip():
                                min_temps.append(float(row[2].strip()))
                            if row[3].strip():
                                rainfalls.append(float(row[3].strip()))
                        except (ValueError, IndexError):
                            continue
            if rainfalls:
                climate_stats["avg_rainfall"] = round(sum(rainfalls) / len(rainfalls), 1)
                climate_stats["max_rainfall"] = round(max(rainfalls), 1)
            if max_temps:
                climate_stats["avg_max_temp"] = round(sum(max_temps) / len(max_temps), 1)
                climate_stats["peak_temp"] = round(max(max_temps), 1)
            if min_temps:
                climate_stats["min_temp"] = round(min(min_temps), 1)
        except Exception as e:
            logger.warning("Could not read climate_data.csv: %s", e)
    else:
        logger.warning("climate_data.csv not found at %s, using baseline defaults", climate_path)

    # 2. Waste management data
    waste_path = os.path.join(data_dir, "waste_management.csv")
    if os.path.exists(waste_path):
        try:
            total_waste = 0.0
            zone_totals = {}
            current_zone = "Central"
            with open(waste_path, "r", encoding="utf-8-sig", errors="ignore") as f:
                reader = csv.reader(f)
                _ = next(reader, None)
                for row in reader:
                    if len(row) >= 5:
                        zone_cell = _sanitize_text(row[1].strip())
                        if zone_cell:
                            current_zone = zone_cell
                        try:
                            qty = float(row[4].strip())
                            total_waste += qty
                            zone_totals[current_zone] = zone_totals.get(current_zone, 0.0) + qty
                        except (ValueError, IndexError):
                            continue
            if total_waste > 0:
                waste_stats["total_waste_tpd"] = round(total_waste, 1)
                waste_stats["zone_waste"] = zone_totals
                sorted_zones = sorted(zone_totals.items(), key=lambda x: x[1], reverse=True)
                waste_stats["top_waste_zones"] = [z[0] for z in sorted_zones[:4]]
        except Exception as e:
            logger.warning("Could not read waste_management.csv: %s", e)
    else:
        logger.warning("waste_management.csv not found at %s", waste_path)

    # 3. Stormwater drainage data
    drainage_path = os.path.join(data_dir, "stormwater_drainage.csv")
    if os.path.exists(drainage_path):
        try:
            percentages = []
            low_wards = []
            drain_records = []
            with open(drainage_path, "r", encoding="utf-8-sig", errors="ignore") as f:
                reader = csv.reader(f)
                _ = next(reader, None)
                for row in reader:
                    if len(row) >= 4:
                        area = _sanitize_text(row[1].strip())
                        prabhag = _sanitize_text(row[2].strip())
                        try:
                            pct = float(row[3].strip())
                            percentages.append(pct)
                            drain_records.append({"area": area, "prabhag": prabhag, "percentage": pct})
                            if pct < 20.0:
                                low_wards.append(f"{prabhag} ({pct}%)")
                        except (ValueError, IndexError):
                            continue
            if percentages:
                drainage_stats["avg_drainage_pct"] = round(sum(percentages) / len(percentages), 1)
                drainage_stats["low_drainage_wards"] = low_wards[:5]
                drainage_stats["records"] = drain_records
        except Exception as e:
            logger.warning("Could not read stormwater_drainage.csv: %s", e)
    else:
        logger.warning("stormwater_drainage.csv not found at %s", drainage_path)

    # 4. Drainage connections data
    conn_path = os.path.join(data_dir, "drainage_connections.csv")
    if os.path.exists(conn_path):
        try:
            with open(conn_path, "r", encoding="utf-8-sig", errors="ignore") as f:
                reader = csv.reader(f)
                _ = next(reader, None)
                for row in reader:
                    if len(row) >= 4:
                        area = _sanitize_text(row[1].strip())
                        prabhag = _sanitize_text(row[2].strip())
                        try:
                            slum_pct = float(row[4].strip()) if len(row) > 4 and row[4].strip() else 80.0
                            # update existing record if available
                            for rec in drainage_stats["records"]:
                                if rec["prabhag"].lower() == prabhag.lower():
                                    rec["slum_drainage_pct"] = slum_pct
                                    break
                        except (ValueError, IndexError):
                            continue
        except Exception as e:
            logger.warning("Could not read drainage_connections.csv: %s", e)
    else:
        logger.warning("drainage_connections.csv not found at %s", conn_path)

    # 5. Waste disposal data
    disp_path = os.path.join(data_dir, "waste_disposal.csv")
    if os.path.exists(disp_path):
        try:
            with open(disp_path, "r", encoding="utf-8-sig", errors="ignore") as f:
                reader = csv.reader(f)
                _ = next(reader, None)
                first_row = next(reader, None)
                if first_row and len(first_row) >= 7:
                    disposal_stats["capacity_tpd"] = 350.0
        except Exception as e:
            logger.warning("Could not read waste_disposal.csv: %s", e)
    else:
        logger.warning("waste_disposal.csv not found at %s", disp_path)

    return {
        "climate": climate_stats,
        "waste": waste_stats,
        "drainage": drainage_stats,
        "disposal": disposal_stats,
    }


# Execute load once at module level
KNOWLEDGE_BASE = _load_csv_data()


# ---------------------------------------------------------------------------
# Fallback Alerts per Season
# ---------------------------------------------------------------------------
FALLBACK_ALERTS: Dict[str, List[Dict[str, Any]]] = {
    "Monsoon": [
        {
            "id": "alert-monsoon-01",
            "season": "Monsoon",
            "seasonLabel": "Monsoon 2026",
            "title": "Severe Waterlogging and Storm Drain Inundation Warning",
            "category": "Water",
            "severity": "Critical",
            "probability": 88,
            "expectedTimeline": "Late June to Mid August",
            "daysAway": 15,
            "affectedZones": ["Nagar Road Lowlands", "Yerwada River Basin", "Aundh Low-Lying Sector"],
            "historicalPrecedent": "Rainfall data indicates annual downpours often exceed 900mm; wards with <15% stormwater drainage coverage suffer severe street flooding during 50mm+ single-day precipitation.",
            "problemDescription": "Low-lying wards with incomplete roadside drainage encounter rapid water backflow, inundating arterial streets, residential basements, and subway underpasses.",
            "citizenImpact": [
                "Basement and ground-floor apartment inundation",
                "Traffic paralysis along major low-lying road networks",
                "Subsurface contamination risk to potable water connections"
            ],
            "citizenSolutions": [
                {
                    "title": "Clear Private Society Grates",
                    "description": "Inspect perimeter society stormwater grates and remove debris to prevent localized pooling.",
                    "actionableStep": "Organize society drain clearing drive before continuous monsoon showers."
                },
                {
                    "title": "Basement Dewatering Pump Readiness",
                    "description": "Verify submersible pumps and backup generator circuits in underground parking.",
                    "actionableStep": "Test emergency pump float switches and store sandbags at basement ramps."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Stormwater Drainage Department",
                    "plan": "Intensive desilting of primary storm water canals, culverts, and roadside catchpits",
                    "status": "In Progress",
                    "targetDate": "June 10"
                },
                {
                    "department": "Disaster Management Cell",
                    "plan": "Pre-deployment of heavy-duty diesel suction pump sets at 12 historical inundation points",
                    "status": "Scheduled",
                    "targetDate": "June 20"
                }
            ],
            "checklist": [
                {"id": "chk-m1", "text": "Inspect groundwater sump seals against roadway runoff ingress", "points": 15},
                {"id": "chk-m2", "text": "Save municipal emergency control room hotline on personal devices", "points": 10},
                {"id": "chk-m3", "text": "Elevate ground-floor electrical meters and distribution panels", "points": 20}
            ],
            "helpline": "1800-233-0001 (Disaster Management Control)"
        },
        {
            "id": "alert-monsoon-02",
            "season": "Monsoon",
            "seasonLabel": "Monsoon 2026",
            "title": "Post-Inundation Asphalt Erosion and Pothole Cluster Warning",
            "category": "Roads",
            "severity": "High",
            "probability": 82,
            "expectedTimeline": "July to September",
            "daysAway": 25,
            "affectedZones": ["Sinhagad Arterial Corridor", "Kothrud Transit Axis", "Hadapsar Industrial Route"],
            "historicalPrecedent": "Extended water saturation strips bitumen binders, producing severe pothole clusters within 48 hours of heavy rain cycles.",
            "problemDescription": "Standing water combined with high traffic volume breaks down road substructure, forming hazardous deep craters that endanger two-wheeler riders and stall emergency traffic.",
            "citizenImpact": [
                "Two-wheeler skidding and road safety hazard",
                "Vehicle suspension damage and traffic transit delays",
                "Pedestrian splash hazards and reduced walking shoulder space"
            ],
            "citizenSolutions": [
                {
                    "title": "Report Early Surface Pitting",
                    "description": "Log photo reports of initial surface fissures before craters expand under monsoon rains.",
                    "actionableStep": "Upload geo-tagged road crater photos to the civic grievance portal."
                },
                {
                    "title": "Low-Speed Transit Precaution",
                    "description": "Maintain reduced speed on water-submerged roads where hidden craters cannot be seen.",
                    "actionableStep": "Avoid flooded curbs and maintain 20km/h buffer in low-visibility water patches."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Road Maintenance Engineering",
                    "plan": "Rapid cold-mix asphalt patch deployment using quick-setting bitumen compounds",
                    "status": "Scheduled",
                    "targetDate": "July 01"
                },
                {
                    "department": "Traffic Police Division",
                    "plan": "Placement of reflective caution barricades and solar blinkers around damaged road segments",
                    "status": "In Progress",
                    "targetDate": "Ongoing"
                }
            ],
            "checklist": [
                {"id": "chk-m4", "text": "Check vehicle tire tread depth and braking responsiveness for wet roads", "points": 15},
                {"id": "chk-m5", "text": "Flag deep waterlogged road depressions via citizen reporting portal", "points": 20}
            ],
            "helpline": "1800-233-0002 (Roads & Infrastructure Grievance)"
        }
    ],
    "Summer": [
        {
            "id": "alert-summer-01",
            "season": "Summer",
            "seasonLabel": "Summer 2026",
            "title": "Peak Heat Groundwater Depletion & Pipeline Low-Pressure Advisory",
            "category": "Water",
            "severity": "High",
            "probability": 78,
            "expectedTimeline": "April to Mid-June",
            "daysAway": 20,
            "affectedZones": ["Baner-Balewadi Ridge", "Wadgaon Sheri High Ground", "Dhankawadi Foothill Wards"],
            "historicalPrecedent": "Temperatures reaching peak levels of 42-43°C combined with low winter replenishment trigger a 35% surge in domestic water tanker demand across elevated zones.",
            "problemDescription": "Elevated residential sectors experience sharp drops in municipal pipeline pressure and rapid depletion of local borewells as peak heat drives evaporation.",
            "citizenImpact": [
                "Intermittent supply hours and low tap water pressure",
                "Escalated reliance on private water tankers",
                "Increased stress on domestic rooftop water storage tanks"
            ],
            "citizenSolutions": [
                {
                    "title": "Aerate Taps and Restrict Non-Essential Use",
                    "description": "Install low-flow aerators on taps and halt lawn sprinklers or car washing during peak daytime hours.",
                    "actionableStep": "Fit tap aerators to reduce domestic throughput by 40%."
                },
                {
                    "title": "Rainwater Harvesting Recharge Audit",
                    "description": "Inspect and clean recharge pits before summer ends to maximize subsequent replenishment.",
                    "actionableStep": "Clear society recharge shafts and de-silt filter beds."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Water Supply Department",
                    "plan": "Rationing supply schedules and boosting secondary booster pump stations during morning hours",
                    "status": "In Progress",
                    "targetDate": "April 15"
                },
                {
                    "department": "Public Health Engineering",
                    "plan": "Deployment of GPS-monitored municipal emergency potable water tankers to elevated pockets",
                    "status": "Scheduled",
                    "targetDate": "May 01"
                }
            ],
            "checklist": [
                {"id": "chk-s1", "text": "Audit overhead tank float valves to prevent overflow wastage", "points": 15},
                {"id": "chk-s2", "text": "Schedule society water pump cycles to avoid motor burnout during low-voltage windows", "points": 10}
            ],
            "helpline": "1800-233-0003 (Municipal Water Supply Helpline)"
        },
        {
            "id": "alert-summer-02",
            "season": "Summer",
            "seasonLabel": "Summer 2026",
            "title": "Dry Season Solid Waste Accumulation & Heat Combustion Hazard",
            "category": "Sanitation",
            "severity": "Moderate",
            "probability": 70,
            "expectedTimeline": "April to May",
            "daysAway": 15,
            "affectedZones": ["Hadapsar Waste Transfer Points", "Eastern Landfill Sector", "Industrial Transit Zone"],
            "historicalPrecedent": "Solid waste generation averaging 1200+ TPD with high organic loads experiences accelerated methane degassing during 40°C+ summer heat.",
            "problemDescription": "High ambient temperatures dry out organic and dry waste piles, raising combustibility risks at bulk transit collection points and emitting pungent odors in neighboring communities.",
            "citizenImpact": [
                "Pungent localized odor from accelerated organic decomposition",
                "Fly and pest infestation near open transfer stations",
                "Localized smoke risks from spontaneous dry grass and refuse combustion"
            ],
            "citizenSolutions": [
                {
                    "title": "Strict Source Segregation",
                    "description": "Ensure wet waste is kept strictly separated and sealed to avoid methane pockets.",
                    "actionableStep": "Wrap organic kitchen scrap bins securely and avoid mixing dry flammable debris."
                },
                {
                    "title": "Zero Open Burning Enforcement",
                    "description": "Immediately report any roadside dry leaf or garbage burning to fire authorities.",
                    "actionableStep": "Compost dry leaves rather than sweeping them into roadside gutters."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Solid Waste Management",
                    "plan": "Increasing frequency of bio-enzyme odor sprays and daily waste clearing at transit points",
                    "status": "In Progress",
                    "targetDate": "Immediate"
                },
                {
                    "department": "Fire & Emergency Services",
                    "plan": "Installation of thermal sensors and perimeter water sprinkler buffers around processing facilities",
                    "status": "Scheduled",
                    "targetDate": "April 30"
                }
            ],
            "checklist": [
                {"id": "chk-s3", "text": "Report overflowing secondary garbage dumps within 4 hours", "points": 15},
                {"id": "chk-s4", "text": "Keep residential garden refuse damp to deter spark ignition", "points": 10}
            ],
            "helpline": "1800-233-0004 (Solid Waste Grievance Cell)"
        }
    ],
    "Post-Monsoon": [
        {
            "id": "alert-post-monsoon-01",
            "season": "Post-Monsoon",
            "seasonLabel": "Post-Monsoon 2026",
            "title": "Vector-Borne Disease Surge & Stagnant Water Containment",
            "category": "Public Safety",
            "severity": "High",
            "probability": 85,
            "expectedTimeline": "October to November",
            "daysAway": 12,
            "affectedZones": ["Central River Basin", "Dhole Patil Urban Settlements", "Kalas Lowlands"],
            "historicalPrecedent": "Receding monsoon waters leave hundreds of stagnant micro-pools in unpaved drainage areas, historically causing a 40% surge in dengue and chikungunya vectors.",
            "problemDescription": "Intermittent October sunlight on stagnant pools in empty plots and uncovered roadside catchpits accelerates mosquito breeding cycles.",
            "citizenImpact": [
                "Elevated risk of dengue and vector-borne fevers",
                "Need for extensive residential mosquito netting and repellents",
                "Pressure on municipal outpatient clinics and fever hospitals"
            ],
            "citizenSolutions": [
                {
                    "title": "Weekly Dry Day Observance",
                    "description": "Empty, scrub, and dry all domestic coolers, potted plant trays, and pet bowls every Sunday.",
                    "actionableStep": "Inspect balconies and terraces for discarded containers holding rainwater."
                },
                {
                    "title": "Request Neighborhood Fogging",
                    "description": "Coordinate with municipal ward health inspectors for vector larvicide spraying.",
                    "actionableStep": "File ward request for abate larvicide treatment in public stormwater drains."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Health & Vector Control",
                    "plan": "Citywide deployment of thermal fogging machines and biologically safe anti-larval treatment",
                    "status": "In Progress",
                    "targetDate": "October 10"
                },
                {
                    "department": "Sanitation Inspection Division",
                    "plan": "Special inspections and notice issuance to construction sites with stagnant water pools",
                    "status": "In Progress",
                    "targetDate": "Ongoing"
                }
            ],
            "checklist": [
                {"id": "chk-pm1", "text": "Inspect building terrace rain gutters for blocked decaying leaf matter", "points": 20},
                {"id": "chk-pm2", "text": "Ensure society overhead and underground tanks have intact insect-proof mesh", "points": 15}
            ],
            "helpline": "1800-233-0005 (Epidemic Control Helpline)"
        },
        {
            "id": "alert-post-monsoon-02",
            "season": "Post-Monsoon",
            "seasonLabel": "Post-Monsoon 2026",
            "title": "Road Subsurface Cavity & Trench Settlement Hazard",
            "category": "Roads",
            "severity": "Moderate",
            "probability": 74,
            "expectedTimeline": "October to December",
            "daysAway": 18,
            "affectedZones": ["Warje Karve Transit Area", "Model Colony Inner Roads", "Wanawadi Arterial Corridor"],
            "historicalPrecedent": "Post-monsoon ground drying causes subterranean settlement around utility trenches dug for underground drainage lines.",
            "problemDescription": "Subsurface soil compaction beneath asphalt produces sudden dips and depressions on recently resurfaced roads.",
            "citizenImpact": [
                "Sudden vehicle jolt hazards at unmarked road depressions",
                "Increased risk of rim bending and vehicle alignment misalignment",
                "Trip hazards along pedestrian pavement edges"
            ],
            "citizenSolutions": [
                {
                    "title": "Flag Subsurface Depressions",
                    "description": "Report sudden road sinking or hollow sounding pavement before catastrophic road cave-ins occur.",
                    "actionableStep": "Pinpoint road subsidence locations on the civic alert map."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Road Engineering & Utility Coordination",
                    "plan": "Joint audit with telecom and drainage contractors to level settled utility trenches",
                    "status": "Scheduled",
                    "targetDate": "November 15"
                }
            ],
            "checklist": [
                {"id": "chk-pm3", "text": "Inspect driveway ramp interface with main roadway for shifting", "points": 10}
            ],
            "helpline": "1800-233-0002 (Roads & Infrastructure Grievance)"
        }
    ],
    "Winter": [
        {
            "id": "alert-winter-01",
            "season": "Winter",
            "seasonLabel": "Winter 2026-2027",
            "title": "Thermal Inversion Smog & Morning Air Quality Advisory",
            "category": "Public Safety",
            "severity": "High",
            "probability": 80,
            "expectedTimeline": "December to February",
            "daysAway": 30,
            "affectedZones": ["Industrial Perimeter Wards", "Central Bowl Basin", "Dense Highway Transit Chokepoints"],
            "historicalPrecedent": "Winter dawn temperatures dropping to 5-7°C create strong thermal inversion caps, trapping vehicular exhaust and fine particulates in valley lowlands.",
            "problemDescription": "Cool air layers prevent vertical smoke dissipation, resulting in elevated PM2.5 concentrations during early morning and late evening hours.",
            "citizenImpact": [
                "Respiratory discomfort for senior citizens and young children",
                "Reduced morning visibility on outer ring roads and highways",
                "Increased incidence of seasonal bronchitis and allergies"
            ],
            "citizenSolutions": [
                {
                    "title": "Reschedule Morning Outdoor Workouts",
                    "description": "Shift jogging and outdoor exercise past 8:30 AM once sunlight breaks the inversion layer.",
                    "actionableStep": "Check the city Air Quality Index before morning outdoor physical activities."
                },
                {
                    "title": "Zero Open Biomass Burning",
                    "description": "Provide security watchmen with electric warming heaters instead of wood/plastic scrap bonfires.",
                    "actionableStep": "Equip society security posts with electric radiant heaters."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Environment & Pollution Control",
                    "plan": "Operation of mechanized vacuum road sweepers and water mist cannons along heavy traffic corridors",
                    "status": "In Progress",
                    "targetDate": "December 01"
                },
                {
                    "department": "Traffic Management Division",
                    "plan": "Strict enforcement of PUC vehicle emission certifications at entry toll nakas",
                    "status": "Scheduled",
                    "targetDate": "December 15"
                }
            ],
            "checklist": [
                {"id": "chk-w1", "text": "Replace HVAC and air purifier domestic filters for winter season", "points": 15},
                {"id": "chk-w2", "text": "Report unauthorized roadside burning of dry leaves or plastic waste", "points": 20}
            ],
            "helpline": "1800-233-0006 (Air Quality & Pollution Control Board)"
        },
        {
            "id": "alert-winter-02",
            "season": "Winter",
            "seasonLabel": "Winter 2026-2027",
            "title": "Dawn Dense Fog & Highway Streetlight Illumination Audit",
            "category": "Streetlights",
            "severity": "Moderate",
            "probability": 68,
            "expectedTimeline": "December to January",
            "daysAway": 25,
            "affectedZones": ["Bypass Expressway Corridor", "Riverfront Arterial Roads", "Hillside Transit Sectors"],
            "historicalPrecedent": "Rapid radiation cooling near riverbanks causes dense localized fog banks, reducing driver sight distance below 30 meters at poorly illuminated intersections.",
            "problemDescription": "Flickering or unlit streetlights along arterial routes during dense morning fog multiply collision risks for transit buses and two-wheelers.",
            "citizenImpact": [
                "Elevated early-morning transit accident hazards",
                "Diminished pedestrian crossing visibility at major junctions",
                "Delayed school transit and commercial delivery schedules"
            ],
            "citizenSolutions": [
                {
                    "title": "Use Yellow Fog Lamps & Reflectors",
                    "description": "Ensure personal vehicles have functional amber hazard lights and clean headlight lenses.",
                    "actionableStep": "Clean headlamp lenses and apply high-visibility reflective stickers on cycles/bikes."
                },
                {
                    "title": "Report Dark Streetlight Stretches",
                    "description": "Instantly report non-functional poles before winter peak fog sets in.",
                    "actionableStep": "Note pole numbers along daily transit routes and lodge online tickets."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Electrical & Streetlighting Cell",
                    "plan": "Automated remote monitoring system (RMS) verification and conversion to high-lumen yellow-tint LED fixtures",
                    "status": "In Progress",
                    "targetDate": "November 30"
                }
            ],
            "checklist": [
                {"id": "chk-w3", "text": "Report non-functional streetlights along primary colony roads", "points": 15}
            ],
            "helpline": "1800-233-0007 (Streetlighting & Electrical Helpline)"
        }
    ],
    "Immediate (30-day)": [
        {
            "id": "alert-immediate-01",
            "season": "Immediate (30-day)",
            "seasonLabel": "Immediate Action (Next 30 Days)",
            "title": "Critical Culvert & Catchpit Desilting Flash Action",
            "category": "Water",
            "severity": "Critical",
            "probability": 92,
            "expectedTimeline": "Next 15 to 30 Days",
            "daysAway": 7,
            "affectedZones": ["Vadgaon Sheri Sectors", "Bopodi Gaonthan Zone", "Viman Nagar Transit Junctions"],
            "historicalPrecedent": "Data shows 5 wards possess less than 10% road stormwater drainage; uncleaned catchpits cause immediate flash street flooding within 20 minutes of rain.",
            "problemDescription": "Solid waste, silt, and construction debris accumulated in roadside gutters threaten complete inlet blockage upon initial pre-seasonal storms.",
            "citizenImpact": [
                "Immediate curbside water pooling blocking pedestrian walkways",
                "Overflow of open drains into adjacent storefronts and ground floors",
                "Sewer backpressure causing foul smells in residential societies"
            ],
            "citizenSolutions": [
                {
                    "title": "Inspect Society Drain Connection Point",
                    "description": "Verify where society internal lines meet municipal trunk lines to ensure no debris blockage.",
                    "actionableStep": "Remove construction rubble and plastic waste from internal drain discharge channels."
                },
                {
                    "title": "Participate in Ward Pre-Monsoon Audit",
                    "description": "Accompany ward corporator and junior engineer during catchment area physical inspection.",
                    "actionableStep": "Document uncleared nallah segments and escalate on the city portal."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Stormwater Drainage Department",
                    "plan": "Emergency mechanical suction desludging of all roadside grates and trunk storm pipelines",
                    "status": "In Progress",
                    "targetDate": "Within 14 Days"
                },
                {
                    "department": "Solid Waste Management",
                    "plan": "Special drive to clear illegal roadside dumping spots adjacent to natural water streams",
                    "status": "In Progress",
                    "targetDate": "Within 7 Days"
                }
            ],
            "checklist": [
                {"id": "chk-imm1", "text": "Verify society main stormwater outlet flapper valve operates freely", "points": 20},
                {"id": "chk-imm2", "text": "Report uncleared roadside construction sand and debris mounds", "points": 15}
            ],
            "helpline": "1800-233-0001 (Disaster Management & Drainage Helpline)"
        },
        {
            "id": "alert-immediate-02",
            "season": "Immediate (30-day)",
            "seasonLabel": "Immediate Action (Next 30 Days)",
            "title": "Pre-Storm Hazardous Tree Branch & Overhead Wire Trimming",
            "category": "Public Safety",
            "severity": "High",
            "probability": 76,
            "expectedTimeline": "Next 10 to 25 Days",
            "daysAway": 10,
            "affectedZones": ["Model Colony Residential", "Aundh Old Tree Corridors", "Kothrud Transit Way"],
            "historicalPrecedent": "Pre-monsoon squalls and sudden gale winds regularly fell decaying roadside tree branches, causing power outages and vehicular damage.",
            "problemDescription": "Overgrown deadwood branches intertwined with high-voltage electrical distribution cables present severe electrocution and road blockage hazards.",
            "citizenImpact": [
                "Sudden power outages from snapped electrical feeders",
                "Road blockage from fallen branches during evening storms",
                "Crush hazard for vehicles parked under unpruned avenue trees"
            ],
            "citizenSolutions": [
                {
                    "title": "Trim Internal Society Overhangs",
                    "description": "Prune dead branches inside society premises with assistance from certified arborists.",
                    "actionableStep": "Hire arborist services to prune heavy branches leaning toward external power lines."
                },
                {
                    "title": "Avoid Parking Under Decaying Canopies",
                    "description": "Park personal cars away from visibly hollow, tilting, or cracked avenue trees.",
                    "actionableStep": "Identify hollow roadside trees and mark them on the municipal tree census portal."
                }
            ],
            "municipalMitigation": [
                {
                    "department": "Garden & Tree Authority",
                    "plan": "Joint aerial pruning drive with MSEDCL electricity maintenance crews along bus routes",
                    "status": "In Progress",
                    "targetDate": "Ongoing"
                }
            ],
            "checklist": [
                {"id": "chk-imm3", "text": "Inspect compound trees for termites or root erosion", "points": 15},
                {"id": "chk-imm4", "text": "Report leaning roadside electric poles or sagging 11kV cables", "points": 20}
            ],
            "helpline": "1800-233-0008 (Tree Authority & Electrical Emergency)"
        }
    ]
}


def _resolve_season(season: Optional[str] = None) -> str:
    """Resolve season input or infer canonical season from current calendar month."""
    if season:
        s = season.strip().lower()
        if "monsoon" in s and "post" not in s:
            return "Monsoon"
        elif "post" in s or "autumn" in s:
            return "Post-Monsoon"
        elif "summer" in s or "pre-monsoon" in s or "spring" in s:
            return "Summer"
        elif "winter" in s or "cold" in s:
            return "Winter"
        elif "immediate" in s or "30" in s or "now" in s:
            return "Immediate (30-day)"

    month = datetime.date.today().month
    if 6 <= month <= 9:
        return "Monsoon"
    elif 10 <= month <= 11:
        return "Post-Monsoon"
    elif month in (12, 1, 2):
        return "Winter"
    else:
        return "Summer"


def _sanitize_alert_dict(alert: Dict[str, Any], canonical_season: str, index: int) -> Dict[str, Any]:
    """Sanitize and validate an alert dict to match PredictiveAlertResponse schema."""
    aid = str(alert.get("id") or f"alert-{canonical_season.lower()[:3]}-{index + 1}")
    title = _sanitize_text(alert.get("title") or f"{canonical_season} Civic Hazard Alert")
    category = alert.get("category", "Water")
    if category not in VALID_CATEGORIES:
        category = "Water" if canonical_season == "Monsoon" else "Sanitation"
    severity = alert.get("severity", "High")
    if severity not in VALID_SEVERITIES:
        severity = "High"

    try:
        prob = int(float(alert.get("probability", 75)))
        prob = max(0, min(100, prob))
    except (ValueError, TypeError):
        prob = 75

    try:
        days_away = int(float(alert.get("daysAway", 15)))
        days_away = max(1, days_away)
    except (ValueError, TypeError):
        days_away = 15

    affected_zones = alert.get("affectedZones")
    if not isinstance(affected_zones, list) or not affected_zones:
        affected_zones = ["Central Administrative Sector", "Eastern Commercial Corridor"]
    else:
        affected_zones = [_sanitize_text(str(z)) for z in affected_zones]

    raw_impact = alert.get("citizenImpact")
    if isinstance(raw_impact, list) and raw_impact:
        citizen_impact = [_sanitize_text(str(i)) for i in raw_impact]
    else:
        citizen_impact = ["Localized service disruption", "Reduced transit speeds along main roads"]

    raw_solutions = alert.get("citizenSolutions")
    citizen_solutions = []
    if isinstance(raw_solutions, list) and raw_solutions:
        for s in raw_solutions:
            if isinstance(s, dict):
                citizen_solutions.append({
                    "title": _sanitize_text(s.get("title", "Community Action")),
                    "description": _sanitize_text(s.get("description", "Inspect local infrastructure.")),
                    "actionableStep": _sanitize_text(s.get("actionableStep", "Report issues to municipal cell.")),
                })
    if not citizen_solutions:
        citizen_solutions = [{
            "title": "Community Inspection",
            "description": "Inspect perimeter stormwater drains and domestic water connections.",
            "actionableStep": "Report blockages via the civic portal."
        }]

    raw_mitigations = alert.get("municipalMitigation")
    municipal_mitigation = []
    if isinstance(raw_mitigations, list) and raw_mitigations:
        for m in raw_mitigations:
            if isinstance(m, dict):
                st = m.get("status", "In Progress")
                if st not in VALID_STATUSES:
                    st = "In Progress"
                municipal_mitigation.append({
                    "department": _sanitize_text(m.get("department", "Public Works Department")),
                    "plan": _sanitize_text(m.get("plan", "Intensive desilting and infrastructure inspection")),
                    "status": st,
                    "targetDate": _sanitize_text(m.get("targetDate", "Target Scheduled")),
                })
    if not municipal_mitigation:
        municipal_mitigation = [{
            "department": "Public Works & Infrastructure",
            "plan": "Seasonal pre-emptive maintenance and emergency response deployment",
            "status": "In Progress",
            "targetDate": "Scheduled"
        }]

    raw_checklist = alert.get("checklist")
    checklist = []
    if isinstance(raw_checklist, list) and raw_checklist:
        for idx, c in enumerate(raw_checklist):
            if isinstance(c, dict):
                try:
                    pts = int(float(c.get("points", 10)))
                except (ValueError, TypeError):
                    pts = 10
                checklist.append({
                    "id": str(c.get("id") or f"chk-{index + 1}-{idx + 1}"),
                    "text": _sanitize_text(c.get("text", "Perform routine civic check")),
                    "points": pts,
                })
    if not checklist:
        checklist = [
            {"id": f"chk-{index + 1}-1", "text": "Inspect domestic water and drainage connections", "points": 15},
            {"id": f"chk-{index + 1}-2", "text": "Keep municipal emergency helplines accessible", "points": 10}
        ]

    return {
        "id": aid,
        "season": canonical_season,
        "seasonLabel": _sanitize_text(alert.get("seasonLabel") or f"{canonical_season} Outlook"),
        "title": title,
        "category": category,
        "severity": severity,
        "probability": prob,
        "expectedTimeline": _sanitize_text(alert.get("expectedTimeline") or "Next 30 to 60 Days"),
        "daysAway": days_away,
        "affectedZones": affected_zones,
        "historicalPrecedent": _sanitize_text(alert.get("historicalPrecedent") or "Historical municipal records indicate seasonal vulnerability."),
        "problemDescription": _sanitize_text(alert.get("problemDescription") or "Anticipated seasonal municipal strain."),
        "citizenImpact": citizen_impact,
        "citizenSolutions": citizen_solutions,
        "municipalMitigation": municipal_mitigation,
        "checklist": checklist,
        "helpline": _sanitize_text(alert.get("helpline") or "1800-233-0000 (Municipal Grievance Helpline)"),
    }


def get_predictive_alerts(season: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns a list of predictive civic alerts for a given or inferred season.

    Uses call_ollama_json with dataset statistics, falling back to precomputed alerts on error.
    """
    canonical_season = _resolve_season(season)
    season_label = f"{canonical_season} {datetime.date.today().year}"

    # Build prompt context from knowledge base
    c_stats = KNOWLEDGE_BASE["climate"]
    w_stats = KNOWLEDGE_BASE["waste"]
    d_stats = KNOWLEDGE_BASE["drainage"]

    top_waste_str = ", ".join(w_stats["top_waste_zones"][:3])
    low_drain_str = ", ".join(d_stats["low_drainage_wards"][:3])

    prompt = f"""You are a predictive municipal intelligence engine. Generate 2 forward-looking civic hazard alerts for the '{canonical_season}' season.
Dataset statistics context:
- Climate: Average annual rainfall {c_stats['avg_rainfall']} mm (peak historical {c_stats['max_rainfall']} mm). Peak summer temp {c_stats['peak_temp']}°C, winter low {c_stats['min_temp']}°C.
- Waste generation: ~{w_stats['total_waste_tpd']} Tonnes Per Day across zones including {top_waste_str}.
- Stormwater drainage: Citywide average road drainage coverage is {d_stats['avg_drainage_pct']}%. Critical low-coverage wards: {low_drain_str}.

Respond with ONLY valid JSON containing a key "alerts" with 2 alert items matching this schema:
{{
  "alerts": [
    {{
      "id": "alert-{canonical_season.lower()[:3]}-1",
      "season": "{canonical_season}",
      "seasonLabel": "{season_label}",
      "title": "Specific Alert Title",
      "category": "Roads | Water | Sanitation | Streetlights | Public Safety | Parks | Community",
      "severity": "Critical | High | Moderate | Advisory",
      "probability": 85,
      "expectedTimeline": "Expected timeframe",
      "daysAway": 14,
      "affectedZones": ["Zone A", "Zone B"],
      "historicalPrecedent": "Data-backed historical precedent",
      "problemDescription": "Detailed problem description",
      "citizenImpact": ["Impact 1", "Impact 2"],
      "citizenSolutions": [{{"title": "Action title", "description": "Details", "actionableStep": "Step"}}],
      "municipalMitigation": [{{"department": "Dept Name", "plan": "Plan details", "status": "In Progress", "targetDate": "Date"}}],
      "checklist": [{{"id": "chk-1", "text": "Check item", "points": 10}}],
      "helpline": "1800-XXX-XXXX"
    }}
  ]
}}"""

    try:
        response_json = call_ollama_json(prompt)
        raw_alerts = []
        if isinstance(response_json, dict) and "alerts" in response_json:
            raw_alerts = response_json["alerts"]
        elif isinstance(response_json, list):
            raw_alerts = response_json

        if isinstance(raw_alerts, list) and len(raw_alerts) > 0:
            sanitized_alerts = []
            for idx, alert in enumerate(raw_alerts[:3]):
                if isinstance(alert, dict):
                    sanitized_alerts.append(_sanitize_alert_dict(alert, canonical_season, idx))
            if sanitized_alerts:
                return sanitized_alerts
    except Exception as e:
        logger.warning("Predictive alert generation via LLM failed, using baseline fallbacks: %s", e)

    # Return hardcoded fallback alerts
    fallbacks = FALLBACK_ALERTS.get(canonical_season) or FALLBACK_ALERTS["Monsoon"]
    return [_sanitize_alert_dict(dict(a), canonical_season, idx) for idx, a in enumerate(fallbacks)]


def check_street_risk(street_name: str) -> Dict[str, Any]:
    """AI and dataset powered hazard risk assessment for a specific street or area."""
    if not street_name or not street_name.strip():
        raise ValueError("Street or area name is required.")

    clean_street = _sanitize_text(street_name.strip())

    # Check for direct or partial match in drainage / waste records
    matched_drainage_pct: Optional[float] = None
    matched_zone: Optional[str] = None

    records = KNOWLEDGE_BASE["drainage"].get("records", [])
    for rec in records:
        prabhag = rec.get("prabhag", "").lower()
        area = rec.get("area", "").lower()
        if prabhag in clean_street.lower() or clean_street.lower() in prabhag or area in clean_street.lower():
            matched_drainage_pct = rec.get("percentage")
            matched_zone = rec.get("area")
            break

    if not matched_zone:
        # Check waste zones
        for z in KNOWLEDGE_BASE["waste"].get("zone_waste", {}).keys():
            if z.lower() in clean_street.lower() or clean_street.lower() in z.lower():
                matched_zone = z
                break

    resolved_zone = matched_zone or "Central Administrative Ward"

    # Derive baseline stats
    if matched_drainage_pct is not None:
        if matched_drainage_pct < 20.0:
            default_risk = "High"
            default_prob = 85
            default_hazard = f"Critical stormwater drainage deficit ({matched_drainage_pct}% road coverage) causing high waterlogging risk."
            default_action = "Urgent catchpit desilting and positioning of emergency dewatering pumps."
        elif matched_drainage_pct < 60.0:
            default_risk = "Moderate"
            default_prob = 60
            default_hazard = f"Moderate stormwater drainage capacity ({matched_drainage_pct}% road coverage) with localized water accumulation."
            default_action = "Clear roadside grates and remove debris from storm drains."
        else:
            default_risk = "Low"
            default_prob = 30
            default_hazard = f"Adequate stormwater infrastructure ({matched_drainage_pct}% coverage) with minor routine maintenance needs."
            default_action = "Routine culvert cleaning and roadside inlet inspection."
    else:
        default_risk = "Moderate"
        default_prob = 62
        default_hazard = f"Seasonal drainage congestion and solid waste accumulation near {clean_street}."
        default_action = f"Inspect local storm drains, catchpits, and garbage pickup points along {clean_street}."

    prompt = f"""You are a municipal risk assessment expert.
Analyze civic hazard risks for location: "{clean_street}".
Context:
- Administrative Zone: {resolved_zone}
- Drainage Coverage: {f'{matched_drainage_pct}%' if matched_drainage_pct is not None else 'City average 46.5%'}

Respond with ONLY valid JSON with keys:
{{
  "zone": "{resolved_zone}",
  "riskLevel": "High | Moderate | Low",
  "probability": 0 to 100,
  "predictedHazard": "One short sentence identifying primary infrastructure hazard",
  "actionRequired": "One short sentence describing required preventative action"
}}"""

    try:
        res = call_ollama_json(prompt)
        if isinstance(res, dict):
            risk_level = res.get("riskLevel", default_risk).capitalize()
            if risk_level not in ["High", "Moderate", "Low"]:
                risk_level = default_risk

            try:
                prob = int(float(res.get("probability", default_prob)))
                prob = max(0, min(100, prob))
            except (ValueError, TypeError):
                prob = default_prob

            hazard = _sanitize_text(str(res.get("predictedHazard") or default_hazard))
            action = _sanitize_text(str(res.get("actionRequired") or default_action))
            zone = _sanitize_text(str(res.get("zone") or resolved_zone))

            return {
                "zone": zone,
                "riskLevel": risk_level,
                "probability": prob,
                "predictedHazard": hazard,
                "actionRequired": action,
            }
    except Exception as e:
        logger.warning("Street risk assessment LLM failed, using data-driven heuristic: %s", e)

    return {
        "zone": resolved_zone,
        "riskLevel": default_risk,
        "probability": default_prob,
        "predictedHazard": default_hazard,
        "actionRequired": default_action,
    }
