import type { Entry, CreateEntryData, EntryFilters } from '../types/entry';
import type { WeeklyReview, CreateReviewData, DailyReview, CreateDailyReviewData, SyllabusChapter, SyllabusProgress } from '../types/review';
import type { Settings, UpdateSettingsData } from '../types/settings';

export interface Database {
  // Entries
  createEntry(data: CreateEntryData): Entry;
  getEntry(id: string): Entry | null;
  getEntryByDate(date: string): Entry | null;
  listEntries(filters?: EntryFilters): Entry[];
  updateEntry(id: string, data: Partial<Entry>): Entry | null;
  deleteEntry(id: string): boolean;

  // Weekly Reviews
  createReview(data: CreateReviewData): WeeklyReview;
  getReview(id: string): WeeklyReview | null;
  getReviewByWeek(weekStart: string): WeeklyReview | null;
  listReviews(): WeeklyReview[];
  upsertReview(data: CreateReviewData): WeeklyReview;

  // Daily Reviews
  createDailyReview(data: CreateDailyReviewData): DailyReview;
  getDailyReviewByDate(date: string): DailyReview | null;
  upsertDailyReview(data: CreateDailyReviewData): DailyReview;

  // Syllabus
  seedSyllabusData(): void;
  getSyllabus(examType?: string, subject?: string): SyllabusChapter[];
  updateSyllabusStatus(id: string, status: string): SyllabusChapter;
  getSyllabusProgress(examType: string): SyllabusProgress[];

  // Settings
  getSettings(): Settings;
  updateSettings(data: UpdateSettingsData): Settings;

  // Stats
  getEntryCount(): number;
  getEntryCountForMonth(year: number, month: number): number;
  getStreak(): number;
  getTotalHoursForWeek(weekStart: string): number;
}
