import { cookies } from 'next/headers';
import type { Locale } from './i18n';

/**
 * Backend client. Used from Server Components and Route Handlers only.
 * BACKEND_URL is a server-only env var (never NEXT_PUBLIC), so the backend
 * origin is never shipped to the browser.
 */
export function getBackendUrl() {
  const raw = process.env.BACKEND_URL ?? 'http://localhost:4000';
  try {
    return new URL(raw).origin;
  } catch {
    throw new Error('Invalid BACKEND_URL. Expected an absolute URL.');
  }
}

const BACKEND_URL = getBackendUrl();

function backendPath(path: string) {
  if (!path.startsWith('/')) throw new Error('Backend path must start with /.');
  return `${BACKEND_URL}${path}`;
}

export interface Lesson {
  id: string;
  title: string;
  durationMin: number;
  weekNumber?: number | null;
  targetMetrics?: Record<string, unknown>;
}

export interface Lecture {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  name: string;
  summary: string;
  lectures: Lecture[];
  lessons: Lesson[];
}

export type Track = Subject;

export type LessonDetail = Lesson & {
  trackId: string;
  subjectId: string;
  subjectName: string;
  lectureId: string;
  lectureTitle: string;
};

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
  role: 'learner' | 'admin';
}

export interface ProgressLog {
  id: string;
  lessonId: string | null;
  status: 'started' | 'completed' | 'skipped';
  score: number | null;
  createdAt: string;
}

export interface VoiceProfile {
  id: string;
  voiceType: string;
  voiceColor: string;
  lowestNote: string;
  highestNote: string;
  rangeSemitones: number;
  passaggioHint: string | null;
  roadmapStage: 'beginner' | 'intermediate' | 'advanced';
  metrics: unknown;
  createdAt: string;
}

export type AnalysisJobType =
  | 'swiftf0'
  | 'rmvpe'
  | 'crepe'
  | 'range'
  | 'transposition'
  | 'coach_payload'
  | 'health'
  | 'technique';

export type AnalysisJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface AnalysisJob {
  id: string;
  jobType: AnalysisJobType;
  status: AnalysisJobStatus;
  requestPayload: unknown;
  resultPayload: unknown;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchBackendWithCookies(path: string, init: RequestInit = {}) {
  const cookieHeader = (await cookies()).toString();
  const headers = new Headers(init.headers);
  if (cookieHeader) headers.set('cookie', cookieHeader);
  return fetch(backendPath(path), {
    ...init,
    headers,
    cache: 'no-store',
  });
}

function localeHeaders(locale?: Locale) {
  return locale ? { 'X-Sime-Locale': locale } : undefined;
}

export async function getSubjects(locale?: Locale): Promise<Subject[]> {
  const res = await fetch(backendPath('/api/lessons'), {
    headers: localeHeaders(locale),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Failed to load lessons (${res.status})`);
  const data = (await res.json()) as { subjects?: Subject[]; tracks?: Subject[] };
  const subjects = data.subjects ?? data.tracks;
  if (!Array.isArray(subjects)) throw new Error('Invalid lessons payload');
  return subjects;
}

export async function getTracks(locale?: Locale): Promise<Track[]> {
  return getSubjects(locale);
}

export async function getLesson(id: string, locale?: Locale): Promise<LessonDetail | null> {
  const res = await fetch(
    backendPath(`/api/lessons/${encodeURIComponent(id)}`),
    { headers: localeHeaders(locale), next: { revalidate: 300 } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load lesson (${res.status})`);
  const data = (await res.json()) as { lesson: LessonDetail };
  if (!data.lesson || typeof data.lesson.id !== 'string') {
    throw new Error('Invalid lesson payload');
  }
  return data.lesson;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetchBackendWithCookies('/api/auth/me');
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Failed to load current user (${res.status})`);
  const data = (await res.json()) as { user?: CurrentUser };
  return data.user ?? null;
}

export async function getProgress(): Promise<ProgressLog[]> {
  const res = await fetchBackendWithCookies('/api/progress');
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`Failed to load progress (${res.status})`);
  const data = (await res.json()) as { progress?: ProgressLog[] };
  return Array.isArray(data.progress) ? data.progress : [];
}

export async function getLatestVoiceProfile(): Promise<VoiceProfile | null> {
  const res = await fetchBackendWithCookies('/api/voice-profiles/latest');
  // 401 = signed out, 503 = backend DB not configured yet. Both mean "nothing
  // to show", not a hard error, so the dashboard can degrade gracefully.
  if (res.status === 401 || res.status === 503) return null;
  if (!res.ok) throw new Error(`Failed to load voice profile (${res.status})`);
  const data = (await res.json()) as { profile?: VoiceProfile | null };
  return data.profile ?? null;
}



