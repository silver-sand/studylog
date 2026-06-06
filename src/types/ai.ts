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
  userProfile: string;
}

export interface ChatMessage {
  role: 'user' | 'mentor';
  content: string;
}

export interface AIServiceConfig {
  provider: 'mock' | 'gemini' | 'groq';
  apiKey?: string;
  modelName?: string;
}
