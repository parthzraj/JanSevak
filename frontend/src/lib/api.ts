const defaultHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const API_BASE_URL = (import.meta.env.VITE_API_URL || `http://${defaultHost}:8000`).replace(/\/$/, '');
const AI_API_BASE_URL = (import.meta.env.VITE_AI_API_URL || `http://${defaultHost}:8001`).replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Auth token (kept in localStorage so a page refresh keeps the user logged in)
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'prajapulse_token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable - the user simply has to log in again after a refresh
  }
};

/** Turns a backend-relative file path ("/uploads/abc.jpg") into a full URL the <img> tag can load. */
export const assetUrl = (url: string): string => (url.startsWith('/uploads/') ? `${API_BASE_URL}${url}` : url);

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------
interface ApiErrorResponse {
  detail?: string | { msg?: string }[] | { message?: string; [key: string]: unknown };
}

export class ApiError extends Error {
  status: number;
  /** Extra fields from the server, e.g. { code: 'duplicate_report', issue_id: 12 } */
  data?: Record<string, unknown>;
  constructor(message: string, status: number, data?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const UNAUTHORIZED_EVENT = 'prajapulse:unauthorized';

async function parseError(response: Response): Promise<ApiError> {
  let message = `Backend request failed (${response.status})`;
  let data: Record<string, unknown> | undefined;
  try {
    const error = (await response.json()) as ApiErrorResponse;
    if (typeof error.detail === 'string') message = error.detail;
    else if (Array.isArray(error.detail)) message = error.detail.map((d) => d.msg).filter(Boolean).join('; ') || message;
    else if (error.detail && typeof error.detail === 'object') {
      message = typeof error.detail.message === 'string' ? error.detail.message : message;
      data = error.detail as Record<string, unknown>;
    }
  } catch {
    // Preserve the HTTP error when the backend did not return JSON.
  }
  return new ApiError(message, response.status, data);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    // An expired / invalid token on a protected call: let the app log the user out.
    if (response.status === 401 && token && !path.startsWith('/api/auth/login')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw await parseError(response);
  }

  return response.json() as Promise<T>;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

// ---------------------------------------------------------------------------
// Backend response shapes (see backend/core_api/README.md)
// ---------------------------------------------------------------------------
export interface BackendUser {
  id: number;
  name: string;
  email: string;
  ward: string | null;
  avatar_url: string | null;
  role: 'citizen' | 'official' | 'admin';
  points: number;
  tier: string;
  volunteer_hours: number;
  reports_count: number;
  supported_count: number;
  resolved_count: number;
  created_at: string;
}

export interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

export interface BackendComment {
  id: number;
  issue_id: number;
  user_id: number;
  author: string;
  avatar_url: string | null;
  text: string;
  is_official: boolean;
  created_at: string;
}

export interface BackendIssue {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string; // Critical
  priority_ui: string; // Urgent
  status: string;
  image_urls: string[];
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  upvotes: number;
  has_upvoted: boolean;
  comments_count: number;
  reporter: { id: number; name: string; avatar_url: string | null; ward: string | null };
  created_at: string;
  updated_at: string;
}

export interface BackendEvidence {
  id: number;
  url: string;
  user_id: number;
  author: string;
  created_at: string;
}

export interface BackendSupporter {
  user_id: number;
  name: string;
  avatar_url: string | null;
  ward: string | null;
  supported_at: string;
}

export interface BackendIssueDetail extends BackendIssue {
  comments: BackendComment[];
  timeline: { status: string; note: string | null; created_at: string }[];
  evidence: BackendEvidence[];
}

export interface BackendNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface VoteResult {
  issue_id: number;
  upvotes: number;
  has_upvoted: boolean;
  points_delta: number;
  user_points: number;
  user_tier: string;
}

export interface ClaimResult {
  requested: number;
  awarded: number;
  duplicate: boolean;
  capped: boolean;
  user_points: number;
  user_tier: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const loginRequest = (email: string, password: string) =>
  post<BackendTokenResponse>('/api/auth/login', { email, password });

export const registerRequest = (input: { name: string; email: string; password: string; ward?: string }) =>
  post<BackendTokenResponse>('/api/auth/register', input);

export const fetchMe = () => request<BackendUser>('/api/auth/me');

export const updateMe = (input: { name?: string; ward?: string; avatar_url?: string }) =>
  request<BackendUser>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(input) });

export interface BackendPublicUser {
  id: number;
  name: string;
  ward: string | null;
  avatar_url: string | null;
  role: 'citizen' | 'official' | 'admin';
  points: number;
  tier: string;
  reports_count: number;
  supported_count: number;
  resolved_count: number;
  created_at: string;
}

/** Another citizen's public profile (no email). */
export const fetchPublicUser = (id: number | string) => request<BackendPublicUser>(`/api/users/${id}`);

export interface BackendStats {
  total: number;
  reported: number;
  in_progress: number;
  resolved: number;
  resolution_rate: number;
  avg_resolution_hours: number | null;
  last_7_days: number;
  by_category: { category: string; count: number; percent: number }[];
}

export const fetchAnalytics = () => request<{ mine: BackendStats; community: BackendStats }>('/api/analytics/summary');

// ---------------------------------------------------------------------------
// Issues, votes, comments
// ---------------------------------------------------------------------------
export const fetchIssues = (
  params: { page_size?: number; sort?: 'recent' | 'votes'; category?: string; reporter_id?: number } = {}
) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && query.set(k, String(v)));
  return request<{ items: BackendIssue[]; total: number }>(`/api/issues?${query.toString()}`);
};

