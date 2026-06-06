import type { EntryAnalysis, WeeklyReviewData, DailyReviewData, MentorContext, ChatMessage } from '../types/ai';
import type { Entry } from '../types/entry';

export interface AIService {
  /** Human-readable provider name (e.g. "Groq", "Gemini", "Mock") */
  readonly provider: string;
  /** Model name or identifier */
  readonly modelName: string;

  analyzeEntry(content: string): Promise<EntryAnalysis>;
  generateDailyReview(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied' | 'studyType' | 'focusRating'>[]
  ): Promise<DailyReviewData>;
  generateWeeklyReview(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied'>[]
  ): Promise<WeeklyReviewData>;
  generateMentorResponse(query: string, context: MentorContext, history?: ChatMessage[]): AsyncGenerator<string, void, unknown>;
}
