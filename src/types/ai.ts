import type { Entry } from './entry';

export interface EntryAnalysis {
  subjects: string[];
  chapters: string[];
  hoursStudied: number | null;
  summary: string;
  tags: string[];
}

export interface WeeklyReviewData {
  content: string;
  insights: string[];
  topicCoverage: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface DailyReviewData {
  content: string;
  insights: string[];
  totalHours: number;
  subjects: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MentorContext {
  examType: string;
  recentEntries: string;
  syllabusProgress: string;
  weakChapters: string;
  settings: string;
}

export interface AIService {
  analyzeEntry(content: string): Promise<EntryAnalysis>;
  generateWeeklyReview(entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied'>[]): Promise<WeeklyReviewData>;
  generateDailyReview(entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied' | 'studyType' | 'focusRating'>[]): Promise<DailyReviewData>;
  generateMentorResponse(query: string, context: MentorContext): AsyncGenerator<string, void, unknown>;
}

export interface AIServiceConfig {
  provider: 'mock' | 'gemini';
  apiKey?: string;
  modelName?: string;
}
