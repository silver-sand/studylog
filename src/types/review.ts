export interface WeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  content: string;
  insights: string[];
  topicCoverage: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  entryIds: string[];
  createdAt: string;
}

export interface CreateReviewData {
  weekStart: string;
  weekEnd: string;
  content: string;
  insights: string[];
  topicCoverage: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  entryIds: string[];
}

export interface DailyReview {
  id: string;
  date: string;
  content: string;
  insights: string[];
  totalHours: number;
  subjects: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  entryIds: string[];
  createdAt: string;
}

export type ChapterStatus = 'not_started' | 'studied' | 'revision_1' | 'revision_2' | 'revision_3' | 'mastered';

export const STATUS_ORDER: ChapterStatus[] = ['not_started', 'studied', 'revision_1', 'revision_2', 'revision_3', 'mastered'];

export const STATUS_WEIGHTS: Record<ChapterStatus, number> = {
  not_started: 0,
  studied: 0.2,
  revision_1: 0.4,
  revision_2: 0.6,
  revision_3: 0.8,
  mastered: 1,
};

export const STATUS_LABELS: Record<ChapterStatus, string> = {
  not_started: 'Not Started',
  studied: 'Studied',
  revision_1: 'Rev 1',
  revision_2: 'Rev 2',
  revision_3: 'Rev 3',
  mastered: 'Mastered',
};

export function statusWeight(status: string): number {
  return STATUS_WEIGHTS[status as ChapterStatus] ?? 0;
}

export function isMastered(status: string): boolean {
  return status === 'mastered';
}

export interface SyllabusChapter {
  id: string;
  examType: string;
  subject: string;
  chapter: string;
  classLevel: string | null;
  sortOrder: number;
  status: ChapterStatus;
  completedAt: string | null;
  lastRevisedAt: string | null;
  revisionCount: number;
}

export interface SyllabusProgress {
  subject: string;
  total: number;
  completed: number;
  percent: number;
  weightedPercent: number;
  mastered: number;
  revised: number;
}

export interface CreateDailyReviewData {
  date: string;
  content: string;
  insights: string[];
  totalHours: number;
  subjects: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  entryIds: string[];
}
