const fs = require('fs');
const path = require('path');

const ngoSqlPath = path.join(__dirname, '..', 'sources and data', 'prajapulse_ngo_dataset_1000.sql');
const citSqlPath = path.join(__dirname, '..', 'sources and data', 'prajapulse_citizen_dataset_1000.sql');

const ngoSql = fs.readFileSync(ngoSqlPath, 'utf8');
const citSql = fs.readFileSync(citSqlPath, 'utf8');

function extractTableRows(sql, tableName) {
  const marker = 'INSERT INTO `' + tableName + '`';
  const start = sql.indexOf(marker);
  if (start === -1) return [];

  const valuesIdx = sql.indexOf('VALUES', start);
  if (valuesIdx === -1) return [];

  const semicolonIdx = sql.indexOf(';\n', valuesIdx);
  if (semicolonIdx === -1) return [];

  const valuesPart = sql.substring(valuesIdx + 6, semicolonIdx).trim();

  const rows = [];
  let inString = false;
  let strChar = '';
  let parenDepth = 0;
  let currentTuple = '';

  for (let i = 0; i < valuesPart.length; i++) {
    const c = valuesPart[i];
    if (inString) {
      if (c === '\\') {
        currentTuple += c + valuesPart[++i];
        continue;
      }
      if (c === strChar) inString = false;
      currentTuple += c;
    } else {
      if (c === "'" || c === '"') {
        inString = true;
        strChar = c;
        currentTuple += c;
      } else if (c === '(') {
        parenDepth++;
        if (parenDepth === 1) {
          currentTuple = '';
          continue;
        }
        currentTuple += c;
      } else if (c === ')') {
        parenDepth--;
        if (parenDepth === 0) {
          rows.push(parseTuple(currentTuple));
          currentTuple = '';
          continue;
        }
        currentTuple += c;
      } else {
        if (parenDepth > 0) currentTuple += c;
      }
    }
  }

  return rows;
}

function parseTuple(str) {
  const items = [];
  let inStr = false;
  let sChar = '';
  let cur = '';

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inStr) {
      if (c === '\\') {
        cur += str[++i];
        continue;
      }
      if (c === sChar) inStr = false;
      else cur += c;
    } else {
      if (c === "'" || c === '"') {
        inStr = true;
        sChar = c;
      } else if (c === ',') {
        items.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
  }
  items.push(cur.trim());
  return items;
}

const orgs = extractTableRows(ngoSql, 'organizations');
const issues = extractTableRows(ngoSql, 'civic_issues');
const campaigns = extractTableRows(ngoSql, 'campaigns');
const citizens = extractTableRows(citSql, 'citizen_profiles');
const interactions = extractTableRows(citSql, 'issue_interactions');
const cleanups = extractTableRows(citSql, 'cleanup_events');

console.log(`Parsed: orgs=${orgs.length}, issues=${issues.length}, campaigns=${campaigns.length}, citizens=${citizens.length}, interactions=${interactions.length}, cleanups=${cleanups.length}`);

// Map Citizens by ID
const citizenMap = new Map();
citizens.forEach(c => {
  // citizen_id: c[0], display_name: c[1], email: c[2], city: c[3]
  citizenMap.set(c[0], {
    id: c[0],
    name: c[1] || 'Citizen Advocate',
    email: c[2],
    city: c[3]
  });
});

// Map Organizations by ID
const orgMap = new Map();
orgs.forEach(o => {
  // organization_id: o[0], name: o[1], category: o[2], desc: o[3], city: o[4]
  orgMap.set(o[0], {
    id: o[0],
    name: o[1] || 'JanSevak Civic Partner',
    category: o[2],
    city: o[4]
  });
});

// Map Interactions by Issue ID
const interactionMap = new Map();
interactions.forEach(it => {
  // interaction_id: it[0], citizen_id: it[1], issue_id: it[2], type: it[3], text: it[4], created_at: it[5]
  const issueId = it[2];
  if (!interactionMap.has(issueId)) interactionMap.set(issueId, []);
  if (it[4] && it[4] !== 'NULL') {
    const cit = citizenMap.get(it[1]) || { name: 'Active Citizen' };
    interactionMap.get(issueId).push({
      author: cit.name,
      text: it[4],
      time: it[5] ? '1h ago' : 'Recently'
    });
  }
});

// Category Images Palette
const CATEGORY_IMAGES = {
  Roads: [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80'
  ],
  Water: [
    'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80'
  ],
  Sanitation: [
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80'
  ],
  Streetlights: [
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
  ],
  'Public Safety': [
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80'
  ],
  Parks: [
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80'
  ],
  Community: [
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80'
  ]
};

