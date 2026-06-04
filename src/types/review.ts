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

export interface SyllabusChapter {
  id: string;
  examType: string;
  subject: string;
  chapter: string;
  classLevel: string | null;
  sortOrder: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: string | null;
}

export interface SyllabusProgress {
  subject: string;
  total: number;
  completed: number;
  percent: number;
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
