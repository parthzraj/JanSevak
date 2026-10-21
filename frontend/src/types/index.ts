export type CivicCategory =
  | 'Roads'
  | 'Water'
  | 'Sanitation'
  | 'Streetlights'
  | 'Public Safety'
  | 'Parks'
  | 'Community';

export type IssueStatus = 'Reported' | 'Under Review' | 'In Progress' | 'Resolved';

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type AppTheme = 'light' | 'dark';

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
  isOfficial?: boolean;
  userId?: string;
}

export interface CivicPost {
  id: string;
  reporter: {
    id: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
    wardOrArea: string;
  };
  timestamp: string;
  formattedTime: string;
  category: CivicCategory;
  title: string;
  description: string;
  status: IssueStatus;
  priority?: IssuePriority;
  imageUrl: string;
  images?: string[];
  imageFallbackGradient: string;
  latitude?: number;
  longitude?: number;
  /** Real status history from the Core API (absent for old offline/mock posts) */
  timeline?: { status: string; note?: string | null; created_at: string }[];
  /** Latest citizens who upvoted (live reports only) and the total number of supporters */
  supporters?: { id: string; name: string; avatar: string; ward?: string; time: string }[];
  supportersTotal?: number;
  upvotes: number;
  hasUpvoted?: boolean;
  commentsCount: number;
  comments: Comment[];
  isBookmarked?: boolean;
  whyItMatters?: string;
  communityActionLabel?: string;
  aiInsight?: string;
  isBriefingItem?: boolean;
  isPositiveStory?: boolean;
  resolutionDetails?: {
    resolvedDate: string;
    resolutionSummary: string;
    afterImageUrl?: string;
  };
  poll?: {
    question: string;
    options: { id: string; text: string; votes: number }[];
    userVotedId?: string;
  };
  suggestiveRemarks?: {
    whatWeHaveToDo: string[];
    whatGovernmentHasToDo: string[];
  };
}

export interface SuggestiveRemarks {
  whatWeHaveToDo: string[];
  whatGovernmentHasToDo: string[];
}


export interface DailyBriefing {
  time: string;
  date: string;
  headline: string;
  aiSummary: string;
  topUpdates: {
    id: string;
    title: string;
    category: CivicCategory;
    impact: string;
    ward: string;
  }[];
  priorityIssue: {
    id: string;
    title: string;
    area: string;
    urgency: string;
    reportsCount: number;
  };
  positiveStory: {
    id: string;
    title: string;
    area: string;
    outcome: string;
  };
}

export interface ReelStory {
  id: string;
  title: string;
  caption: string;
  creator: {
    name: string;
    avatar: string;
    role: string;
  };
  locality: string;
  beforeAfter?: {
    beforeLabel: string;
    afterLabel: string;
  };
  mediaUrl: string;
  gradientTheme: string;
  category: CivicCategory;
  likes: number;
  hasLiked?: boolean;
  commentsCount: number;
  comments: { id: string; author: string; text: string; time: string }[];
  shares: number;
  isSaved?: boolean;
  impactStat: string;
  daysToResolve?: string;
}

export interface UserNotification {
  id: string;
  type: 'report_update' | 'upvote' | 'resolved' | 'reward' | 'event' | 'vacancy';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  group: 'Today' | 'Earlier';
  relatedPostId?: string;
}

export interface Vacancy {
  id: string;
  role: string;
  organization: string;
  location: string;
  type: 'Volunteer' | 'Internship' | 'Fellowship' | 'Part-time';
  deadline: string;
  stipend?: string;
  description: string;
  requirements: string[];
  spotsRemaining: number;
  googleFormUrl?: string;
}

export interface VolunteerDrive {
  id: string;
  title: string;
  organization: string;
  orgId?: string;
  category: 'Cleanup' | 'Tree Planting' | 'Drainage' | 'Sanitation' | 'Social Work' | 'Health Camp';
  location: string;
  city: string;
  date: string;
  time: string;
  volunteersNeeded: number;
  volunteersJoined: number;
  pointsReward: number;
  status: 'Open' | 'In Progress' | 'Completed';
  description: string;
  safetyInstructions: string[];
  userStatus?: 'not_joined' | 'joined' | 'proof_submitted';
  proofPhoto?: string;
  proofNote?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface CivicQuiz {
  id: string;
  title: string;
  category: string;
  description: string;
  pointsReward: number;
  questionsCount: number;
  estimatedMinutes: number;
  questions: QuizQuestion[];
}

export interface LevelMilestone {
  id: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend';
  name: string;
  pointsRange: string;
  minPoints: number;
  maxPoints?: number;
  perk: string;
  bgColor: string;
  borderColor: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  requirement: string;
  iconName: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  category: string;
}

export interface LearnModule {
  id: string;
  title: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessonsCount: number;
  progress: number;
  description: string;
  keyTakeaways: string[];
  certified: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  neighborhood: string;
  wardNumber: string;
  points: number;
  level: string;
  nextLevelPoints: number;
  joinedDate: string;
  role?: 'citizen' | 'official' | 'ngo' | 'admin';
  stats: {
    reportsCount: number;
    supportedCount: number;
    resolvedCount: number;
    volunteerHours: number;
  };
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'reward';
}

export type AlertSeason = 'Monsoon' | 'Summer' | 'Post-Monsoon' | 'Winter' | 'Immediate (30-day)';

export interface PredictiveAlert {
  id: string;
  season: AlertSeason;
  seasonLabel: string;
  title: string;
  category: CivicCategory;
  severity: 'Critical' | 'High' | 'Moderate' | 'Advisory';
  probability: number;
  expectedTimeline: string;
  daysAway: number;
  affectedZones: string[];
  historicalPrecedent: string;
  problemDescription: string;
  citizenImpact: string[];
  citizenSolutions: {
    title: string;
    description: string;
    actionableStep: string;
    icon?: string;
  }[];
  municipalMitigation: {
    department: string;
    plan: string;
    status: 'Scheduled' | 'In Progress' | 'Completed';
    targetDate: string;
  }[];
  checklist: {
    id: string;
    text: string;
    points: number;
    isCompleted?: boolean;
  }[];
  helpline: string;
}

