// Auto-generated Dataset Bridge from PrajaPulse SQL Datasets
// Sources: prajapulse_ngo_dataset_1000.sql & prajapulse_citizen_dataset_1000.sql

import { CivicPost, VolunteerDrive } from '../types';

export const DATASET_CIVIC_POSTS: CivicPost[] = [
  {
    "id": "sql-post-1",
    "reporter": {
      "id": "rep-CIT00001",
      "name": "Priya Sharma",
      "avatar": "https://images.unsplash.com/photo-1500000000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": true,
      "wardOrArea": "Ward 02 · Pune"
    },
    "timestamp": "2026-10-19T14:19:06.248Z",
    "formattedTime": "1:30 AM",
    "category": "Sanitation",
    "title": "Waste management concern at Ward 02",
    "description": "Synthetic issue description 001; verify before action. Verified civic concern logged by resident of Ward 02, Pune. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Reported",
    "priority": "Medium",
    "imageUrl": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 45,
    "hasUpvoted": true,
    "commentsCount": 1,
    "comments": [
      {
        "id": "com-ISS00001-0",
        "author": "Rohan Das 013",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 02 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 02.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-2",
    "reporter": {
      "id": "rep-CIT00002",
      "name": "Rahul Varma",
      "avatar": "https://images.unsplash.com/photo-1500003000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": false,
      "wardOrArea": "Ward 03 · Gaya"
    },
    "timestamp": "2026-10-19T10:19:06.250Z",
    "formattedTime": "2:30 PM",
    "category": "Roads",
    "title": "Road safety concern at Ward 03",
    "description": "Synthetic issue description 002; verify before action. Verified civic concern logged by resident of Ward 03, Gaya. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Under Review",
    "priority": "High",
    "imageUrl": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 57,
    "hasUpvoted": false,
    "commentsCount": 1,
    "comments": [
      {
        "id": "com-ISS00002-0",
        "author": "Sana Khan",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 03 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 03.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-3",
    "reporter": {
      "id": "rep-CIT00003",
      "name": "Deepak Gowda",
      "avatar": "https://images.unsplash.com/photo-1500006000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": true,
      "wardOrArea": "Ward 04 · Bengaluru"
    },
    "timestamp": "2026-10-19T06:19:06.250Z",
    "formattedTime": "3:30 AM",
    "category": "Water",
    "title": "Water supply concern at Ward 04",
    "description": "Synthetic issue description 003; verify before action. Verified civic concern logged by resident of Ward 04, Bengaluru. Community upvotes determine dispatch ranking for local authorities.",
    "status": "In Progress",
    "priority": "Urgent",
    "imageUrl": "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 69,
    "hasUpvoted": false,
    "commentsCount": 2,
    "comments": [
      {
        "id": "com-ISS00003-1",
        "author": "Suresh Kumar",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
        "text": "This is affecting morning commuters and students. Urgent civic intervention needed.",
        "time": "2h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00003-2",
        "author": "Ward 112 Civic Volunteer",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        "text": "Noted and escalated to the local ward engineer desk. Upvoting for priority queue.",
        "time": "1h ago",
        "isOfficial": true
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 04 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 04.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-4",
    "reporter": {
      "id": "rep-CIT00004",
      "name": "Ananya S.",
      "avatar": "https://images.unsplash.com/photo-1500009000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": false,
      "wardOrArea": "Ward 05 · Lucknow"
    },
    "timestamp": "2026-10-19T02:19:06.250Z",
    "formattedTime": "4:30 PM",
    "category": "Water",
    "title": "Drainage concern at Ward 05",
    "description": "Synthetic issue description 004; verify before action. Verified civic concern logged by resident of Ward 05, Lucknow. Community upvotes determine dispatch ranking for local authorities.",
    "status": "In Progress",
    "priority": "Low",
    "imageUrl": "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 81,
    "hasUpvoted": true,
    "commentsCount": 2,
    "comments": [
      {
        "id": "com-ISS00004-0",
        "author": "Kabir Verma 096",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "Can this be checked by the local team?",
        "time": "1h ago",
        "isOfficial": true
      },
      {
        "id": "com-ISS00004-1",
        "author": "Arjun Rao 048",
        "avatar": "https://images.unsplash.com/photo-1530000500000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 05 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 05.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-5",
    "reporter": {
      "id": "rep-CIT00005",
      "name": "Manish K.",
      "avatar": "https://images.unsplash.com/photo-1500012000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": true,
      "wardOrArea": "Ward 06 · Pune"
    },
    "timestamp": "2026-10-18T22:19:06.250Z",
    "formattedTime": "5:30 AM",
    "category": "Streetlights",
    "title": "Street lighting concern at Ward 06",
    "description": "Synthetic issue description 005; verify before action. Verified civic concern logged by resident of Ward 06, Pune. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Under Review",
    "priority": "Medium",
    "imageUrl": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 93,
    "hasUpvoted": false,
    "commentsCount": 1,
    "comments": [
      {
        "id": "com-ISS00005-0",
        "author": "Vivaan Gupta 020",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "Please share a verified update.",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 06 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 06.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-6",
    "reporter": {
      "id": "rep-CIT00006",
      "name": "Priya Sharma",
      "avatar": "https://images.unsplash.com/photo-1500015000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": false,
      "wardOrArea": "Ward 07 · Gaya"
    },
    "timestamp": "2026-10-18T18:19:06.250Z",
    "formattedTime": "6:30 PM",
    "category": "Public Safety",
    "title": "Public health concern at Ward 07",
    "description": "Synthetic issue description 006; verify before action. Verified civic concern logged by resident of Ward 07, Gaya. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Resolved",
    "priority": "High",
    "imageUrl": "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 105,
    "hasUpvoted": false,
    "commentsCount": 2,
    "comments": [
      {
        "id": "com-ISS00006-1",
        "author": "Suresh Kumar",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
        "text": "This is affecting morning commuters and students. Urgent civic intervention needed.",
        "time": "2h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00006-2",
        "author": "Ward 112 Civic Volunteer",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        "text": "Noted and escalated to the local ward engineer desk. Upvoting for priority queue.",
        "time": "1h ago",
        "isOfficial": true
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 07 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "View Resolution Proof",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 07.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-7",
    "reporter": {
      "id": "rep-CIT00007",
      "name": "Rahul Varma",
      "avatar": "https://images.unsplash.com/photo-1500018000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": true,
      "wardOrArea": "Ward 08 · Bengaluru"
    },
    "timestamp": "2026-10-18T14:19:06.250Z",
    "formattedTime": "7:30 AM",
    "category": "Roads",
    "title": "Accessibility concern at Ward 08",
    "description": "Synthetic issue description 007; verify before action. Verified civic concern logged by resident of Ward 08, Bengaluru. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Reported",
    "priority": "Urgent",
    "imageUrl": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 117,
    "hasUpvoted": true,
    "commentsCount": 1,
    "comments": [
      {
        "id": "com-ISS00007-0",
        "author": "Diya Nair 027",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 08 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 08.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-8",
    "reporter": {
      "id": "rep-CIT00008",
      "name": "Deepak Gowda",
      "avatar": "https://images.unsplash.com/photo-1500021000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": false,
      "wardOrArea": "Ward 09 · Lucknow"
    },
    "timestamp": "2026-10-18T10:19:06.251Z",
    "formattedTime": "8:30 PM",
    "category": "Parks",
    "title": "Green space concern at Ward 09",
    "description": "Synthetic issue description 008; verify before action. Verified civic concern logged by resident of Ward 09, Lucknow. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Reported",
    "priority": "Low",
    "imageUrl": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 129,
    "hasUpvoted": false,
    "commentsCount": 3,
    "comments": [
      {
        "id": "com-ISS00008-0",
        "author": "Rohan Das 043",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00008-1",
        "author": "Arjun Rao 058",
        "avatar": "https://images.unsplash.com/photo-1530000500000?auto=format&fit=crop&w=256&q=80",
        "text": "Can this be checked by the local team?",
        "time": "1h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00008-2",
        "author": "Ananya Singh 082",
        "avatar": "https://images.unsplash.com/photo-1530001000000?auto=format&fit=crop&w=256&q=80",
        "text": "Can this be checked by the local team?",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 09 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 09.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-9",
    "reporter": {
      "id": "rep-CIT00009",
      "name": "Ananya S.",
      "avatar": "https://images.unsplash.com/photo-1500024000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": true,
      "wardOrArea": "Ward 10 · Pune"
    },
    "timestamp": "2026-10-18T06:19:06.251Z",
    "formattedTime": "9:30 AM",
    "category": "Community",
    "title": "Education access concern at Ward 10",
    "description": "Synthetic issue description 009; verify before action. Verified civic concern logged by resident of Ward 10, Pune. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Reported",
    "priority": "Medium",
    "imageUrl": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 141,
    "hasUpvoted": false,
    "commentsCount": 2,
    "comments": [
      {
        "id": "com-ISS00009-1",
        "author": "Suresh Kumar",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
        "text": "This is affecting morning commuters and students. Urgent civic intervention needed.",
        "time": "2h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00009-2",
        "author": "Ward 112 Civic Volunteer",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        "text": "Noted and escalated to the local ward engineer desk. Upvoting for priority queue.",
        "time": "1h ago",
        "isOfficial": true
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 10 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 10.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-10",
    "reporter": {
      "id": "rep-CIT00010",
      "name": "Manish K.",
      "avatar": "https://images.unsplash.com/photo-1500027000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": false,
      "wardOrArea": "Ward 01 · Gaya"
    },
    "timestamp": "2026-10-18T02:19:06.251Z",
    "formattedTime": "10:30 PM",
    "category": "Community",
    "title": "Animal welfare concern at Ward 01",
    "description": "Synthetic issue description 010; verify before action. Verified civic concern logged by resident of Ward 01, Gaya. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Under Review",
    "priority": "High",
    "imageUrl": "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 153,
    "hasUpvoted": true,
    "commentsCount": 3,
    "comments": [
      {
        "id": "com-ISS00010-0",
        "author": "Meera Patel 084",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "I can help with this.",
        "time": "1h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00010-1",
        "author": "Meera Patel 034",
        "avatar": "https://images.unsplash.com/photo-1530000500000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00010-2",
        "author": "Ishita Kumar 055",
        "avatar": "https://images.unsplash.com/photo-1530001000000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 01 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 01.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-11",
    "reporter": {
      "id": "rep-CIT00011",
      "name": "Priya Sharma",
      "avatar": "https://images.unsplash.com/photo-1500030000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": true,
      "wardOrArea": "Ward 02 · Bengaluru"
    },
    "timestamp": "2026-10-17T22:19:06.251Z",
    "formattedTime": "11:30 AM",
    "category": "Sanitation",
    "title": "Waste management concern at Ward 02",
    "description": "Synthetic issue description 011; verify before action. Verified civic concern logged by resident of Ward 02, Bengaluru. Community upvotes determine dispatch ranking for local authorities.",
    "status": "In Progress",
    "priority": "Urgent",
    "imageUrl": "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 165,
    "hasUpvoted": false,
    "commentsCount": 2,
    "comments": [
      {
        "id": "com-ISS00011-0",
        "author": "Kabir Verma 046",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "I can help with this.",
        "time": "1h ago",
        "isOfficial": true
      },
      {
        "id": "com-ISS00011-1",
        "author": "Vivaan Gupta 070",
        "avatar": "https://images.unsplash.com/photo-1530000500000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 02 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 02.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-12",
    "reporter": {
      "id": "rep-CIT00012",
      "name": "Rahul Varma",
      "avatar": "https://images.unsplash.com/photo-1500033000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": false,
      "wardOrArea": "Ward 03 · Lucknow"
    },
    "timestamp": "2026-10-17T18:19:06.251Z",
    "formattedTime": "12:30 PM",
    "category": "Roads",
    "title": "Road safety concern at Ward 03",
    "description": "Synthetic issue description 012; verify before action. Verified civic concern logged by resident of Ward 03, Lucknow. Community upvotes determine dispatch ranking for local authorities.",
    "status": "In Progress",
    "priority": "Low",
    "imageUrl": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 177,
    "hasUpvoted": false,
    "commentsCount": 2,
    "comments": [
      {
        "id": "com-ISS00012-1",
        "author": "Suresh Kumar",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
        "text": "This is affecting morning commuters and students. Urgent civic intervention needed.",
        "time": "2h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00012-2",
        "author": "Ward 112 Civic Volunteer",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        "text": "Noted and escalated to the local ward engineer desk. Upvoting for priority queue.",
        "time": "1h ago",
        "isOfficial": true
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 03 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 03.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-13",
    "reporter": {
      "id": "rep-CIT00013",
      "name": "Deepak Gowda",
      "avatar": "https://images.unsplash.com/photo-1500036000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": true,
      "wardOrArea": "Ward 04 · Pune"
    },
    "timestamp": "2026-10-17T14:19:06.251Z",
    "formattedTime": "1:30 AM",
    "category": "Water",
    "title": "Water supply concern at Ward 04",
    "description": "Synthetic issue description 013; verify before action. Verified civic concern logged by resident of Ward 04, Pune. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Under Review",
    "priority": "Medium",
    "imageUrl": "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 189,
    "hasUpvoted": true,
    "commentsCount": 2,
    "comments": [
      {
        "id": "com-ISS00013-0",
        "author": "Kabir Verma 096",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00013-1",
        "author": "Meera Patel 024",
        "avatar": "https://images.unsplash.com/photo-1530000500000?auto=format&fit=crop&w=256&q=80",
        "text": "Can this be checked by the local team?",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 04 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 04.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-14",
    "reporter": {
      "id": "rep-CIT00014",
      "name": "Ananya S.",
      "avatar": "https://images.unsplash.com/photo-1500039000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": false,
      "wardOrArea": "Ward 05 · Gaya"
    },
    "timestamp": "2026-10-17T10:19:06.251Z",
    "formattedTime": "2:30 PM",
    "category": "Water",
    "title": "Drainage concern at Ward 05",
    "description": "Synthetic issue description 014; verify before action. Verified civic concern logged by resident of Ward 05, Gaya. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Resolved",
    "priority": "High",
    "imageUrl": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 201,
    "hasUpvoted": false,
    "commentsCount": 1,
    "comments": [
      {
        "id": "com-ISS00014-0",
        "author": "Kabir Verma 046",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "Please share a verified update.",
        "time": "1h ago",
        "isOfficial": true
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 05 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "View Resolution Proof",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 05.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-15",
    "reporter": {
      "id": "rep-CIT00015",
      "name": "Manish K.",
      "avatar": "https://images.unsplash.com/photo-1500042000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": true,
      "wardOrArea": "Ward 06 · Bengaluru"
    },
    "timestamp": "2026-10-17T06:19:06.251Z",
    "formattedTime": "3:30 AM",
    "category": "Streetlights",
    "title": "Street lighting concern at Ward 06",
    "description": "Synthetic issue description 015; verify before action. Verified civic concern logged by resident of Ward 06, Bengaluru. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Reported",
    "priority": "Urgent",
    "imageUrl": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 213,
    "hasUpvoted": false,
    "commentsCount": 1,
    "comments": [
      {
        "id": "com-ISS00015-0",
        "author": "Sana Khan 039",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "This needs attention.",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 06 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 06.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-16",
    "reporter": {
      "id": "rep-CIT00016",
      "name": "Priya Sharma",
      "avatar": "https://images.unsplash.com/photo-1500045000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": false,
      "wardOrArea": "Ward 07 · Lucknow"
    },
    "timestamp": "2026-10-17T02:19:06.251Z",
    "formattedTime": "4:30 PM",
    "category": "Public Safety",
    "title": "Public health concern at Ward 07",
    "description": "Synthetic issue description 016; verify before action. Verified civic concern logged by resident of Ward 07, Lucknow. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Reported",
    "priority": "Low",
    "imageUrl": "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 225,
    "hasUpvoted": true,
    "commentsCount": 2,
    "comments": [
      {
        "id": "com-ISS00016-1",
        "author": "Suresh Kumar",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
        "text": "This is affecting morning commuters and students. Urgent civic intervention needed.",
        "time": "2h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00016-2",
        "author": "Ward 112 Civic Volunteer",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        "text": "Noted and escalated to the local ward engineer desk. Upvoting for priority queue.",
        "time": "1h ago",
        "isOfficial": true
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 07 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 07.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-17",
    "reporter": {
      "id": "rep-CIT00017",
      "name": "Rahul Varma",
      "avatar": "https://images.unsplash.com/photo-1500048000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": true,
      "wardOrArea": "Ward 08 · Pune"
    },
    "timestamp": "2026-10-16T22:19:06.251Z",
    "formattedTime": "5:30 AM",
    "category": "Roads",
    "title": "Accessibility concern at Ward 08",
    "description": "Synthetic issue description 017; verify before action. Verified civic concern logged by resident of Ward 08, Pune. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Reported",
    "priority": "Medium",
    "imageUrl": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 237,
    "hasUpvoted": false,
    "commentsCount": 1,
    "comments": [
      {
        "id": "com-ISS00017-0",
        "author": "Diya Nair 087",
        "avatar": "https://images.unsplash.com/photo-1530000000000?auto=format&fit=crop&w=256&q=80",
        "text": "Please share a verified update.",
        "time": "1h ago",
        "isOfficial": false
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 08 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 08.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  },
  {
    "id": "sql-post-18",
    "reporter": {
      "id": "rep-CIT00018",
      "name": "Deepak Gowda",
      "avatar": "https://images.unsplash.com/photo-1500051000000?auto=format&fit=crop&w=256&q=80",
      "isVerified": false,
      "wardOrArea": "Ward 09 · Gaya"
    },
    "timestamp": "2026-10-16T18:19:06.251Z",
    "formattedTime": "6:30 PM",
    "category": "Parks",
    "title": "Green space concern at Ward 09",
    "description": "Synthetic issue description 018; verify before action. Verified civic concern logged by resident of Ward 09, Gaya. Community upvotes determine dispatch ranking for local authorities.",
    "status": "Under Review",
    "priority": "High",
    "imageUrl": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    "images": [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
    ],
    "imageFallbackGradient": "linear-gradient(135deg, #0f2d59 0%, #1e3a8a 100%)",
    "upvotes": 249,
    "hasUpvoted": false,
    "commentsCount": 2,
    "comments": [
      {
        "id": "com-ISS00018-1",
        "author": "Suresh Kumar",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
        "text": "This is affecting morning commuters and students. Urgent civic intervention needed.",
        "time": "2h ago",
        "isOfficial": false
      },
      {
        "id": "com-ISS00018-2",
        "author": "Ward 112 Civic Volunteer",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        "text": "Noted and escalated to the local ward engineer desk. Upvoting for priority queue.",
        "time": "1h ago",
        "isOfficial": true
      }
    ],
    "isBookmarked": false,
    "whyItMatters": "Prompt civic action at Ward 09 improves public safety, hygiene, and neighborhood quality of life.",
    "communityActionLabel": "Support & Upvote",
    "suggestiveRemarks": {
      "whatWeHaveToDo": [
        "Keep the perimeter clear and report any further deterioration.",
        "Support and upvote this issue to raise its urgency in the Ward Dispatch.",
        "Coordinate with nearby residents to maintain neighborhood cleanliness."
      ],
      "whatGovernmentHasToDo": [
        "Deploy the designated engineering crew to Ward 09.",
        "Complete on-site inspection and mark timeline for repair.",
        "Upload verified after-photos to credit citizen reporter points."
      ]
    }
  }
];

export const DATASET_VOLUNTEER_DRIVES: VolunteerDrive[] = [
  {
    "id": "drive-1",
    "title": "100ft Road Plastic Cleanup & Segregation Drive",
    "organization": "Green Action Volunteer Alliance",
    "orgId": "NULL",
    "category": "Cleanup",
    "location": "Ward 02, Lucknow",
    "city": "Lucknow",
    "date": "Saturday, Oct 24, 2026",
    "time": "7:30 AM – 10:30 AM",
    "volunteersNeeded": 59,
    "volunteersJoined": 38,
    "pointsReward": 100,
    "status": "Open",
    "description": "Join NGO volunteers and local residents at Ward 02 for active social and cleanliness impact. Hands-on cleanup, waste segregation, and community beautification. Tools, gloves, and refreshments provided.",
    "safetyInstructions": [
      "Heavy-duty safety gloves and trash pickers provided on arrival.",
      "Wear sturdy closed shoes and comfortable outdoor clothing.",
      "Drinking water refill stations available — bring your reusable water bottle.",
      "Take photos during the drive to submit in the app and claim your +100 volunteering points!"
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-2",
    "title": "Ward 112 Storm Drain Desilting & Mosquito Prevention",
    "organization": "Sahyog Trust Kanpur Demo 02",
    "orgId": "ORG0002",
    "category": "Tree Planting",
    "location": "Ward 03, Kanpur",
    "city": "Kanpur",
    "date": "Saturday, Oct 25, 2026",
    "time": "8:00 AM – 11:30 AM",
    "volunteersNeeded": 22,
    "volunteersJoined": 14,
    "pointsReward": 100,
    "status": "Open",
    "description": "Join NGO volunteers and local residents at Ward 03 for active social and cleanliness impact. Hands-on cleanup, waste segregation, and community beautification. Tools, gloves, and refreshments provided.",
    "safetyInstructions": [
      "Heavy-duty safety gloves and trash pickers provided on arrival.",
      "Wear sturdy closed shoes and comfortable outdoor clothing.",
      "Drinking water refill stations available — bring your reusable water bottle.",
      "Take photos during the drive to submit in the app and claim your +100 volunteering points!"
    ],
    "userStatus": "joined"
  },
  {
    "id": "drive-3",
    "title": "Defense Colony Native Tree Plantation Drive",
    "organization": "Green Action Volunteer Alliance",
    "orgId": "NULL",
    "category": "Drainage",
    "location": "Ward 04, Varanasi",
    "city": "Varanasi",
    "date": "Saturday, Oct 26, 2026",
    "time": "7:30 AM – 10:30 AM",
    "volunteersNeeded": 10,
    "volunteersJoined": 6,
    "pointsReward": 100,
    "status": "Open",
    "description": "Join NGO volunteers and local residents at Ward 04 for active social and cleanliness impact. Hands-on cleanup, waste segregation, and community beautification. Tools, gloves, and refreshments provided.",
    "safetyInstructions": [
      "Heavy-duty safety gloves and trash pickers provided on arrival.",
      "Wear sturdy closed shoes and comfortable outdoor clothing.",
      "Drinking water refill stations available — bring your reusable water bottle.",
      "Take photos during the drive to submit in the app and claim your +100 volunteering points!"
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-4",
    "title": "Ulsoor Lake Perimeter Community Cleanliness Action",
    "organization": "Udaan Network Pune Demo 04",
    "orgId": "ORG0004",
    "category": "Sanitation",
    "location": "Ward 05, Pune",
    "city": "Pune",
    "date": "Saturday, Oct 27, 2026",
    "time": "8:00 AM – 11:30 AM",
    "volunteersNeeded": 34,
    "volunteersJoined": 22,
    "pointsReward": 100,
    "status": "Open",
    "description": "Join NGO volunteers and local residents at Ward 05 for active social and cleanliness impact. Hands-on cleanup, waste segregation, and community beautification. Tools, gloves, and refreshments provided.",
    "safetyInstructions": [
      "Heavy-duty safety gloves and trash pickers provided on arrival.",
      "Wear sturdy closed shoes and comfortable outdoor clothing.",
      "Drinking water refill stations available — bring your reusable water bottle.",
      "Take photos during the drive to submit in the app and claim your +100 volunteering points!"
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-5",
    "title": "Tippasandra Market Wet Waste Audit & Composting",
    "organization": "Green Action Volunteer Alliance",
    "orgId": "NULL",
    "category": "Social Work",
    "location": "Ward 06, Gaya",
    "city": "Gaya",
    "date": "Saturday, Oct 28, 2026",
    "time": "7:30 AM – 10:30 AM",
    "volunteersNeeded": 59,
    "volunteersJoined": 38,
    "pointsReward": 100,
    "status": "Open",
    "description": "Join NGO volunteers and local residents at Ward 06 for active social and cleanliness impact. Hands-on cleanup, waste segregation, and community beautification. Tools, gloves, and refreshments provided.",
    "safetyInstructions": [
      "Heavy-duty safety gloves and trash pickers provided on arrival.",
      "Wear sturdy closed shoes and comfortable outdoor clothing.",
      "Drinking water refill stations available — bring your reusable water bottle.",
      "Take photos during the drive to submit in the app and claim your +100 volunteering points!"
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-6",
    "title": "Domlur Flyover Underpass Painting & Clean Street Drive",
    "organization": "Community Collective Patna Demo 06",
    "orgId": "ORG0006",
    "category": "Health Camp",
    "location": "Ward 07, Chennai",
    "city": "Chennai",
    "date": "Saturday, Oct 29, 2026",
    "time": "8:00 AM – 11:30 AM",
    "volunteersNeeded": 33,
    "volunteersJoined": 21,
    "pointsReward": 100,
    "status": "Open",
    "description": "Join NGO volunteers and local residents at Ward 07 for active social and cleanliness impact. Hands-on cleanup, waste segregation, and community beautification. Tools, gloves, and refreshments provided.",
    "safetyInstructions": [
      "Heavy-duty safety gloves and trash pickers provided on arrival.",
      "Wear sturdy closed shoes and comfortable outdoor clothing.",
      "Drinking water refill stations available — bring your reusable water bottle.",
      "Take photos during the drive to submit in the app and claim your +100 volunteering points!"
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-7",
    "title": "Koramangala Community Rainwater Percolation Drive",
    "organization": "Green Action Volunteer Alliance",
    "orgId": "NULL",
    "category": "Cleanup",
    "location": "Ward 08, Patna",
    "city": "Patna",
    "date": "Saturday, Oct 30, 2026",
    "time": "7:30 AM – 10:30 AM",
    "volunteersNeeded": 17,
    "volunteersJoined": 11,
    "pointsReward": 100,
    "status": "Open",
    "description": "Join NGO volunteers and local residents at Ward 08 for active social and cleanliness impact. Hands-on cleanup, waste segregation, and community beautification. Tools, gloves, and refreshments provided.",
    "safetyInstructions": [
      "Heavy-duty safety gloves and trash pickers provided on arrival.",
      "Wear sturdy closed shoes and comfortable outdoor clothing.",
      "Drinking water refill stations available — bring your reusable water bottle.",
      "Take photos during the drive to submit in the app and claim your +100 volunteering points!"
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-8",
    "title": "Old Airport Road Pedestrian Safety & Crosswalk Drive",
    "organization": "Sahyog Initiative Chennai Demo 08",
    "orgId": "ORG0008",
    "category": "Tree Planting",
    "location": "Ward 09, Nagpur",
    "city": "Nagpur",
    "date": "Saturday, Oct 24, 2026",
    "time": "8:00 AM – 11:30 AM",
    "volunteersNeeded": 46,
    "volunteersJoined": 29,
    "pointsReward": 100,
    "status": "Open",
    "description": "Join NGO volunteers and local residents at Ward 09 for active social and cleanliness impact. Hands-on cleanup, waste segregation, and community beautification. Tools, gloves, and refreshments provided.",
    "safetyInstructions": [
      "Heavy-duty safety gloves and trash pickers provided on arrival.",
      "Wear sturdy closed shoes and comfortable outdoor clothing.",
      "Drinking water refill stations available — bring your reusable water bottle.",
      "Take photos during the drive to submit in the app and claim your +100 volunteering points!"
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-camp-1",
    "title": "Green Collective Lucknow Demo 01: AWARENESS Action",
    "organization": "Green Collective Lucknow Demo 01",
    "orgId": "ORG0001",
    "category": "Cleanup",
    "location": "Ward 02, Lucknow",
    "city": "Lucknow",
    "date": "Sunday, Nov 1, 2026",
    "time": "8:00 AM – 11:00 AM",
    "volunteersNeeded": 8,
    "volunteersJoined": 4,
    "pointsReward": 100,
    "status": "Open",
    "description": "Improve drainage outcomes through a documented intervention. Organized in coordination with municipal ward committees and JanSevak civic volunteers.",
    "safetyInstructions": [
      "Site briefing starts promptly at 8:00 AM.",
      "Safety equipment provided by the organizers.",
      "Upload action photo via JanSevak upon completion to get +100 Points."
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-camp-2",
    "title": "Sahyog Trust Kanpur Demo 02: ASSESSMENT Action",
    "organization": "Sahyog Trust Kanpur Demo 02",
    "orgId": "ORG0002",
    "category": "Cleanup",
    "location": "Ward 03, Kanpur",
    "city": "Kanpur",
    "date": "Sunday, Nov 2, 2026",
    "time": "8:00 AM – 11:00 AM",
    "volunteersNeeded": 11,
    "volunteersJoined": 5,
    "pointsReward": 100,
    "status": "Open",
    "description": "Improve accessibility outcomes through a documented intervention. Organized in coordination with municipal ward committees and JanSevak civic volunteers.",
    "safetyInstructions": [
      "Site briefing starts promptly at 8:00 AM.",
      "Safety equipment provided by the organizers.",
      "Upload action photo via JanSevak upon completion to get +100 Points."
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-camp-3",
    "title": "Jan Initiative Varanasi Demo 03: TRAINING Action",
    "organization": "Jan Initiative Varanasi Demo 03",
    "orgId": "ORG0003",
    "category": "Cleanup",
    "location": "Ward 04, Varanasi",
    "city": "Varanasi",
    "date": "Sunday, Nov 3, 2026",
    "time": "8:00 AM – 11:00 AM",
    "volunteersNeeded": 14,
    "volunteersJoined": 7,
    "pointsReward": 100,
    "status": "Open",
    "description": "Improve animal welfare outcomes through a documented intervention. Organized in coordination with municipal ward committees and JanSevak civic volunteers.",
    "safetyInstructions": [
      "Site briefing starts promptly at 8:00 AM.",
      "Safety equipment provided by the organizers.",
      "Upload action photo via JanSevak upon completion to get +100 Points."
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-camp-4",
    "title": "Udaan Network Pune Demo 04: COMMUNITY SUPPORT Action",
    "organization": "Udaan Network Pune Demo 04",
    "orgId": "ORG0004",
    "category": "Cleanup",
    "location": "Ward 05, Pune",
    "city": "Pune",
    "date": "Sunday, Nov 4, 2026",
    "time": "8:00 AM – 11:00 AM",
    "volunteersNeeded": 17,
    "volunteersJoined": 8,
    "pointsReward": 100,
    "status": "Open",
    "description": "Improve water supply outcomes through a documented intervention. Organized in coordination with municipal ward committees and JanSevak civic volunteers.",
    "safetyInstructions": [
      "Site briefing starts promptly at 8:00 AM.",
      "Safety equipment provided by the organizers.",
      "Upload action photo via JanSevak upon completion to get +100 Points."
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-camp-5",
    "title": "Seva Foundation Nagpur Demo 05: TREE PLANTING Action",
    "organization": "Seva Foundation Nagpur Demo 05",
    "orgId": "ORG0005",
    "category": "Tree Planting",
    "location": "Ward 06, Nagpur",
    "city": "Nagpur",
    "date": "Sunday, Nov 5, 2026",
    "time": "8:00 AM – 11:00 AM",
    "volunteersNeeded": 20,
    "volunteersJoined": 10,
    "pointsReward": 100,
    "status": "Open",
    "description": "Improve public health outcomes through a documented intervention. Organized in coordination with municipal ward committees and JanSevak civic volunteers.",
    "safetyInstructions": [
      "Site briefing starts promptly at 8:00 AM.",
      "Safety equipment provided by the organizers.",
      "Upload action photo via JanSevak upon completion to get +100 Points."
    ],
    "userStatus": "not_joined"
  },
  {
    "id": "drive-camp-6",
    "title": "Community Collective Patna Demo 06: ACCESSIBILITY AUDIT Action",
    "organization": "Community Collective Patna Demo 06",
    "orgId": "ORG0006",
    "category": "Cleanup",
    "location": "Ward 07, Patna",
    "city": "Patna",
    "date": "Sunday, Nov 6, 2026",
    "time": "8:00 AM – 11:00 AM",
    "volunteersNeeded": 23,
    "volunteersJoined": 11,
    "pointsReward": 100,
    "status": "Open",
    "description": "Improve education access outcomes through a documented intervention. Organized in coordination with municipal ward committees and JanSevak civic volunteers.",
    "safetyInstructions": [
      "Site briefing starts promptly at 8:00 AM.",
      "Safety equipment provided by the organizers.",
      "Upload action photo via JanSevak upon completion to get +100 Points."
    ],
    "userStatus": "not_joined"
  }
];