export const fetchIssue = (id: number | string) => request<BackendIssueDetail>(`/api/issues/${id}`);

export const createIssueRequest = (input: {
  title: string;
  description: string;
  category: string;
  priority: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  image_urls?: string[];
}) =>
  post<{ issue: BackendIssueDetail; points_awarded: number; user_points: number; user_tier: string }>(
    '/api/issues',
    input
  );

export const deleteIssueRequest = (id: number | string) =>
  request<{ deleted_id: number; points_reverted: number; user_points: number; user_tier: string }>(`/api/issues/${id}`, {
    method: 'DELETE',
  });

export const upvoteIssue = (id: number | string) => post<VoteResult>(`/api/issues/${id}/upvote`);

export const removeUpvote = (id: number | string) => request<VoteResult>(`/api/issues/${id}/upvote`, { method: 'DELETE' });

export const addCommentRequest = (id: number | string, text: string) =>
  post<BackendComment>(`/api/issues/${id}/comments`, { text });

export const fetchSupporters = (id: number | string) =>
  request<{ total: number; items: BackendSupporter[] }>(`/api/issues/${id}/supporters?limit=50`);

/** Adds 1-3 on-site photos to an existing issue. */
export async function uploadEvidence(
  id: number | string,
  files: File[]
): Promise<{ evidence: BackendEvidence[]; points_awarded: number; user_points: number; user_tier: string }> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/issues/${id}/evidence`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form, // the browser sets the multipart Content-Type itself
  });
  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw await parseError(response);
  }
  return response.json();
}

export const updateIssueStatus = (id: number | string, status: string, note?: string) =>
  request<BackendIssueDetail>(`/api/issues/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });

/** Uploads a photo (data URL from the camera / file picker) and returns the URL to send in `image_urls`. */
export async function uploadImageDataUrl(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append('file', blob, 'report-photo');
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form, // the browser sets the multipart Content-Type itself
  });
  if (!response.ok) throw await parseError(response);
  return ((await response.json()) as { url: string }).url;
}

// ---------------------------------------------------------------------------
// Rewards & notifications
// ---------------------------------------------------------------------------
export const claimReward = (input: { action_type: 'quiz' | 'academy_module'; action_id: string; points: number }) =>
  post<ClaimResult>('/api/rewards/claim', input);

export const fetchNotifications = () =>
  request<{ items: BackendNotification[]; unread_count: number }>('/api/notifications');

export const markNotificationRead = (id: number | string) =>
  request<BackendNotification>(`/api/notifications/${id}/read`, { method: 'PATCH' });

export const markAllNotificationsRead = () => post<{ marked_read: number }>('/api/notifications/read-all');

