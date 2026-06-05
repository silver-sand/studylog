import type { Entry, CreateEntryData, EntryFilters } from '../types/entry';
import type { WeeklyReview, CreateReviewData, DailyReview, CreateDailyReviewData, SyllabusChapter, SyllabusProgress } from '../types/review';
import type { Settings, UpdateSettingsData } from '../types/settings';
import type { MockTest, CreateMockTestData, MockTestAnalytics } from '../types/mock-test';
import type { User, Session, CreateUserData } from '../types/auth';

export interface Database {
  /** Scope all subsequent queries to a specific user */
  setCurrentUser(userId: string): void;
  /** Reset to default user */
  clearCurrentUser(): void;
  /** Get the current user ID */
  getCurrentUser(): string;

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
  getSyllabusByIds(ids: string[]): SyllabusChapter[];
  updateSyllabusStatus(id: string, status: string): SyllabusChapter;
  batchUpdateSyllabusStatus(updates: { id: string; status: string }[]): number;
  getSyllabusProgress(examType: string, subjects?: string[]): SyllabusProgress[];
  getWeakChapters(examType: string, threshold?: number, subjects?: string[]): (SyllabusChapter & { health: number })[];

  // Settings
  getSettings(): Settings;
  updateSettings(data: UpdateSettingsData): Settings;

  // Mock Tests
  createMockTest(data: CreateMockTestData): MockTest;
  getMockTests(filters?: { subject?: string; limit?: number }): MockTest[];
  getMockTestAnalytics(): MockTestAnalytics;

  // Auth
  createUser(data: CreateUserData): User;
  getUserByEmail(email: string): User | null;
  getUserById(id: string): User | null;
  updateUser(id: string, data: Partial<Pick<User, 'name' | 'stream' | 'goal' | 'userType'>>): User | null;
  createSession(userId: string, token: string, expiresAt: string): Session;
  getSessionByToken(token: string): Session | null;
  deleteSession(token: string): boolean;
  deleteExpiredSessions(): number;

  // Stats
  getEntryCount(): number;
  getEntryCountForMonth(year: number, month: number): number;
  getStreak(): number;
  getTotalHoursForWeek(weekStart: string): number;
}
