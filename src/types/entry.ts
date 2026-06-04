export type StudyType = 'theory' | 'problem_solving' | 'revision' | 'test' | 'other';

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  subjects: string[];
  chapters: string[];
  hoursStudied: number;
  studyType: StudyType;
  focusRating: number; // 0-5 (0 = not set)
  examType: string; // e.g. 'JEE', 'NEET', 'Boards', ''
  tags: string[];
  aiRaw: string | null;
  aiStatus: 'pending' | 'processing' | 'done' | 'error';
  createdAt: string;
}

export interface CreateEntryData {
  date: string;
  content: string;
  hoursStudied?: number;
  studyType?: StudyType;
  focusRating?: number;
  examType?: string;
}

export interface EntryFilters {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
