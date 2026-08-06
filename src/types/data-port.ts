import type { Entry } from './entry';
import type { DailyReview, SyllabusChapter, WeeklyReview } from './review';
import type { MockTest } from './mock-test';
import type { Todo } from './todo';
import type { Settings } from './settings';

/**
 * Portable user-data snapshot used by export/import and the sqlite→Firestore
 * migration. Version 2 rows are camelCase domain objects (matching the type
 * definitions) with their original ids preserved.
 */
export interface UserDataExport {
  version: 2;
  exportedAt: string;
  userId: string;
  data: {
    entries: Entry[];
    weeklyReviews: WeeklyReview[];
    dailyReviews: DailyReview[];
    syllabus: SyllabusChapter[];
    mockTests: MockTest[];
    todos: Todo[];
    settings: Settings | null;
  };
}

export interface ImportResult {
  success: boolean;
  counts: {
    entries: number;
    weeklyReviews: number;
    dailyReviews: number;
    syllabus: number;
    mockTests: number;
    todos: number;
    settings: number;
  };
}
