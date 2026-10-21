/** Converts Core API (snake_case) objects into the shapes the UI already uses. */
import type { CivicCategory, CivicPost, IssuePriority, IssueStatus, UserNotification, UserProfile } from '../types';
import {
  assetUrl,
  type BackendComment,
  type BackendIssue,
  type BackendNotification,
  type BackendSupporter,
  type BackendUser,
} from './api';

const DEFAULT_AVATAR = '/profile_3d_avatar.jpg';

export const CATEGORY_VISUALS: Record<CivicCategory, { url: string; grad: string }> = {
  Roads: {
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    grad: 'linear-gradient(135deg, #2b3a32 0%, #0f2d59 100%)',
  },
  Water: {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
    grad: 'linear-gradient(135deg, #1b384f 0%, #1d4e8c 100%)',
  },
  Sanitation: {
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    grad: 'linear-gradient(135deg, #32251a 0%, #5e4835 100%)',
  },
  Streetlights: {
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    grad: 'linear-gradient(135deg, #1b2820 0%, #1d4e8c 100%)',
  },
  'Public Safety': {
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    grad: 'linear-gradient(135deg, #3d2417 0%, #c45d22 100%)',
  },
  Parks: {
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    grad: 'linear-gradient(135deg, #1c4b32 0%, #3bb177 100%)',
  },
  Community: {
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    grad: 'linear-gradient(135deg, #0f2d59 0%, #1d4e8c 100%)',
  },
};

// Points needed for the next tier (same table as the backend: backend/core_api/app/services/points_engine.py)
export const nextLevelPoints = (points: number): number => [100, 300, 750, 2000].find((t) => points < t) ?? 2000;

export function timeAgo(iso: string): string {
  if (Number.isNaN(new Date(iso).getTime())) return '';
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

function clockTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** "Ward 112 - Indiranagar" / "Ward 112 (Indiranagar)" -> ward number + neighbourhood. */
function splitWard(ward: string | null): { wardNumber: string; neighborhood: string } {
  if (!ward) return { wardNumber: 'Your ward', neighborhood: 'Bengaluru' };
  const match = ward.match(/^(Ward\s*\d+)\s*[-–(]\s*(.+?)\)?$/i);
  return match ? { wardNumber: match[1], neighborhood: match[2] } : { wardNumber: ward, neighborhood: 'Bengaluru' };
}

export function toUserProfile(u: BackendUser, prev?: UserProfile): UserProfile {
  const { wardNumber, neighborhood } = splitWard(u.ward);
  const samePerson = prev?.id === String(u.id);
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    avatar: u.avatar_url ? assetUrl(u.avatar_url) : DEFAULT_AVATAR,
    neighborhood,
    wardNumber,
    points: u.points,
    level: u.tier,
    nextLevelPoints: nextLevelPoints(u.points),
    joinedDate: new Date(u.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    role: u.role,
    stats: {
      reportsCount: u.reports_count,
      supportedCount: u.supported_count,
      resolvedCount: u.resolved_count,
      // volunteer hours from NGO drives are still tracked in the browser only
      volunteerHours: Math.max(u.volunteer_hours, samePerson ? prev!.stats.volunteerHours || 0 : 0),
    },
  };
}

export function toComment(c: BackendComment) {
  return {
    id: String(c.id),
    author: c.author,
    avatar: c.avatar_url ? assetUrl(c.avatar_url) : DEFAULT_AVATAR,
    text: c.text,
    time: timeAgo(c.created_at),
    isOfficial: c.is_official,
  };
}

export function toCivicPost(i: BackendIssue): CivicPost {
  const category = (i.category in CATEGORY_VISUALS ? i.category : 'Community') as CivicCategory;
  const visuals = CATEGORY_VISUALS[category];
  const images = i.image_urls.map(assetUrl);
  return {
    id: String(i.id),
    reporter: {
      id: String(i.reporter.id),
      name: i.reporter.name,
      avatar: i.reporter.avatar_url ? assetUrl(i.reporter.avatar_url) : DEFAULT_AVATAR,
      isVerified: true,
      wardOrArea: i.address || i.reporter.ward || 'Bengaluru',
    },
    timestamp: i.created_at,
    formattedTime: clockTime(i.created_at),
    category,
    title: i.title,
    description: i.description,
    status: i.status as IssueStatus,
    priority: i.priority_ui as IssuePriority,
    imageUrl: images[0] ?? visuals.url,
    images, // [] when the reporter attached no photos (the hero then shows an illustrative image)
    latitude: i.latitude ?? undefined,
    longitude: i.longitude ?? undefined,
    imageFallbackGradient: visuals.grad,
    upvotes: i.upvotes,
    hasUpvoted: i.has_upvoted,
    commentsCount: i.comments_count,
    comments: [],
    isBookmarked: false,
    communityActionLabel: 'Support this issue',
  };
}

const NOTIFICATION_TYPES: Record<string, UserNotification['type']> = {
  upvote: 'upvote',
  reward: 'reward',
  status: 'report_update',
  comment: 'report_update',
};

export function toNotification(n: BackendNotification): UserNotification {
  const ageHours = (Date.now() - new Date(n.created_at).getTime()) / 3_600_000;
  return {
    id: String(n.id),
    type: NOTIFICATION_TYPES[n.type] ?? 'event',
    title: n.title,
    message: n.message,
    timestamp: timeAgo(n.created_at),
    isRead: n.is_read,
    group: ageHours < 24 ? 'Today' : 'Earlier',
  };
}

export function toSupporter(s: BackendSupporter) {
  return {
    id: String(s.user_id),
    name: s.name,
    avatar: s.avatar_url ? assetUrl(s.avatar_url) : '', // '' -> the UI shows the person's initial
    ward: s.ward ?? undefined,
    time: timeAgo(s.supported_at),
  };
}
