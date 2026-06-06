import { getDb } from '../db';
import { createAIServiceFromEnv } from '../ai';
import type { AIService } from '../ai/interface';
import { formatDate } from '../utils/date';
import type { DailyReview } from '../types/review';

let aiInstance: AIService | null = null;
function getAI(): AIService {
  if (!aiInstance) aiInstance = createAIServiceFromEnv();
  return aiInstance;
}

export async function generateDailyReview(date?: string): Promise<DailyReview> {
  const db = getDb();
  const targetDate = date || formatDate(new Date());
  const entries = db.listEntries({ from: targetDate, to: targetDate });

  if (entries.length === 0) {
    // Still generate a summary for empty days
    const reviewData = await getAI().generateDailyReview([]);
    return db.upsertDailyReview({
      date: targetDate,
      content: reviewData.content,
      insights: reviewData.insights,
      totalHours: reviewData.totalHours,
      subjects: reviewData.subjects,
      strengths: reviewData.strengths,
      weaknesses: reviewData.weaknesses,
      recommendations: reviewData.recommendations,
      entryIds: [],
    });
  }

  const reviewData = await getAI().generateDailyReview(
    entries.map(e => ({
      id: e.id,
      date: e.date,
      content: e.content,
      subjects: e.subjects,
      chapters: e.chapters,
      hoursStudied: e.hoursStudied,
      studyType: e.studyType,
      focusRating: e.focusRating,
    }))
  );

  return db.upsertDailyReview({
    date: targetDate,
    content: reviewData.content,
    insights: reviewData.insights,
    totalHours: reviewData.totalHours,
    subjects: reviewData.subjects,
    strengths: reviewData.strengths,
    weaknesses: reviewData.weaknesses,
    recommendations: reviewData.recommendations,
    entryIds: entries.map(e => e.id),
  });
}

export function getDailyReviewByDate(date: string): DailyReview | null {
  return getDb().getDailyReviewByDate(date);
}
