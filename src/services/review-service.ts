import { getDb } from '../db';
import { createAIServiceFromEnv } from '../ai';
import type { AIService } from '../ai/interface';
import { getWeekRange } from '../utils/date';
import type { WeeklyReview } from '../types/review';

let aiInstance: AIService | null = null;
function getAI(): AIService {
  if (!aiInstance) aiInstance = createAIServiceFromEnv();
  return aiInstance;
}

export async function generateReview(weekStart?: string): Promise<WeeklyReview> {
  const db = getDb();
  const range = getWeekRange(weekStart);
  const entries = await db.listEntries({ from: range.weekStart, to: range.weekEnd });

  if (entries.length === 0) {
    throw new Error(`No entries found for week ${range.weekStart} to ${range.weekEnd}. Add some study logs first!`);
  }

  const reviewData = await getAI().generateWeeklyReview(
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

export async function getReview(id: string): Promise<WeeklyReview | null> {
  return getDb().getReview(id);
}

export async function getReviewByWeek(weekStart: string): Promise<WeeklyReview | null> {
  return getDb().getReviewByWeek(weekStart);
}

export async function listReviews(): Promise<WeeklyReview[]> {
  return getDb().listReviews();
}

export async function updateReviewNotes(id: string, notes: string): Promise<WeeklyReview | null> {
  return getDb().updateReviewNotes(id, notes);
}
