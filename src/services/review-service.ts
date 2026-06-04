import { getDb } from '../db';
import { createAIServiceFromEnv } from '../ai';
import { getWeekRange } from '../utils/date';
import type { WeeklyReview } from '../types/review';

const ai = createAIServiceFromEnv();

export async function generateReview(weekStart?: string): Promise<WeeklyReview> {
  const db = getDb();
  const range = getWeekRange(weekStart);
  const entries = db.listEntries({ from: range.weekStart, to: range.weekEnd });

  if (entries.length === 0) {
    throw new Error(`No entries found for week ${range.weekStart} to ${range.weekEnd}. Add some study logs first!`);
  }

  const reviewData = await ai.generateWeeklyReview(
    entries.map(e => ({
      id: e.id,
      date: e.date,
      content: e.content,
      subjects: e.subjects,
      chapters: e.chapters,
      hoursStudied: e.hoursStudied,
    }))
  );

  return db.upsertReview({
    weekStart: range.weekStart,
    weekEnd: range.weekEnd,
    content: reviewData.content,
    insights: reviewData.insights,
    topicCoverage: reviewData.topicCoverage,
    strengths: reviewData.strengths,
    weaknesses: reviewData.weaknesses,
    recommendations: reviewData.recommendations,
    entryIds: entries.map(e => e.id),
  });
}

export function getReview(id: string): WeeklyReview | null {
  return getDb().getReview(id);
}

export function getReviewByWeek(weekStart: string): WeeklyReview | null {
  return getDb().getReviewByWeek(weekStart);
}

export function listReviews(): WeeklyReview[] {
  return getDb().listReviews();
}
