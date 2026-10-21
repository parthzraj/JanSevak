// Civic Academy client. Kept apart from lib/api.ts on purpose so the shared API file stays untouched.
import { ApiError, UNAUTHORIZED_EVENT, getToken, type Person } from './api';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/academy${path}`, {
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
      else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((d: { msg?: string; loc?: (string | number)[] }) => {
            const where = (d.loc || []).filter((x) => x !== 'body');
            const lesson = where[0] === 'lessons' && typeof where[1] === 'number' ? `Lesson ${Number(where[1]) + 1}: ` : '';
            return lesson + (d.msg || '').replace(/^Value error, /, '');
          })
          .filter(Boolean)
          .join('; ');
      }
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, response.status);
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

const post = <T>(path: string, body?: unknown) => req<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const CATEGORIES = ['Civic basics', 'Water', 'Waste', 'Safety', 'Rights & RTI', 'Environment', 'Health', 'Other'] as const;
export type LessonKind = 'video' | 'reading' | 'task';
export type LessonState = 'locked' | 'available' | 'in_progress' | 'submitted' | 'rejected' | 'done';
export type CourseStatus = 'Draft' | 'Published' | 'Archived';
export type ProofType = 'photo' | 'link' | 'text';
export type TaskMode = 'physical' | 'online';

export interface Lesson {
  id: number;
  position: number;
  kind: LessonKind;
  title: string;
  summary: string;
  duration_seconds: number | null;
  task_mode: TaskMode | null;
  instructions: string | null;
  proof_type: ProofType | null;
  required_seconds: number;
  video_kind: 'youtube' | 'file' | null;
  video_ref: string | null;
  body: string | null;
  state: LessonState | null;
  percent: number;
  watched_seconds: number;
  resume_seconds: number;
  proof_text: string | null;
  proof_url: string | null;
  feedback: string | null;
  attempts: number;
}

export interface Enrollment {
  percent: number;
  completed: boolean;
  completed_at: string | null;
  certificate_code: string | null;
  points_awarded: number;
  next_lesson_id: number | null;
  enrolled_at: string;
}

export interface Course {
  id: number;
  title: string;
  summary: string;
  level: (typeof LEVELS)[number];
  category: string;
  ngo: Person;
  status: CourseStatus;
  lessons_count: number;
  video_count: number;
  reading_count: number;
  task_count: number;
  estimated_minutes: number;
  enrolled_count: number;
  completed_count: number;
  points: number;
  is_owner: boolean;
  my: Enrollment | null;
  pending_reviews: number;
  created_at: string;
  published_at: string | null;
}

export interface CourseDetail extends Course {
  description: string;
  lessons: Lesson[];
}

export interface Progress {
  lesson: Lesson;
  enrollment: Enrollment;
  certificate: Certificate | null;
  notes: string[];
}

export interface Certificate {
  code: string;
  course_id: number;
  course_title: string;
  level: string;
  category: string;
  issuer: Person;
  learner_name: string;
  completed_at: string;
  lessons_count: number;
  tasks_verified: number;
  points_awarded: number;
}

export interface ReviewItem {
  id: number;
  course_id: number;
  course_title: string;
  lesson_id: number;
  lesson_title: string;
  task_mode: TaskMode | null;
  instructions: string | null;
  proof_type: ProofType | null;
  learner: Person;
  proof_text: string | null;
  proof_url: string | null;
  attempts: number;
  status: 'submitted' | 'rejected' | 'done';
  feedback: string | null;
  submitted_at: string | null;
}

export interface LessonDraft {
  kind: LessonKind;
  title: string;
  summary: string;
  video_url?: string | null;
  duration_seconds?: number | null;
  body?: string | null;
  task_mode?: TaskMode | null;
  instructions?: string | null;
  proof_type?: ProofType | null;
}

export interface CourseDraft {
  title: string;
  summary: string;
  description: string;
  level: string;
  category: string;
  lessons: LessonDraft[];
}

export const fetchCourses = (p: { mine?: boolean; enrolled?: boolean; q?: string; category?: string } = {}) => {
  const qs = new URLSearchParams();
  if (p.mine) qs.set('mine', 'true');
  if (p.enrolled) qs.set('enrolled', 'true');
  if (p.q) qs.set('q', p.q);
  if (p.category) qs.set('category', p.category);
  return req<{ items: Course[]; total: number }>(`/courses${qs.size ? `?${qs}` : ''}`);
};
export const fetchCourse = (id: number | string) => req<CourseDetail>(`/courses/${id}`);
export const createCourse = (draft: CourseDraft & { publish: boolean }) => post<CourseDetail>('/courses', draft);
export const updateCourse = (id: number, patch: Partial<CourseDraft>) => req<CourseDetail>(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const publishCourse = (id: number) => post<CourseDetail>(`/courses/${id}/publish`);
export const archiveCourse = (id: number) => post<CourseDetail>(`/courses/${id}/archive`);
export const deleteCourse = (id: number) => req<void>(`/courses/${id}`, { method: 'DELETE' });

export const enrollInCourse = (id: number) => post<CourseDetail>(`/courses/${id}/enroll`);
export const openLesson = (cid: number, lid: number) => post<Progress>(`/courses/${cid}/lessons/${lid}/open`);
export const sendHeartbeat = (cid: number, lid: number, position: number) => post<Progress>(`/courses/${cid}/lessons/${lid}/heartbeat`, { position });
export const completeLesson = (cid: number, lid: number) => post<Progress>(`/courses/${cid}/lessons/${lid}/complete`);
export const submitTask = (cid: number, lid: number, proof: { proof_text?: string; proof_url?: string }) =>
  post<Progress>(`/courses/${cid}/lessons/${lid}/submit`, proof);

export const fetchReviewQueue = (status: 'submitted' | 'rejected' | 'done' | 'all' = 'submitted', courseId?: number) =>
  req<ReviewItem[]>(`/submissions?status=${status}${courseId ? `&course_id=${courseId}` : ''}`);
export const reviewSubmission = (id: number, decision: 'approve' | 'reject', feedback?: string) =>
  req<{ item: ReviewItem; course_completed: boolean }>(`/submissions/${id}`, { method: 'PATCH', body: JSON.stringify({ decision, feedback }) });

export const fetchMyCertificates = () => req<Certificate[]>('/certificates/mine');
export const verifyCertificate = (code: string) => req<Certificate>(`/certificates/${encodeURIComponent(code)}`);

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? (s ? `${m} min ${s} s` : `${m} min`) : `${s} s`;
};