const CATEGORY_MAP = {
  waste_management: 'Sanitation',
  road_safety: 'Roads',
  water_supply: 'Water',
  drainage: 'Water',
  street_lighting: 'Streetlights',
  public_health: 'Public Safety',
  accessibility: 'Roads',
  green_space: 'Parks',
  education_access: 'Community',
  animal_welfare: 'Community'
};

const STATUS_MAP = {
  reported: 'Reported',
  community_validated: 'Reported',
  under_review: 'Under Review',
  assigned: 'In Progress',
  in_progress: 'In Progress',
  awaiting_government: 'Under Review',
  resolved: 'Resolved',
  reopened: 'Reported'
};

const PRIORITY_MAP = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Urgent'
};

// Generate Enhanced Civic Posts from Issues
const enrichedPosts = [];
const postLimit = 18;

for (let i = 0; i < Math.min(issues.length, postLimit); i++) {
  const row = issues[i];
  const issueId = row[0];
  const rawTitle = row[1];
  const rawCat = row[2];
  const urgency = row[3];
  const rawStatus = row[4];
  const city = row[5];
  const locality = row[7] || 'Ward 112';
  const desc = row[11];
  const citRef = row[12];

  const category = CATEGORY_MAP[rawCat] || 'Sanitation';
  const status = STATUS_MAP[rawStatus] || 'Reported';
  const priority = PRIORITY_MAP[urgency] || 'Medium';

  const cit = citizenMap.get(citRef) || {
    name: ['Priya Sharma', 'Rahul Varma', 'Deepak Gowda', 'Ananya S.', 'Manish K.'][i % 5]
  };

  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.Sanitation;
  const imageUrl = images[i % images.length];

  const comments = (interactionMap.get(issueId) || []).map((c, idx) => ({
    id: `com-${issueId}-${idx}`,
    author: c.author,
    avatar: `https://images.unsplash.com/photo-${1530000000000 + (idx * 500000)}?auto=format&fit=crop&w=256&q=80`,
    text: c.text,
    time: c.time,
    isOfficial: idx === 0 && (status === 'In Progress' || status === 'Resolved')
  }));

  // Ensure every post has at least 2 comments from citizens
  if (comments.length === 0) {
    comments.push(
      {
        id: `com-${issueId}-1`,
        author: 'Suresh Kumar',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        text: 'This is affecting morning commuters and students. Urgent civic intervention needed.',
        time: '2h ago',
        isOfficial: false
      },
      {
        id: `com-${issueId}-2`,
        author: 'Ward 112 Civic Volunteer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        text: 'Noted and escalated to the local ward engineer desk. Upvoting for priority queue.',
        time: '1h ago',
        isOfficial: true
      }
    );
  }

  const cleanTitle = rawTitle.replace(/^Demo\s+/i, '').replace(/#\d+$/, '').trim();
  const titleCapitalized = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) + ` at ${locality}`;

  enrichedPosts.push({
    id: `sql-post-${i + 1}`,
    reporter: {
      id: `rep-${citRef || i}`,
      name: cit.name,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + (i * 3000000)}?auto=format&fit=crop&w=256&q=80`,
      isVerified: i % 2 === 0,
      wardOrArea: `${locality} · ${city}`
    },
    timestamp: new Date(Date.now() - (i * 3600000 * 4)).toISOString(),
    formattedTime: `${(i % 12) + 1}:30 ${i % 2 === 0 ? 'AM' : 'PM'}`,
    category,
    title: titleCapitalized,
    description: `${desc} Verified civic concern logged by resident of ${locality}, ${city}. Community upvotes determine dispatch ranking for local authorities.`,
    status,
    priority,
    imageUrl,
    images: [imageUrl, images[(i + 1) % images.length]],
    imageFallbackGradient: 'linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)',
    upvotes: 45 + (i * 12),
    hasUpvoted: i % 3 === 0,
    commentsCount: comments.length,
    comments,
    isBookmarked: false,
    whyItMatters: `Prompt civic action at ${locality} improves public safety, hygiene, and neighborhood quality of life.`,
    communityActionLabel: status === 'Resolved' ? 'View Resolution Proof' : 'Support & Upvote',
    suggestiveRemarks: {
      whatWeHaveToDo: [
        'Keep the perimeter clear and report any further deterioration.',
        'Support and upvote this issue to raise its urgency in the Ward Dispatch.',
        'Coordinate with nearby residents to maintain neighborhood cleanliness.'
      ],
      whatGovernmentHasToDo: [
        `Deploy the designated engineering crew to ${locality}.`,
        'Complete on-site inspection and mark timeline for repair.',
        'Upload verified after-photos to credit citizen reporter points.'
      ]
    }
  });
}

// Generate NGO Volunteer Drives from Campaigns, Organizations & Cleanups
const DRIVE_CATEGORIES = ['Cleanup', 'Tree Planting', 'Drainage', 'Sanitation', 'Social Work', 'Health Camp'];

const volunteerDrives = [];

// 1. Convert Cleanups into Drives
cleanups.slice(0, 8).forEach((cl, idx) => {
  const eventId = cl[0];
  const orgRef = cl[3];
  const title = cl[4];
  const city = cl[6] || 'Bengaluru';
  const locality = cl[8] || 'Ward 112';
  const capacity = parseInt(cl[10], 10) || 25;
  const org = orgMap.get(orgRef) || { name: 'Green Action Volunteer Alliance' };

  const category = DRIVE_CATEGORIES[idx % DRIVE_CATEGORIES.length];
  const joined = Math.floor(capacity * 0.65);

  const titles = [
    `100ft Road Plastic Cleanup & Segregation Drive`,
    `Ward 112 Storm Drain Desilting & Mosquito Prevention`,
    `Defense Colony Native Tree Plantation Drive`,
    `Ulsoor Lake Perimeter Community Cleanliness Action`,
    `Tippasandra Market Wet Waste Audit & Composting`,
    `Domlur Flyover Underpass Painting & Clean Street Drive`,
    `Koramangala Community Rainwater Percolation Drive`,
    `Old Airport Road Pedestrian Safety & Crosswalk Drive`
  ];

  volunteerDrives.push({
    id: `drive-${idx + 1}`,
    title: titles[idx] || `${title} at ${locality}`,
    organization: org.name,
    orgId: orgRef || `org-${idx}`,
    category,
    location: `${locality}, ${city}`,
    city,
    date: `Saturday, Oct ${24 + (idx % 7)}, 2026`,
    time: idx % 2 === 0 ? '7:30 AM – 10:30 AM' : '8:00 AM – 11:30 AM',
    volunteersNeeded: capacity,
    volunteersJoined: joined,
    pointsReward: 100,
    status: 'Open',
    description: `Join NGO volunteers and local residents at ${locality} for active social and cleanliness impact. Hands-on cleanup, waste segregation, and community beautification. Tools, gloves, and refreshments provided.`,
    safetyInstructions: [
      'Heavy-duty safety gloves and trash pickers provided on arrival.',
      'Wear sturdy closed shoes and comfortable outdoor clothing.',
      'Drinking water refill stations available — bring your reusable water bottle.',
      'Take photos during the drive to submit in the app and claim your +100 volunteering points!'
    ],
    userStatus: idx === 0 ? 'not_joined' : (idx === 1 ? 'joined' : 'not_joined')
  });
});

// Also add drives from Campaigns
campaigns.slice(0, 6).forEach((camp, idx) => {
  const campId = camp[0];
  const orgId = camp[1];
  const title = camp[2];
  const campType = camp[3];
  const obj = camp[4];
  const city = camp[5] || 'Bengaluru';
  const locality = camp[7] || 'Ward 112';
  const cap = parseInt(camp[10], 10) || 30;

  const org = orgMap.get(orgId) || { name: 'PrajaPulse NGO Partner' };
  const joined = Math.floor(cap * 0.5);

  volunteerDrives.push({
    id: `drive-camp-${idx + 1}`,
    title: `${org.name}: ${campType.replace('_', ' ').toUpperCase()} Action`,
    organization: org.name,
    orgId,
    category: campType.includes('tree') ? 'Tree Planting' : (campType.includes('drain') ? 'Drainage' : 'Cleanup'),
    location: `${locality}, ${city}`,
    city,
    date: `Sunday, Nov ${1 + idx}, 2026`,
    time: '8:00 AM – 11:00 AM',
    volunteersNeeded: cap,
    volunteersJoined: joined,
    pointsReward: 100,
    status: 'Open',
    description: `${obj} Organized in coordination with municipal ward committees and JanSevak civic volunteers.`,
    safetyInstructions: [
      'Site briefing starts promptly at 8:00 AM.',
      'Safety equipment provided by the organizers.',
      'Upload action photo via JanSevak upon completion to get +100 Points.'
    ],
    userStatus: 'not_joined'
  });
});

console.log(`Generated ${enrichedPosts.length} enriched posts and ${volunteerDrives.length} volunteer drives.`);

// Write datasetBridge.ts
const fileContent = `// Auto-generated Dataset Bridge from PrajaPulse SQL Datasets
// Sources: prajapulse_ngo_dataset_1000.sql & prajapulse_citizen_dataset_1000.sql

import { CivicPost, VolunteerDrive } from '../types';

export const DATASET_CIVIC_POSTS: CivicPost[] = ${JSON.stringify(enrichedPosts, null, 2)};

export const DATASET_VOLUNTEER_DRIVES: VolunteerDrive[] = ${JSON.stringify(volunteerDrives, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'mockData', 'datasetBridge.ts'), fileContent, 'utf8');
console.log('Successfully wrote src/mockData/datasetBridge.ts!');
