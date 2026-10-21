// Impact Reels client. Kept apart from lib/api.ts on purpose so the shared API file stays untouched.
import { ApiError, UNAUTHORIZED_EVENT, getToken, type BackendComment, type BackendIssueDetail } from './api';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the Core API running?', 0);
  }
  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') message = body.detail;
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, response.status);
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

// ---------------------------------------------------------------------------
// Impact Reels (resolved issues) and impact stats
// ---------------------------------------------------------------------------
export interface BackendReel {
  id: number;
  title: string;
  description: string;
  category: string;
  locality: string | null;
  creator: { id: number; name: string; avatar_url: string | null; ward: string | null };
  before_image: string | null;
  after_image: string | null;
  resolution_note: string | null;
  resolved_at: string;
  days_to_resolve: number;
  supporters: number;
  likes: number;
  comments_count: number;
  shares: number;
  has_liked: boolean;
  is_saved: boolean;
}

export interface BackendReelList {
  items: BackendReel[];
  total: number;
  page: number;
  pages: number;
}

export interface ReactionResult {
  issue_id: number;
  likes: number;
  has_liked: boolean;
  is_saved: boolean;
}

export interface BackendImpactStats {
  reports_total: number;
  resolved_total: number;
  resolution_rate: number;
  resolved_last_30_days: number;
  avg_days_to_resolve: number | null;
  citizens_supporting: number;
  citizens_reporting: number;
  with_after_photo: number;
  by_category: { category: string; resolved: number }[];
}

export const getReels = (page = 1, saved = false, pageSize = 10) =>
  request<BackendReelList>(`/api/impact/reels?page=${page}&page_size=${pageSize}${saved ? '&saved=true' : ''}`);

export const getReel = (id: number | string) => request<BackendReel>(`/api/impact/reels/${id}`);

const reelAction = (id: number | string, what: 'like' | 'save', on: boolean) =>
  request<ReactionResult>(`/api/impact/reels/${id}/${what}`, { method: on ? 'POST' : 'DELETE' });
export const setReelLike = (id: number | string, on: boolean) => reelAction(id, 'like', on);
export const setReelSave = (id: number | string, on: boolean) => reelAction(id, 'save', on);

export const recordReelShare = (id: number | string, channel: 'whatsapp' | 'x' | 'telegram' | 'facebook' | 'copy' | 'native') =>
  post<{ issue_id: number; shares: number }>(`/api/impact/reels/${id}/share`, { channel });

export const getReelComments = (id: number | string) => request<BackendComment[]>(`/api/issues/${id}/comments`);

export const getImpactStats = () => request<BackendImpactStats>('/api/impact/stats');

/** Marks an issue Resolved and attaches the "after" photo(s) that appear in Impact Reels. */
export const resolveIssue = (id: number | string, note: string | undefined, afterImageUrls: string[]) =>
  request<BackendIssueDetail>(`/api/issues/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Resolved', note, after_image_urls: afterImageUrls }),
  });