// ---------------------------------------------------------------------------
// AI (direct to AI service or fallback)
// ---------------------------------------------------------------------------
async function aiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${AI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `AI service request failed (${response.status})`;
    try {
      const error = (await response.json()) as ApiErrorResponse;
      if (typeof error.detail === 'string') message = error.detail;
    } catch {
      // Preserve the HTTP error
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const response = await aiRequest<{ reply: string }>('/api/chatbot', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
  return response.reply;
}

export async function generateComplaint(input: {
  issue: string;
  location: string;
  additionalDetails?: string;
}): Promise<string> {
  const response = await aiRequest<{ complaint: string }>('/api/complaint/generate', {
    method: 'POST',
    body: JSON.stringify({
      issue: input.issue,
      location: input.location,
      additional_details: input.additionalDetails || '',
    }),
  });
  return response.complaint;
}

export async function improveDescription(description: string): Promise<string> {
  const response = await aiRequest<{ improved_description: string }>('/api/problem-description', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
  return response.improved_description;
}

export async function analyzeHazard(
  issue: string,
  location: string
): Promise<{
  hazard_type: string;
  severity: string;
  reason: string;
  recommended_action: string;
}> {
  return aiRequest('/api/hazard-alerts', {
    method: 'POST',
    body: JSON.stringify({ issue, location }),
  });
}

export async function getSuggestiveRemarks(
  issue: string,
  existingDescription?: string
): Promise<{
  citizen_actions: string[];
  government_actions: string[];
}> {
  return aiRequest('/api/suggestive-remarks', {
    method: 'POST',
    body: JSON.stringify({ issue, existing_description: existingDescription || '' }),
  });
}

export async function analyzeImage(imageFile: File): Promise<{
  detected_issue: string;
  visual_description: string;
  suggested_category: string;
  suggested_severity: string;
}> {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await fetch(`${AI_API_BASE_URL}/api/complaint/analyze-image`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    let message = `Image analysis failed (${response.status})`;
    try {
      const error = (await response.json()) as ApiErrorResponse;
      if (typeof error.detail === 'string') message = error.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Predictive Alerts (AI)
// ---------------------------------------------------------------------------
export async function fetchPredictiveAlerts(season?: string): Promise<{ alerts: any[] }> {
  const params = season && season !== 'All' ? `?season=${encodeURIComponent(season)}` : '';
  return aiRequest(`/api/predictive/alerts${params}`, { method: 'GET' });
}

export async function checkStreetRisk(street: string): Promise<{
  zone: string;
  riskLevel: 'High' | 'Moderate' | 'Low';
  probability: number;
  predictedHazard: string;
  actionRequired: string;
}> {
  return aiRequest('/api/predictive/check-street', {
    method: 'POST',
    body: JSON.stringify({ street }),
  });
}

// ---------------------------------------------------------------------------
// Photo Verification (AI)
// ---------------------------------------------------------------------------
export async function verifyPhoto(imageFile: File): Promise<{
  decision: 'pass' | 'reject' | 'uncertain';
  is_civic_issue: boolean;
  confidence: number;
  detected_issue: string;
  suggested_category: string;
  reason: string;
  unsafe_content: boolean;
}> {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await fetch(`${AI_API_BASE_URL}/api/photo/verify`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    let message = `Photo verification failed (${response.status})`;
    try {
      const error = (await response.json()) as ApiErrorResponse;
      if (typeof error.detail === 'string') message = error.detail;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return response.json();
}

// ---------------------------------------------------------------------------  
// Auto-draft from photo (AI)
// ---------------------------------------------------------------------------
export async function prepareWithImage(imageFile: File, issue?: string, location?: string): Promise<{
  title: string;
  description: string;
  category: string;
  severity: string;
  confidence: number;
}> {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (issue) formData.append('issue', issue);
  if (location) formData.append('location', location);
  const response = await fetch(`${AI_API_BASE_URL}/api/complaint/prepare-with-image`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    let message = `Photo analysis failed (${response.status})`;
    try {
      const error = (await response.json()) as ApiErrorResponse;
      if (typeof error.detail === 'string') message = error.detail;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return response.json();
}

export default {
  getToken,
  setToken,
  assetUrl,
  fetchPredictiveAlerts,
  checkStreetRisk,
  verifyPhoto,
  prepareWithImage,
};
