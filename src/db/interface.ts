import type { Entry, CreateEntryData, EntryFilters } from '../types/entry';
import type { WeeklyReview, CreateReviewData, DailyReview, CreateDailyReviewData, SyllabusChapter, SyllabusProgress } from '../types/review';
import type { Settings, UpdateSettingsData } from '../types/settings';
import type { MockTest, CreateMockTestData, MockTestAnalytics } from '../types/mock-test';
import type { Todo, CreateTodoData, UpdateTodoData, TodoFilters } from '../types/todo';
import type { User, CreateUserData } from '../types/auth';
import type { UserDataExport, ImportResult } from '../types/data-port';

/**
 * Async data layer. User scoping is per-request via AsyncLocalStorage
 * (see user-context.ts) — every query is scoped to the current uid. The
 * sqlite adapter and the Firestore adapter both implement this.
 */
export interface Database {
  // Entries
  createEntry(data: CreateEntryData): Promise<Entry>;
  getEntry(id: string): Promise<Entry | null>;
  getEntryByDate(date: string): Promise<Entry | null>;
  listEntries(filters?: EntryFilters): Promise<Entry[]>;
  updateEntry(id: string, data: Partial<Entry>): Promise<Entry | null>;
  deleteEntry(id: string): Promise<boolean>;

  // Weekly Reviews
  createReview(data: CreateReviewData): Promise<WeeklyReview>;
  getReview(id: string): Promise<WeeklyReview | null>;
  getReviewByWeek(weekStart: string): Promise<WeeklyReview | null>;
  listReviews(): Promise<WeeklyReview[]>;
  upsertReview(data: CreateReviewData): Promise<WeeklyReview>;
  updateReviewNotes(id: string, notes: string): Promise<WeeklyReview | null>;
  deleteReviewByWeek(weekStart: string): Promise<boolean>;

  // Daily Reviews
  createDailyReview(data: CreateDailyReviewData): Promise<DailyReview>;
  getDailyReviewByDate(date: string): Promise<DailyReview | null>;
  upsertDailyReview(data: CreateDailyReviewData): Promise<DailyReview>;
  listDailyReviews(): Promise<DailyReview[]>;

  // Syllabus
  seedSyllabusData(examType?: string, subjects?: string[]): Promise<void>;
  getSyllabus(examType?: string, subject?: string): Promise<SyllabusChapter[]>;
  getSyllabusByIds(ids: string[]): Promise<SyllabusChapter[]>;
  updateSyllabusStatus(id: string, status: string): Promise<SyllabusChapter>;
  batchUpdateSyllabusStatus(updates: { id: string; status: string }[]): Promise<number>;
  getSyllabusProgress(examType: string, subjects?: string[]): Promise<SyllabusProgress[]>;
  getWeakChapters(examType: string, threshold?: number, subjects?: string[]): Promise<(SyllabusChapter & { health: number })[]>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(data: UpdateSettingsData): Promise<Settings>;

  // Mock Tests
  createMockTest(data: CreateMockTestData): Promise<MockTest>;
  getMockTests(filters?: { subject?: string; limit?: number }): Promise<MockTest[]>;
  listMockTests(): Promise<MockTest[]>;
  getMockTestAnalytics(): Promise<MockTestAnalytics>;

  // Todos
  createTodo(data: CreateTodoData): Promise<Todo>;
  getTodo(id: string): Promise<Todo | null>;
  listTodos(filters?: TodoFilters): Promise<Todo[]>;
  updateTodo(id: string, data: UpdateTodoData): Promise<Todo | null>;
  deleteTodo(id: string): Promise<boolean>;

  // Auth (profile rows only — authentication itself is Firebase Auth)
  createUser(data: CreateUserData): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, data: Partial<Pick<User, 'name' | 'email' | 'stream' | 'goal' | 'userType' | 'classLevel' | 'weakSubjects' | 'coaching' | 'targetRank' | 'weeklyStudyGoal' | 'studyDaysPerWeek'>>): Promise<User | null>;

  // Export / Import
  deleteAllUserData(userId: string): Promise<void>;
  /** Portable snapshot of the current user's data (version 2 shape). */
  exportUserData(): Promise<UserDataExport>;
  /** Write a snapshot. With replace: true, wipes the target user's data first. */
  importUserData(payload: UserDataExport, opts?: { replace?: boolean }): Promise<ImportResult>;

  // Stats
  getEntryCount(): Promise<number>;
  getEntryCountForMonth(year: number, month: number): Promise<number>;
  getStreak(): Promise<number>;
  getTotalHoursForWeek(weekStart: string): Promise<number>;
}
