import type { EntryAnalysis, WeeklyReviewData, MentorContext } from '../types/ai';
import type { Entry } from '../types/entry';

export interface AIService {
  analyzeEntry(content: string): Promise<EntryAnalysis>;
  generateWeeklyReview(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied'>[]
  ): Promise<WeeklyReviewData>;
  generateMentorResponse(query: string, context: MentorContext): AsyncGenerator<string, void, unknown>;
}
