import { PredictiveAlert } from '../types';

export const PREDICTIVE_ALERTS: PredictiveAlert[] = [
  {
    id: 'alert-monsoon-drain',
    season: 'Monsoon',
    seasonLabel: 'Upcoming Monsoon (Next Season)',
    title: 'Flash Waterlogging & Stormwater Backflow in Low-Lying Streets',
    category: 'Water',
    severity: 'Critical',
    probability: 91,
    expectedTimeline: 'Expected Onset: Late May – August',
    daysAway: 42,
    affectedZones: [
      '100ft Road Underpass & Culvert #4',
      'Indiranagar 4th Cross Low Basin',
      'Domlur Ring Road Service Lane',
      'BDA Complex Basement Level'
    ],
    historicalPrecedent:
      'Based on 5-year municipal data: In 2024 & 2025, 412 waterlogging grievances were recorded during initial downpours due to silted catch-pits and construction debris blocking culvert inlets.',
    problemDescription:
      'Predictive models indicate heavy pre-monsoon convective thunderstorms with peak rainfall rates exceeding 45mm/hour. Due to 38% current silt accumulation in secondary feeder canals, high water backflow into ground-floor residences and basement parking is forecasted if unmitigated.',
    citizenImpact: [
      'Flooding risk in residential basements and underground parking.',
      'Surface runoff entering drinking water sumps causing contamination.',
      'Severe commute gridlock on 100ft road and service lanes during evening peak hours.',
      'High vehicle water damage risk at low underpasses.'
    ],
    citizenSolutions: [
      {
        title: 'Check & Elevate Underground Sump Lids',
        description: 'Ensure sump inspection covers are raised at least 6 inches above driveway paving to prevent dirty floodwater runoff from mixing with municipal Cauvery drinking water.',
        actionableStep: 'Elevate or seal perimeter rubber gasket on your sump cover this week.'
      },
      {
        title: 'Clear Rooftop Downspouts & Leaf Traps',
        description: 'Dry leaves accumulated during spring block terrace drains, creating massive roof ponding that leaks into electrical conduits and falls over building facades.',
        actionableStep: 'Inspect and clean terrace drain mouths; install wire-mesh leaf guards.'
      },
      {
        title: 'Install Basement Sump Non-Return Check Valves',
        description: 'Stormwater backpressure forces municipal drain water back through basement drains. A non-return flap valve stops sewage backflow completely.',
        actionableStep: 'Have a plumber service or install backwater flaps in basement gullies.'
      },
      {
        title: 'Proactively Flag Blocked Road Gratings Now',
        description: 'Do not wait for the storm to hit. Use the Praja portal camera tool to report debris-covered road gratings before the monsoon starts.',
        actionableStep: 'Tap "Report Vulnerability" below to submit pre-season desilting tickets.'
      }
    ],
    municipalMitigation: [
      {
        department: 'BBMP Storm Water Drains (SWD)',
        plan: 'Mechanized robotic desilting of primary box culverts along 100ft Road and Domlur canal.',
        status: 'In Progress',
        targetDate: 'May 10, 2026'
      },
      {
        department: 'Traffic Police & Ward Engineers',
        plan: 'Stationing 3 high-capacity diesel dewatering pumps (15 HP) at flood-prone underpasses.',
        status: 'Scheduled',
        targetDate: 'May 18, 2026'
      },
      {
        department: 'BWSSB Sanitation Wing',
        plan: 'Clearing silt chambers and sealing sanitary manhole lids against stormwater infiltration.',
        status: 'In Progress',
        targetDate: 'May 25, 2026'
      }
    ],
    checklist: [
      { id: 'c1', text: 'Checked and cleared terrace drain gratings and pipes', points: 15, isCompleted: false },
      { id: 'c2', text: 'Sealed drinking water sump cover against dirty surface runoff', points: 20, isCompleted: false },
      { id: 'c3', text: 'Inspected basement pump and float switch operation', points: 25, isCompleted: false },
      { id: 'c4', text: 'Reported clogged road storm grate in our lane via Praja', points: 30, isCompleted: false }
    ],
    helpline: 'BBMP 24x7 Flood Control Room: 080-22221188 / 1533'
  },
  {
    id: 'alert-monsoon-trees',
    season: 'Monsoon',
    seasonLabel: 'Upcoming Monsoon (Next Season)',
    title: 'Pre-Monsoon Squall Winds & Gulmohar Branch Snapping Risk',
    category: 'Public Safety',
    severity: 'High',
    probability: 78,
    expectedTimeline: 'Expected Onset: Early May – June',
    daysAway: 25,
    affectedZones: [
      '12th Main Boulevard (Aged Canopy Trees)',
      'Defense Colony 3rd Cross Overhead Corridor',
      'HAL 2nd Stage Park Perimeter'
    ],
    historicalPrecedent:
      'Previous year data logged 23 tree and branch falls during the first 4 pre-monsoon squalls (gusts 65 km/h), causing 18 hours of intermittent power loss across 3 sub-feeders.',
    problemDescription:
      'Shallow-rooted ornamental species (Gulmohar and African Tulip) combined with heavy top foliage and waterlogged soil will face severe lateral wind stress during May pre-monsoon thundershowers.',
    citizenImpact: [
      'Overhead power line snapping causing abrupt voltage surges and blackouts.',
      'Parked vehicles crushed by brittle branch splits.',
      'Pedestrian and two-wheeler hazards during sudden evening gusts.'
    ],
    citizenSolutions: [
      {
        title: 'Avoid Parking Beneath Overhanging Branches',
        description: 'During windy weather alerts, move vehicles from beneath heavy boughs of hollow or top-heavy trees into covered or open bays.',
        actionableStep: 'Park at least 5 meters away from brittle canopy trees when rain clouds form.'
      },
      {
        title: 'Prune Private Compound Tree Encroachments',
        description: 'Branches from private residences that touch 11kV overhead lines pose fire and electrocution hazards.',
        actionableStep: 'Request authorized trimming with BESCOM helpline or certified arborists.'
      },
      {
        title: 'Flag Termite-Weakened Trees Early',
        description: 'Look for fungal brackets, sawdust at the base, or leaning trunks. Flagging them now lets the Forest Cell take preventive action.',
        actionableStep: 'Take a photo and upload to "Pre-Monsoon Tree Safety" category.'
      }
    ],
    municipalMitigation: [
      {
        department: 'BBMP Forest Cell & Tree Squad',
        plan: 'Proactive scientific canopy reduction and removing dead/hollow boughs along main transit roads.',
        status: 'In Progress',
        targetDate: 'May 12, 2026'
      },
      {
        department: 'BESCOM Quick Response Teams (QRT)',
        plan: 'Clearing vegetation clearances around 11kV distribution transformers and stringing spacer ties.',
        status: 'In Progress',
        targetDate: 'May 20, 2026'
      }
    ],
    checklist: [
      { id: 'ct1', text: 'Trimmed overhanging private tree limbs near power wires', points: 20, isCompleted: false },
      { id: 'ct2', text: 'Inspected home surge protectors and inverter batteries', points: 15, isCompleted: false },
      { id: 'ct3', text: 'Identified safe parking area away from old trees for bad weather', points: 15, isCompleted: false }
    ],
    helpline: 'BESCOM Emergency Helpline: 1912 | Forest Tree Helpline: 080-22660000'
  },
  {
    id: 'alert-vector-dengue',
    season: 'Post-Monsoon',
    seasonLabel: 'Post-Monsoon (Upcoming Vector Season)',
    title: 'Vector-Borne Disease Surge (Dengue & Chikungunya Risk)',
    category: 'Public Safety',
    severity: 'High',
    probability: 84,
    expectedTimeline: 'Expected Onset: July – October',
    daysAway: 85,
    affectedZones: [
      'Indiranagar Slum Cluster & Low Areas',
      'Open Plot Excavations on 100ft Road',
      'Park Perimeters & Nursery Environs'
    ],
    historicalPrecedent:
      'Historical hospital intake data indicates a 310% surge in mosquito-borne cases 3 weeks after intermittent rains when ambient temperatures range between 26°C and 31°C.',
    problemDescription:
      'Aedes aegypti mosquitoes breed in clean, stagnant freshwater pockets as small as a bottle cap. The transition from heavy rains to intermittent sunny spells accelerates larval gestation from 10 days to just 5 days.',
    citizenImpact: [
      'Severe cluster fever, thrombocytopenia (low platelet count), and joint pain.',
      'School absenteeism and household medical stress.',
      'High hospitalization demand in ward primary health centres.'
    ],
    citizenSolutions: [
      {
        title: 'Observe Weekly Sunday "Dry Day"',
        description: 'Dedicate 15 minutes every Sunday morning to empty, scrub, and dry all water trays, plant pot saucers, bird baths, and unused containers.',
        actionableStep: 'Flip empty containers upside down; scrub inner walls to destroy eggs.'
      },
      {
        title: 'Cover Overhead Tanks with Fine Mesh',
        description: 'A loose or broken tank inspection cap allows thousands of female mosquitoes to lay eggs undisturbed in residential drinking water supplies.',
        actionableStep: 'Fasten mosquito netting or nylon mesh over ventilation pipes and covers.'
      },
      {
        title: 'Eliminate Stagnant Water in Building Basements',
        description: 'Construction sites and building sump overflows gather shallow puddles in dark corners where day-biting mosquitoes thrive.',
        actionableStep: 'Pour a few drops of vegetable oil or bio-larvicide on unavoidable standing puddles.'
      }
    ],
    municipalMitigation: [
      {
        department: 'BBMP Health & Malaria Control Cell',
        plan: 'Door-to-door larval surveys and distribution of Temephos granules in breeding hot spots.',
        status: 'Scheduled',
        targetDate: 'July 1, 2026'
      },
      {
        department: 'Ward 112 Public Health Dispensary',
        plan: 'Stocking 1,500 NS1 antigen and IgM test kits with dedicated fever triage desk.',
        status: 'Scheduled',
        targetDate: 'July 15, 2026'
      }
    ],
    checklist: [
      { id: 'cd1', text: 'Checked and emptied flower pot drip trays and AC drain buckets', points: 15, isCompleted: false },
      { id: 'cd2', text: 'Secured fine mesh on overhead tank air vents and lids', points: 20, isCompleted: false },
      { id: 'cd3', text: 'Applied mosquito window screens or coils in sleeping areas', points: 15, isCompleted: false }
    ],
    helpline: 'BBMP Health Officer (Ward 112): 080-22975800'
  },
  {
    id: 'alert-summer-water',
    season: 'Summer',
    seasonLabel: 'Peak Summer (Hot Season)',
    title: 'Groundwater Table Depletion & Potable Water Supply Deficit',
    category: 'Water',
    severity: 'High',
    probability: 79,
    expectedTimeline: 'Expected Onset: March – May',
    daysAway: 140,
    affectedZones: [
      'Peripheral residential layouts dependent on borewells',
      'Multi-storey apartments with declining yield',
      'Domlur commercial eateries zone'
    ],
    historicalPrecedent:
      'Summer 2024 & 2025 witnessed a 45% drop in static water tables across east Bengaluru, causing deep borewell failure and sharp escalation in private tanker dependencies.',
    problemDescription:
      'Elevated peak summer temperatures (exceeding 38°C) combined with reduced reservoir storage will create localized Cauvery supply rationing and dry borewells across older layouts.',
    citizenImpact: [
      'Restricted municipal water supply to alternate days.',
      'Rising expenditure on private water tankers with water hardness/salinity issues.',
      'Higher risk of waterborne gastroenteritis due to unverified tanker water quality.'
    ],
    citizenSolutions: [
      {
        title: 'Retrofit Tap Aerators & Low-Flow Restrictors',
        description: 'Tap aerators mix air into water flow, reducing volume consumption by up to 50% without diminishing subjective washing pressure.',
        actionableStep: 'Screw ₹100 aerators onto kitchen and bathroom sink faucets.'
      },
      {
        title: 'Desilt Rainwater Harvesting (RWH) Recharge Wells',
        description: 'Clearing debris from recharge pits before summer ends allows early thundershowers to inject thousands of liters directly into your aquifer.',
        actionableStep: 'Inspect your RWH filter media and percolation pit for sediment.'
      },
      {
        title: 'Boil or Purify All Tanker Water',
        description: 'Water sourced from commercial borewells often carries microbial contamination or high TDS.',
        actionableStep: 'Boil water for 5+ minutes or use multi-stage RO before drinking.'
      }
    ],
    municipalMitigation: [
      {
        department: 'BWSSB Cauvery Stage V Management',
        plan: 'Regulated valve scheduling with digital flow monitoring to ensure equitable tail-end pressure.',
        status: 'Scheduled',
        targetDate: 'April 5, 2026'
      },
      {
        department: 'Borewell Rejuvenation Cell',
        plan: 'Deep aquifer injection and mandatory RWH compliance audits for properties > 1,200 sq.ft.',
        status: 'In Progress',
        targetDate: 'Ongoing'
      }
    ],
    checklist: [
      { id: 'cw1', text: 'Installed aerators on household wash basins and kitchen taps', points: 15, isCompleted: false },
      { id: 'cw2', text: 'Checked toilet flush tanks for invisible flapper leaks', points: 15, isCompleted: false },
      { id: 'cw3', text: 'Cleaned and serviced domestic water purifier filter cartridges', points: 20, isCompleted: false }
    ],
    helpline: 'BWSSB Potable Water Emergency Cell: 1916'
  },
  {
    id: 'alert-immediate-potholes',
    season: 'Immediate (30-day)',
    seasonLabel: 'Immediate Forecast (Next 30 Days)',
    title: 'Pre-Monsoon Utility Excavations & Rapid Pothole Formation',
    category: 'Roads',
    severity: 'Moderate',
    probability: 88,
    expectedTimeline: 'Active Now – Next 30 Days',
    daysAway: 5,
    affectedZones: [
      '100ft Road Intersection Near Metro Pillar #42',
      'CMH Road Cross Lanes (OFC Trenching)',
      '12th Main Corner Asphalt Settling'
    ],
    historicalPrecedent:
      'Unconsolidated utility cable trenches settle unevenly by up to 10cm once early rains moisten the sub-base, turning minor cuts into severe tire-trap potholes within 48 hours.',
    problemDescription:
      'Recent telecommunication fiber trenching and gas pipe laying left temporary granular backfills. With early convective showers approaching, moisture saturation will erode the surface layer rapidly.',
    citizenImpact: [
      'High risk of two-wheeler skids and sudden vehicular braking.',
      'Suspension and rim damage for low-chassis cars.',
      'Sudden bottlenecks during morning school/office commute.'
    ],
    citizenSolutions: [
      {
        title: 'Report Unpaved Trenches Immediately',
        description: 'Contractors are legally bound to hot-mix or cold-mix asphalt trenches within 72 hours of cable laying.',
        actionableStep: 'Snap a geotagged photo via Praja so the ward officer penalizes delay.'
      },
      {
        title: 'Exercise Reduced Speed on Fresh Patchworks',
        description: 'Fresh bitumen requires curing time and becomes slippery with initial oil runoff during the first 15 minutes of light drizzle.',
        actionableStep: 'Keep 10-meter follow distance near ongoing utility restoration points.'
      }
    ],
    municipalMitigation: [
      {
        department: 'BBMP Major Roads Infrastructure Wing',
        plan: 'Mandatory trench reinstatement deadline enforcement with rapid-setting cold bitumen mix.',
        status: 'In Progress',
        targetDate: 'Immediate'
      }
    ],
    checklist: [
      { id: 'cp1', text: 'Logged uncompacted utility trench in our street on Praja', points: 20, isCompleted: false },
      { id: 'cp2', text: 'Checked vehicle tire tread depth for wet surface grip', points: 15, isCompleted: false }
    ],
    helpline: 'BBMP Pothole Helpline: 080-22221188'
  }
];
