import initSqlJs, { type Database as SqlJsDb } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA_SQL } from './schema';
import { generateId } from '../utils/uuid';
import { formatDate, getSunday } from '../utils/date';
import { getCurrentUserId } from './user-context';
import type { Database as DatabaseInterface } from './interface';
import type { Entry, CreateEntryData, EntryFilters } from '../types/entry';
import type { WeeklyReview, CreateReviewData, DailyReview, CreateDailyReviewData, SyllabusChapter, SyllabusProgress, ChapterStatus } from '../types/review';
import { STATUS_ORDER, STATUS_WEIGHTS, statusWeight, isMastered } from '../types/review';
import { EXAM_SYLLABI } from '../utils/syllabus-data';
import { legacyExamToSelected, getSubjectsForExamKeys } from '../utils/exam-map';
import type { Settings, UpdateSettingsData } from '../types/settings';
import type { MockTest, CreateMockTestData, MockTestAnalytics } from '../types/mock-test';
import type { Todo, CreateTodoData, UpdateTodoData, TodoFilters } from '../types/todo';
import type { User, CreateUserData } from '../types/auth';
import type { UserDataExport, ImportResult } from '../types/data-port';

function parseJSON<T>(val: string | null | Uint8Array | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    const str = val instanceof Uint8Array ? new TextDecoder().decode(val) : val as string;
    return JSON.parse(str);
  } catch { return fallback; }
}

function toEntry(row: Record<string, any>): Entry {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    subjects: parseJSON(row.subjects, []),
    chapters: parseJSON(row.chapters, []),
    hoursStudied: row.hours_studied,
    studyType: row.study_type || 'other',
    focusRating: row.focus_rating ?? 0,
    examType: row.exam_type || '',
    tags: parseJSON(row.tags, []),
    aiRaw: row.ai_raw,
    aiStatus: row.ai_status,
    createdAt: row.created_at,
  };
}

function toReview(row: Record<string, any>): WeeklyReview {
  return {
    id: row.id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    content: row.content,
    insights: parseJSON(row.insights, []),
    topicCoverage: parseJSON(row.topic_coverage, {}),
    strengths: parseJSON(row.strengths, []),
    weaknesses: parseJSON(row.weaknesses, []),
    recommendations: parseJSON(row.recommendations, []),
    entryIds: parseJSON(row.entry_ids, []),
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toDailyReview(row: Record<string, any>): DailyReview {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    insights: parseJSON(row.insights, []),
    totalHours: row.total_hours,
    subjects: parseJSON(row.subjects, []),
    strengths: parseJSON(row.strengths, []),
    weaknesses: parseJSON(row.weaknesses, []),
    recommendations: parseJSON(row.recommendations, []),
    entryIds: parseJSON(row.entry_ids, []),
    createdAt: row.created_at,
  };
}

const VALID_STATUSES = new Set(['not_started', 'studied', 'revision_1', 'revision_2', 'revision_3', 'mastered']);

function migrateStatus(status: string): string {
  if (VALID_STATUSES.has(status)) return status;
  if (status === 'in_progress') return 'studied';
  if (status === 'completed') return 'mastered';
  return 'not_started';
}

function toSyllabusChapter(row: Record<string, any>): SyllabusChapter {
  return {
    id: row.id,
    examType: row.exam_type,
    subject: row.subject,
    chapter: row.chapter,
    classLevel: row.class_level || null,
    sortOrder: row.sort_order,
    status: migrateStatus(row.status || 'not_started') as ChapterStatus,
    completedAt: row.completed_at || null,
    lastRevisedAt: row.last_revised_at || null,
    revisionCount: row.revision_count ?? 0,
  };
}

function toSettings(row: Record<string, any>): Settings {
  const selectedExams = parseJSON(row.selected_exams, []);
  const subjects = parseJSON(row.subjects, ['Physics', 'Chemistry', 'Mathematics']);
  return {
    id: String(row.id),
    targetHoursPerWeek: row.target_hours_per_week,
    studyDaysPerWeek: row.study_days_per_week ?? 5,
    subjects,
    selectedExams: Array.isArray(selectedExams) && selectedExams.length > 0 ? selectedExams : legacyExamToSelected(row.exam_type || 'JEE'),
    examType: row.exam_type || 'JEE',
    examDate: row.exam_date || null,
    theme: row.theme || 'dark',
    accentColor: row.accent_color || 'indigo',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SQLiteAdapter implements DatabaseInterface {
  private db: SqlJsDb | null = null;
  private ready: Promise<void>;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const SQL = await initSqlJs();
    const db: SqlJsDb = fs.existsSync(this.dbPath)
      ? new SQL.Database(fs.readFileSync(this.dbPath))
      : new SQL.Database();

    // Split schema into CREATE TABLE (DDL) and CREATE INDEX statements.
    // Run DDL first, then migrations (ALTER TABLE for legacy columns),
    // then indexes — this handles old DB files that lack columns added in later phases.
    const schemaStmts = SCHEMA_SQL.split(';').filter(s => s.trim());
    const ddlStmts = schemaStmts.filter(s => s.trim().toUpperCase().startsWith('CREATE TABLE'));
    const idxStmts = schemaStmts.filter(s => s.trim().toUpperCase().startsWith('CREATE INDEX'));

    for (const stmt of ddlStmts) {
      db.run(stmt + ';');
    }

    // Migrations for existing DBs
    const migrations = [
      `ALTER TABLE entries ADD COLUMN study_type TEXT NOT NULL DEFAULT 'other'`,
      `ALTER TABLE entries ADD COLUMN focus_rating INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE entries ADD COLUMN exam_type TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE settings ADD COLUMN exam_type TEXT NOT NULL DEFAULT 'JEE'`,
      // Phase 5: user_id columns for existing DBs
      `ALTER TABLE entries ADD COLUMN user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id)`,
      `ALTER TABLE weekly_reviews ADD COLUMN user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id)`,
      `ALTER TABLE daily_reviews ADD COLUMN user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id)`,
      `ALTER TABLE settings ADD COLUMN user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id)`,
      `ALTER TABLE syllabus ADD COLUMN user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id)`,
      `ALTER TABLE mock_tests ADD COLUMN user_id TEXT NOT NULL DEFAULT '1' REFERENCES users(id)`,
      // Phase 6: user_type for guest flow
      `ALTER TABLE users ADD COLUMN user_type TEXT NOT NULL DEFAULT 'authenticated'`,
      // Phase 7: selected_exams for multi-exam support
      `ALTER TABLE settings ADD COLUMN selected_exams TEXT NOT NULL DEFAULT '[]'`,
      // Phase 8: profile fields for users
      `ALTER TABLE users ADD COLUMN class_level TEXT`,
      `ALTER TABLE users ADD COLUMN weekly_study_goal REAL NOT NULL DEFAULT 35`,
      `ALTER TABLE users ADD COLUMN study_days_per_week INTEGER NOT NULL DEFAULT 5`,
      // Phase 8: study_days_per_week for settings
      `ALTER TABLE settings ADD COLUMN study_days_per_week INTEGER NOT NULL DEFAULT 5`,
      // Phase 9: profile query fields for users
      `ALTER TABLE users ADD COLUMN weak_subjects TEXT NOT NULL DEFAULT '[]'`,
      `ALTER TABLE users ADD COLUMN coaching TEXT`,
      `ALTER TABLE users ADD COLUMN target_rank TEXT`,
      // Phase 10: notes column for weekly reviews
      `ALTER TABLE weekly_reviews ADD COLUMN notes TEXT NOT NULL DEFAULT ''`,
      // Phase 11: accent_color for theme system
      `ALTER TABLE settings ADD COLUMN accent_color TEXT NOT NULL DEFAULT 'indigo'`,
      // Phase 12: todos table (no ALTER needed — CREATE TABLE IF NOT EXISTS handles it)
    ];
    for (const sql of migrations) {
      try { db.run(sql); } catch (e) {
        // Column-already-exists errors are expected for already-applied migrations
        if (e instanceof Error && e.message.includes('duplicate column name')) {
          continue;
        }
        console.error(`Migration failed: ${sql.substring(0, 60)}...`, e);
        throw e;
      }
    }

    // Migration: copy syllabus rows for legacy user '1' if not already indexed per-user
    try {
      db.run(`DROP INDEX IF EXISTS idx_syllabus_unique`);
      db.run(`DROP INDEX IF EXISTS idx_syllabus_exam`);
    } catch { /* indices may not exist */ }
    try {
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_syllabus_unique ON syllabus(user_id, exam_type, subject, chapter)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_syllabus_exam ON syllabus(user_id, exam_type, subject)`);
    } catch { /* index exists */ }

    // Create user-specific indexes
    try {
      db.run(`CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_weekly_user ON weekly_reviews(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_daily_user ON daily_reviews(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_mock_tests_user ON mock_tests(user_id)`);
    } catch { /* index exists */ }

    // Remaining indexes from schema (date, week_start, session columns — always safe)
    for (const stmt of idxStmts) {
      try { db.run(stmt + ';'); } catch { /* index may already exist */ }
    }

    this.db = db;
    this.save();
  }

  private save(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }

  private getDb(): SqlJsDb {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  // ── Entries ──

  async createEntry(data: CreateEntryData): Promise<Entry> {
    const id = generateId();
    const db = this.getDb();
    db.run(
      `INSERT INTO entries (id, user_id, date, content, subjects, chapters, hours_studied, study_type, focus_rating, exam_type, tags, ai_raw, ai_status)
       VALUES (?, ?, ?, ?, ?, '[]', ?, ?, ?, ?, '[]', NULL, 'pending')`,
      [
        id,
        getCurrentUserId(),
        data.date,
        data.content,
        JSON.stringify(data.subjects ?? []),
        data.hoursStudied ?? 0,
        data.studyType || 'other',
        data.focusRating ?? 0,
        data.examType || '',
      ]
    );
    this.save();
    return (await this.getEntry(id))!;
  }

  async getEntry(id: string): Promise<Entry | null> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM entries WHERE id = ? AND user_id = ?`);
    stmt.bind([id, getCurrentUserId()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toEntry(row);
    }
    stmt.free();
    return null;
  }

  async getEntryByDate(date: string): Promise<Entry | null> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM entries WHERE date = ? AND user_id = ?`);
    stmt.bind([date, getCurrentUserId()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toEntry(row);
    }
    stmt.free();
    return null;
  }

  async listEntries(filters?: EntryFilters): Promise<Entry[]> {
    const db = this.getDb();
    let sql = `SELECT * FROM entries`;
    const params: any[] = [];
    const conditions = [`user_id = ?`];
    params.push(getCurrentUserId());

    if (filters?.from && filters?.to) {
      conditions.push(`date >= ? AND date <= ?`);
      params.push(filters.from, filters.to);
    }

    sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY date DESC, created_at DESC`;

    if (filters?.limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(filters.limit, filters.offset ?? 0);
    }

    const stmt = db.prepare(sql);
    stmt.bind(params);

    const entries: Entry[] = [];
    while (stmt.step()) {
      entries.push(toEntry(stmt.getAsObject()));
    }
    stmt.free();
    return entries;
  }

  async updateEntry(id: string, data: Partial<Entry>): Promise<Entry | null> {
    const existing = await this.getEntry(id);
    if (!existing) return null;

    const db = this.getDb();
    db.run(
      `UPDATE entries SET content = ?, subjects = ?, chapters = ?, hours_studied = ?, study_type = ?, focus_rating = ?, exam_type = ?, tags = ?, ai_raw = ?, ai_status = ?
       WHERE id = ? AND user_id = ?`,
      [
        data.content ?? existing.content,
        JSON.stringify(data.subjects ?? existing.subjects),
        JSON.stringify(data.chapters ?? existing.chapters),
        data.hoursStudied ?? existing.hoursStudied,
        data.studyType ?? existing.studyType,
        data.focusRating ?? existing.focusRating,
        data.examType ?? existing.examType,
        JSON.stringify(data.tags ?? existing.tags),
        data.aiRaw ?? existing.aiRaw,
        data.aiStatus ?? existing.aiStatus,
        id,
        getCurrentUserId(),
      ]
    );
    this.save();
    return await this.getEntry(id);
  }

  async deleteEntry(id: string): Promise<boolean> {
    const db = this.getDb();
    db.run(`DELETE FROM entries WHERE id = ? AND user_id = ?`, [id, getCurrentUserId()]);
    this.save();
    const check = await this.getEntry(id);
    return check === null;
  }

  // ── Weekly Reviews ──

  async createReview(data: CreateReviewData): Promise<WeeklyReview> {
    const id = generateId();
    const db = this.getDb();
    db.run(
      `INSERT INTO weekly_reviews (id, user_id, week_start, week_end, content, insights, topic_coverage, strengths, weaknesses, recommendations, entry_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        getCurrentUserId(),
        data.weekStart,
        data.weekEnd,
        data.content,
        JSON.stringify(data.insights),
        JSON.stringify(data.topicCoverage),
        JSON.stringify(data.strengths),
        JSON.stringify(data.weaknesses),
        JSON.stringify(data.recommendations),
        JSON.stringify(data.entryIds),
      ]
    );
    this.save();
    return (await this.getReview(id))!;
  }

  async getReview(id: string): Promise<WeeklyReview | null> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM weekly_reviews WHERE id = ? AND user_id = ?`);
    stmt.bind([id, getCurrentUserId()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toReview(row);
    }
    stmt.free();
    return null;
  }

  async getReviewByWeek(weekStart: string): Promise<WeeklyReview | null> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM weekly_reviews WHERE week_start = ? AND user_id = ?`);
    stmt.bind([weekStart, getCurrentUserId()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toReview(row);
    }
    stmt.free();
    return null;
  }

  async listReviews(): Promise<WeeklyReview[]> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM weekly_reviews WHERE user_id = ? ORDER BY week_start DESC`);
    stmt.bind([getCurrentUserId()]);
    const reviews: WeeklyReview[] = [];
    while (stmt.step()) {
      reviews.push(toReview(stmt.getAsObject()));
    }
    stmt.free();
    return reviews;
  }

  async upsertReview(data: CreateReviewData): Promise<WeeklyReview> {
    const existing = await this.getReviewByWeek(data.weekStart);
    const id = existing?.id ?? generateId();
    const db = this.getDb();

    if (existing) {
      db.run(
        `UPDATE weekly_reviews SET week_start=?, week_end=?, content=?, insights=?, topic_coverage=?, strengths=?, weaknesses=?, recommendations=?, entry_ids=? WHERE id=? AND user_id=?`,
        [
          data.weekStart, data.weekEnd, data.content,
          JSON.stringify(data.insights),
          JSON.stringify(data.topicCoverage),
          JSON.stringify(data.strengths),
          JSON.stringify(data.weaknesses),
          JSON.stringify(data.recommendations),
          JSON.stringify(data.entryIds),
          id, getCurrentUserId(),
        ]
      );
    } else {
      db.run(
        `INSERT INTO weekly_reviews (id, user_id, week_start, week_end, content, insights, topic_coverage, strengths, weaknesses, recommendations, entry_ids)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, getCurrentUserId(), data.weekStart, data.weekEnd, data.content,
          JSON.stringify(data.insights),
          JSON.stringify(data.topicCoverage),
          JSON.stringify(data.strengths),
          JSON.stringify(data.weaknesses),
          JSON.stringify(data.recommendations),
          JSON.stringify(data.entryIds),
        ]
      );
    }

    this.save();
    return (await this.getReview(id))!;
  }

  async updateReviewNotes(id: string, notes: string): Promise<WeeklyReview | null> {
    const db = this.getDb();
    db.run(`UPDATE weekly_reviews SET notes = ? WHERE id = ? AND user_id = ?`, [notes || '', id, getCurrentUserId()]);
    this.save();
    return await this.getReview(id);
  }

  async deleteReviewByWeek(weekStart: string): Promise<boolean> {
    const db = this.getDb();
    db.run(`DELETE FROM weekly_reviews WHERE week_start = ? AND user_id = ?`, [weekStart, getCurrentUserId()]);
    this.save();
    return (await this.getReviewByWeek(weekStart)) === null;
  }

  // ── Daily Reviews ──

  async createDailyReview(data: CreateDailyReviewData): Promise<DailyReview> {
    const id = generateId();
    const db = this.getDb();
    db.run(
      `INSERT INTO daily_reviews (id, user_id, date, content, insights, total_hours, subjects, strengths, weaknesses, recommendations, entry_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        getCurrentUserId(),
        data.date,
        data.content,
        JSON.stringify(data.insights),
        data.totalHours,
        JSON.stringify(data.subjects),
        JSON.stringify(data.strengths),
        JSON.stringify(data.weaknesses),
        JSON.stringify(data.recommendations),
        JSON.stringify(data.entryIds),
      ]
    );
    this.save();
    return (await this.getDailyReviewByDate(data.date))!;
  }

  async getDailyReviewByDate(date: string): Promise<DailyReview | null> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM daily_reviews WHERE date = ? AND user_id = ?`);
    stmt.bind([date, getCurrentUserId()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toDailyReview(row);
    }
    stmt.free();
    return null;
  }

  async upsertDailyReview(data: CreateDailyReviewData): Promise<DailyReview> {
    const existing = await this.getDailyReviewByDate(data.date);
    const id = existing?.id ?? generateId();
    const db = this.getDb();

    if (existing) {
      db.run(
        `UPDATE daily_reviews SET date=?, content=?, insights=?, total_hours=?, subjects=?, strengths=?, weaknesses=?, recommendations=?, entry_ids=? WHERE id=? AND user_id=?`,
        [
          data.date, data.content,
          JSON.stringify(data.insights),
          data.totalHours,
          JSON.stringify(data.subjects),
          JSON.stringify(data.strengths),
          JSON.stringify(data.weaknesses),
          JSON.stringify(data.recommendations),
          JSON.stringify(data.entryIds),
          id, getCurrentUserId(),
        ]
      );
    } else {
      db.run(
        `INSERT INTO daily_reviews (id, user_id, date, content, insights, total_hours, subjects, strengths, weaknesses, recommendations, entry_ids)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, getCurrentUserId(), data.date, data.content,
          JSON.stringify(data.insights),
          data.totalHours,
          JSON.stringify(data.subjects),
          JSON.stringify(data.strengths),
          JSON.stringify(data.weaknesses),
          JSON.stringify(data.recommendations),
          JSON.stringify(data.entryIds),
        ]
      );
    }

    this.save();
    return (await this.getDailyReviewByDate(data.date))!;
  }

  async listDailyReviews(): Promise<DailyReview[]> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM daily_reviews WHERE user_id = ? ORDER BY date DESC`);
    stmt.bind([getCurrentUserId()]);
    const reviews: DailyReview[] = [];
    while (stmt.step()) {
      reviews.push(toDailyReview(stmt.getAsObject()));
    }
    stmt.free();
    return reviews;
  }

  // ── Syllabus ──

  async seedSyllabusData(examType?: string, subjects?: string[]): Promise<void> {
    const db = this.getDb();

    // Auto-detect subjects from user's settings if not explicitly provided
    if (!subjects || subjects.length === 0) {
      try {
        const stmt = db.prepare(`SELECT selected_exams FROM settings WHERE user_id = ?`);
        stmt.bind([getCurrentUserId()]);
        if (stmt.step()) {
          const row = stmt.getAsObject() as { selected_exams: string };
          const selectedExams = parseJSON<string[]>(row.selected_exams, []);
          if (selectedExams.length > 0) {
            subjects = getSubjectsForExamKeys(selectedExams);
          }
        }
        stmt.free();
      } catch { /* fall through — seed all subjects */ }
    }

    let items = examType
      ? EXAM_SYLLABI.filter(item => item.examType === examType)
      : EXAM_SYLLABI;

    // Filter by subjects if provided — prevents commerce users from getting science chapters
    if (subjects && subjects.length > 0) {
      items = items.filter(item => subjects.includes(item.subject));
    }

    if (items.length === 0) return;

    const existing = new Set<string>();
    try {
      const stmt = db.prepare(`SELECT exam_type, subject, chapter FROM syllabus WHERE user_id = ?`);
      stmt.bind([getCurrentUserId()]);
      while (stmt.step()) {
        const row = stmt.getAsObject() as { exam_type: string; subject: string; chapter: string };
        existing.add(`${row.exam_type}::${row.subject}::${row.chapter}`);
      }
      stmt.free();
    } catch { /* table may not exist yet */ }

    let inserted = false;
    for (const item of items) {
      const key = `${item.examType}::${item.subject}::${item.chapter}`;
      if (existing.has(key)) continue;
      const id = generateId();
      try {
        db.run(
          `INSERT INTO syllabus (id, user_id, exam_type, subject, chapter, class_level, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, getCurrentUserId(), item.examType, item.subject, item.chapter, item.classLevel || null, item.sortOrder]
        );
        inserted = true;
      } catch { /* skip duplicates */ }
    }
    if (inserted) this.save();
  }

  async getSyllabus(examType?: string, subject?: string): Promise<SyllabusChapter[]> {
    const db = this.getDb();
    let sql = `SELECT * FROM syllabus WHERE user_id = ?`;
    const params: any[] = [getCurrentUserId()];

    if (examType && subject) {
      sql += ` AND exam_type = ? AND subject = ?`;
      params.push(examType, subject);
    } else if (examType) {
      sql += ` AND exam_type = ?`;
      params.push(examType);
    }

    sql += ` ORDER BY sort_order ASC`;

    const stmt = db.prepare(sql);
    stmt.bind(params);
    const items: SyllabusChapter[] = [];
    while (stmt.step()) {
      items.push(toSyllabusChapter(stmt.getAsObject()));
    }
    stmt.free();
    return items;
  }

  async getSyllabusByIds(ids: string[]): Promise<SyllabusChapter[]> {
    if (ids.length === 0) return [];
    const db = this.getDb();
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`SELECT * FROM syllabus WHERE id IN (${placeholders}) AND user_id = ?`);
    stmt.bind([...ids, getCurrentUserId()]);
    const items: SyllabusChapter[] = [];
    while (stmt.step()) {
      items.push(toSyllabusChapter(stmt.getAsObject()));
    }
    stmt.free();
    return items;
  }

  async updateSyllabusStatus(id: string, status: string): Promise<SyllabusChapter> {
    const db = this.getDb();

    const current = (await this.getSyllabusByIds([id]))[0];
    const oldWeight = current ? statusWeight(current.status) : 0;
    const newWeight = statusWeight(status);
    const isForward = newWeight > oldWeight;

    const now = new Date().toISOString();
    const completedAt = status === 'mastered' ? now : null;
    const lastRevisedAt = isForward && newWeight >= statusWeight('studied') ? now : null;

    let revisionCount = current ? current.revisionCount : 0;
    if (isForward && (status === 'revision_1' || status === 'revision_2' || status === 'revision_3')) {
      revisionCount += 1;
    }

    db.run(
      `UPDATE syllabus SET status = ?, completed_at = ?, last_revised_at = ?, revision_count = ? WHERE id = ? AND user_id = ?`,
      [status, completedAt, lastRevisedAt, revisionCount, id, getCurrentUserId()]
    );
    this.save();

    const stmt = db.prepare(`SELECT * FROM syllabus WHERE id = ? AND user_id = ?`);
    stmt.bind([id, getCurrentUserId()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toSyllabusChapter(row);
    }
    stmt.free();
    throw new Error(`Syllabus entry ${id} not found`);
  }

  async batchUpdateSyllabusStatus(updates: { id: string; status: string }[]): Promise<number> {
    if (updates.length === 0) return 0;
    const db = this.getDb();
    let count = 0;
    const now = new Date().toISOString();
    // Use a single transaction for all updates
    try {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(
        `UPDATE syllabus SET status = ?, completed_at = ?, last_revised_at = ?, revision_count = revision_count + CASE WHEN ? = 'not_started' THEN 0 ELSE 1 END WHERE id = ? AND user_id = ?`
      );
      for (const { id, status } of updates) {
        const completedAt = status === 'mastered' ? now : null;
        const lastRevisedAt = (status === 'revision_1' || status === 'revision_2' || status === 'revision_3') ? now : null;
        stmt.bind([status, completedAt, lastRevisedAt, status, id, getCurrentUserId()]);
        if (stmt.step()) count++;
        stmt.reset();
      }
      stmt.free();
      db.run('COMMIT');
    } catch (e) {
      try { db.run('ROLLBACK'); } catch (rollbackErr) {
        console.error('ROLLBACK also failed:', rollbackErr);
      }
      throw new Error(`Batch syllabus update failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
    this.save();
    return count;
  }

  async getSyllabusProgress(examType: string, subjects?: string[]): Promise<SyllabusProgress[]> {
    const db = this.getDb();
    const params: any[] = [examType, getCurrentUserId()];
    let subjectFilter = '';
    if (subjects && subjects.length > 0) {
      subjectFilter = ` AND subject IN (${subjects.map(() => '?').join(',')})`;
      params.push(...subjects);
    }
    const stmt = db.prepare(
      `SELECT subject, status, COUNT(*) as count
       FROM syllabus
       WHERE exam_type = ? AND user_id = ?${subjectFilter}
       GROUP BY subject, status
       ORDER BY subject`
    );
    stmt.bind(params);

    const subjectMap = new Map<string, { total: number; sumWeight: number; mastered: number; revised: number }>();
    while (stmt.step()) {
      const row = stmt.getAsObject() as { subject: string; status: string; count: number };
      if (!subjectMap.has(row.subject)) {
        subjectMap.set(row.subject, { total: 0, sumWeight: 0, mastered: 0, revised: 0 });
      }
      const entry = subjectMap.get(row.subject)!;
      entry.total += row.count;
      entry.sumWeight += statusWeight(row.status) * row.count;
      if (row.status === 'mastered') entry.mastered += row.count;
      if (row.status === 'revision_1' || row.status === 'revision_2' || row.status === 'revision_3') entry.revised += row.count;
    }
    stmt.free();

    const results: SyllabusProgress[] = [];
    for (const [subject, data] of subjectMap) {
      results.push({
        subject,
        total: data.total,
        completed: data.mastered,
        percent: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0,
        weightedPercent: data.total > 0 ? Math.round((data.sumWeight / data.total) * 100) : 0,
        mastered: data.mastered,
        revised: data.revised,
      });
    }
    results.sort((a, b) => a.subject.localeCompare(b.subject));
    return results;
  }

  async getWeakChapters(examType: string, threshold = 50, subjects?: string[]): Promise<(SyllabusChapter & { health: number })[]> {
    const db = this.getDb();
    const params: any[] = [examType, getCurrentUserId()];
    let subjectFilter = '';
    if (subjects && subjects.length > 0) {
      subjectFilter = ` AND subject IN (${subjects.map(() => '?').join(',')})`;
      params.push(...subjects);
    }
    const stmt = db.prepare(
      `SELECT * FROM syllabus WHERE exam_type = ? AND user_id = ?${subjectFilter} ORDER BY subject, sort_order`
    );
    stmt.bind(params);

    const weak: (SyllabusChapter & { health: number })[] = [];
    const now = Date.now();

    while (stmt.step()) {
      const row = stmt.getAsObject() as Record<string, any>;
      const ch = toSyllabusChapter(row);
      let health: number;

      if (ch.status === 'mastered') {
        health = 100;
      } else if (ch.status === 'not_started') {
        health = 0;
      } else {
        health = Math.round(statusWeight(ch.status) * 100);
        if (ch.lastRevisedAt) {
          const daysSince = Math.floor((now - new Date(ch.lastRevisedAt).getTime()) / 86400000);
          if (daysSince > 7) {
            health -= Math.min((daysSince - 7) * 2, 40);
          }
        } else {
          health -= 20;
        }
        health = Math.max(0, Math.min(100, health));
      }

      if (health < threshold) {
        weak.push({ ...ch, health });
      }
    }

    stmt.free();
    weak.sort((a, b) => a.health - b.health);
    return weak;
  }

  // ── Settings ──

  async getSettings(): Promise<Settings> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM settings WHERE user_id = ?`);
    stmt.bind([getCurrentUserId()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toSettings(row);
    }
    stmt.free();

    // Create default settings for this user
    // Use Date.now() as numeric ID for INTEGER PRIMARY KEY compatibility
    const id = Date.now();
    const defaultExams = ['JEE'];
    db.run(
      `INSERT INTO settings (id, user_id, target_hours_per_week, study_days_per_week, subjects, selected_exams, exam_type, theme, accent_color, created_at, updated_at)
       VALUES (?, ?, 35, 5, '["Physics","Chemistry","Mathematics"]', ?, 'JEE', 'dark', 'indigo', datetime('now'), datetime('now'))`,
      [id, getCurrentUserId(), JSON.stringify(defaultExams)]
    );
    this.save();
    return await this.getSettings();
  }

  async updateSettings(data: UpdateSettingsData): Promise<Settings> {
    const current = await this.getSettings();
    const db = this.getDb();

    // Find the settings row for this user
    const existing = db.prepare(`SELECT id FROM settings WHERE user_id = ?`);
    existing.bind([getCurrentUserId()]);
    const hasRow = existing.step();
    existing.free();

    if (!hasRow) {
      // Create settings row first
      // Use Date.now() as numeric ID for INTEGER PRIMARY KEY compatibility
      const newId = Date.now();
      const selectedExams = data.selectedExams ?? legacyExamToSelected(data.examType ?? current.examType ?? 'JEE');
      const subjects = data.subjects ?? getSubjectsForExamKeys(selectedExams);
      db.run(
        `INSERT INTO settings (id, user_id, target_hours_per_week, study_days_per_week, subjects, selected_exams, exam_type, exam_date, theme, accent_color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          newId, getCurrentUserId(),
          data.targetHoursPerWeek ?? 35,
          data.studyDaysPerWeek ?? 5,
          JSON.stringify(subjects),
          JSON.stringify(selectedExams),
          data.examType ?? 'JEE',
          data.examDate ?? null,
          data.theme ?? 'dark',
          data.accentColor ?? 'indigo',
        ]
      );
      this.save();
      return await this.getSettings();
    }

    db.run(
      `UPDATE settings SET target_hours_per_week=?, study_days_per_week=?, subjects=?, selected_exams=?, exam_type=?, exam_date=?, theme=?, accent_color=?, updated_at=datetime('now') WHERE user_id=?`,
      [
        data.targetHoursPerWeek ?? current.targetHoursPerWeek,
        data.studyDaysPerWeek ?? current.studyDaysPerWeek,
        JSON.stringify(data.subjects ?? current.subjects),
        JSON.stringify(data.selectedExams ?? current.selectedExams),
        data.examType ?? current.examType,
        data.examDate !== undefined ? data.examDate : current.examDate,
        data.theme ?? current.theme,
        data.accentColor ?? current.accentColor,
        getCurrentUserId(),
      ]
    );
    this.save();
    return await this.getSettings();
  }

  // ── Export / Import ──

  rawQuery(sql: string, params?: any[]): Record<string, any>[] {
    const db = this.getDb();
    const trimmed = sql.trim().toUpperCase();
    // For SELECT queries, use prepare/step to return rows
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
      const stmt = db.prepare(sql);
      stmt.bind(params || []);
      const rows: Record<string, any>[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    }
    // For DML (INSERT, UPDATE, DELETE), use db.run()
    db.run(sql, params || []);
    return [];
  }

  async deleteAllUserData(userId: string): Promise<void> {
    const db = this.getDb();
    db.run('BEGIN TRANSACTION');
    try {
      db.run(`DELETE FROM entries WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM weekly_reviews WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM daily_reviews WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM syllabus WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM mock_tests WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM settings WHERE user_id = ?`, [userId]);
      db.run(`DELETE FROM sessions WHERE user_id = ?`, [userId]);
      db.run('COMMIT');
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
    this.save();
  }

  async exportUserData(): Promise<UserDataExport> {
    const [entries, weeklyReviews, dailyReviews, syllabus, mockTests, todos] = await Promise.all([
      this.listEntries(),
      this.listReviews(),
      this.listDailyReviews(),
      this.getSyllabus(),
      this.listMockTests(),
      this.listTodos(),
    ]);

    // Read settings without auto-creating (export must not mutate).
    let settings: Settings | null = null;
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM settings WHERE user_id = ?`);
    stmt.bind([getCurrentUserId()]);
    if (stmt.step()) {
      settings = toSettings(stmt.getAsObject());
    }
    stmt.free();

    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      userId: getCurrentUserId(),
      data: { entries, weeklyReviews, dailyReviews, syllabus, mockTests, todos, settings },
    };
  }

  async importUserData(payload: UserDataExport, opts?: { replace?: boolean }): Promise<ImportResult> {
    const uid = getCurrentUserId();
    const db = this.getDb();

    if (opts?.replace) {
      await this.deleteAllUserData(uid);
    }

    const counts = { entries: 0, weeklyReviews: 0, dailyReviews: 0, syllabus: 0, mockTests: 0, todos: 0, settings: 0 };

    db.run('BEGIN TRANSACTION');
    try {
      const insertEntry = db.prepare(
        `INSERT OR REPLACE INTO entries (id, user_id, date, content, subjects, chapters, hours_studied, study_type, focus_rating, exam_type, tags, ai_raw, ai_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const e of payload.data.entries) {
        insertEntry.run([e.id, uid, e.date, e.content, JSON.stringify(e.subjects), JSON.stringify(e.chapters), e.hoursStudied, e.studyType || 'other', e.focusRating ?? 0, e.examType || '', JSON.stringify(e.tags), e.aiRaw ?? null, e.aiStatus ?? 'pending', e.createdAt]);
        counts.entries++;
      }
      insertEntry.free();

      const insertReview = db.prepare(
        `INSERT OR REPLACE INTO weekly_reviews (id, user_id, week_start, week_end, content, insights, topic_coverage, strengths, weaknesses, recommendations, entry_ids, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const r of payload.data.weeklyReviews) {
        insertReview.run([r.id, uid, r.weekStart, r.weekEnd, r.content, JSON.stringify(r.insights), JSON.stringify(r.topicCoverage), JSON.stringify(r.strengths), JSON.stringify(r.weaknesses), JSON.stringify(r.recommendations), JSON.stringify(r.entryIds), r.notes || '', r.createdAt]);
        counts.weeklyReviews++;
      }
      insertReview.free();

      const insertDaily = db.prepare(
        `INSERT OR REPLACE INTO daily_reviews (id, user_id, date, content, insights, total_hours, subjects, strengths, weaknesses, recommendations, entry_ids, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const d of payload.data.dailyReviews) {
        insertDaily.run([d.id, uid, d.date, d.content, JSON.stringify(d.insights), d.totalHours, JSON.stringify(d.subjects), JSON.stringify(d.strengths), JSON.stringify(d.weaknesses), JSON.stringify(d.recommendations), JSON.stringify(d.entryIds), d.createdAt]);
        counts.dailyReviews++;
      }
      insertDaily.free();

      const insertSyllabus = db.prepare(
        `INSERT OR REPLACE INTO syllabus (id, user_id, exam_type, subject, chapter, class_level, sort_order, status, completed_at, last_revised_at, revision_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const s of payload.data.syllabus) {
        insertSyllabus.run([s.id, uid, s.examType, s.subject, s.chapter, s.classLevel || null, s.sortOrder, s.status || 'not_started', s.completedAt || null, s.lastRevisedAt || null, s.revisionCount ?? 0]);
        counts.syllabus++;
      }
      insertSyllabus.free();

      const insertMock = db.prepare(
        `INSERT OR REPLACE INTO mock_tests (id, user_id, exam_type, subject, test_name, score, max_marks, percentage, date, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const m of payload.data.mockTests) {
        insertMock.run([m.id, uid, m.examType || '', m.subject, m.testName, m.score, m.maxMarks, m.percentage, m.date, m.notes || '', m.createdAt]);
        counts.mockTests++;
      }
      insertMock.free();

      const insertTodo = db.prepare(
        `INSERT OR REPLACE INTO todos (id, user_id, title, description, category, priority, due_date, status, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const t of payload.data.todos) {
        insertTodo.run([t.id, uid, t.title, t.description || '', t.category || 'general', t.priority || 'medium', t.dueDate || null, t.status || 'pending', t.sortOrder ?? 0, t.createdAt, t.updatedAt || t.createdAt]);
        counts.todos++;
      }
      insertTodo.free();

      if (payload.data.settings) {
        db.run(`DELETE FROM settings WHERE user_id = ?`, [uid]);
        const s = payload.data.settings;
        db.run(
          `INSERT INTO settings (id, user_id, target_hours_per_week, study_days_per_week, subjects, selected_exams, exam_type, exam_date, theme, accent_color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uid, uid, s.targetHoursPerWeek, s.studyDaysPerWeek, JSON.stringify(s.subjects), JSON.stringify(s.selectedExams), s.examType || 'JEE', s.examDate || null, s.theme || 'dark', s.accentColor || 'indigo', s.createdAt, s.updatedAt]
        );
        counts.settings++;
      }

      db.run('COMMIT');
    } catch (e) {
      try { db.run('ROLLBACK'); } catch { /* ignore */ }
      throw e;
    }
    this.save();

    return { success: true, counts };
  }

  // ── Stats ──

  async getEntryCount(): Promise<number> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM entries WHERE user_id = ?`);
    stmt.bind([getCurrentUserId()]);
    stmt.step();
    const row = stmt.getAsObject() as { count: number };
    stmt.free();
    return row.count;
  }

  async getEntryCountForMonth(year: number, month: number): Promise<number> {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const db = this.getDb();
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM entries WHERE date LIKE ? || '%' AND user_id = ?`);
    stmt.bind([prefix, getCurrentUserId()]);
    stmt.step();
    const row = stmt.getAsObject() as { count: number };
    stmt.free();
    return row.count;
  }

  async getStreak(): Promise<number> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT DISTINCT date FROM entries WHERE user_id = ? ORDER BY date DESC`);
    stmt.bind([getCurrentUserId()]);
    const dates: string[] = [];
    while (stmt.step()) {
      dates.push((stmt.getAsObject() as { date: string }).date);
    }
    stmt.free();

    if (dates.length === 0) return 0;

    let streak = 0;
    const today = formatDate(new Date());

    const hasToday = dates[0] === today;
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    const hasYesterday = dates[0] === yesterday;

    if (!hasToday && !hasYesterday) return 0;

    let checkDate = hasToday ? today : yesterday;

    for (const date of dates) {
      if (date === checkDate) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = formatDate(d);
      } else if (date < checkDate) {
        break;
      }
    }

    return streak;
  }

  async getTotalHoursForWeek(weekStart: string): Promise<number> {
    const weekEnd = getSunday(new Date(weekStart));
    const db = this.getDb();
    const stmt = db.prepare(
      `SELECT COALESCE(SUM(hours_studied), 0) as total FROM entries WHERE date >= ? AND date <= ? AND user_id = ?`
    );
    stmt.bind([weekStart, weekEnd, getCurrentUserId()]);
    stmt.step();
    const row = stmt.getAsObject() as { total: number };
    stmt.free();
    return row.total;
  }

  // ── Mock Tests ──

  async createMockTest(data: CreateMockTestData): Promise<MockTest> {
    const db = this.getDb();
    const id = generateId();
    const percentage = data.maxMarks > 0 ? Math.round((data.score / data.maxMarks) * 10000) / 100 : 0;
    db.run(
      `INSERT INTO mock_tests (id, user_id, exam_type, subject, test_name, score, max_marks, percentage, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, getCurrentUserId(), data.examType || '', data.subject, data.testName,
        data.score, data.maxMarks, percentage, data.date,
        data.notes || '',
      ]
    );
    this.save();
    // Re-read the row from DB to get the consistent created_at format
    const stmt = db.prepare(`SELECT * FROM mock_tests WHERE id = ?`);
    stmt.bind([id]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return this.toMockTest(row || { id, user_id: getCurrentUserId(), exam_type: data.examType || '', subject: data.subject, test_name: data.testName, score: data.score, max_marks: data.maxMarks, percentage, date: data.date, notes: data.notes || '' });
  }

  async getMockTests(filters?: { subject?: string; limit?: number }): Promise<MockTest[]> {
    const db = this.getDb();
    let sql = `SELECT * FROM mock_tests WHERE user_id = ?`;
    const params: any[] = [getCurrentUserId()];

    if (filters?.subject) {
      sql += ` AND subject = ?`;
      params.push(filters.subject);
    }

    sql += ` ORDER BY date DESC`;

    if (filters?.limit) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);
    }

    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results: MockTest[] = [];
    while (stmt.step()) {
      results.push(this.toMockTest(stmt.getAsObject()));
    }
    stmt.free();
    return results;
  }

  async listMockTests(): Promise<MockTest[]> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM mock_tests WHERE user_id = ? ORDER BY date DESC`);
    stmt.bind([getCurrentUserId()]);
    const results: MockTest[] = [];
    while (stmt.step()) {
      results.push(this.toMockTest(stmt.getAsObject()));
    }
    stmt.free();
    return results;
  }

  async getMockTestAnalytics(): Promise<MockTestAnalytics> {
    const all = await this.getMockTests({ limit: 100 });

    if (all.length === 0) {
      return {
        totalTests: 0,
        averagePercentage: 0,
        bestScore: null,
        worstScore: null,
        trend: 'insufficient_data',
        recentTests: [],
        subjectBreakdown: [],
      };
    }

    const avgPct = Math.round(all.reduce((s, t) => s + t.percentage, 0) / all.length * 100) / 100;

    const best = all.reduce((b, t) => t.percentage > b.percentage ? t : b, all[0]);
    const worst = all.reduce((w, t) => t.percentage < w.percentage ? t : w, all[0]);

    let trend: MockTestAnalytics['trend'] = 'stable';
    if (all.length >= 4) {
      const mid = Math.floor(all.length / 2);
      const firstHalf = all.slice(0, mid);
      const secondHalf = all.slice(mid);
      const firstAvg = firstHalf.reduce((s, t) => s + t.percentage, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, t) => s + t.percentage, 0) / secondHalf.length;
      if (secondAvg > firstAvg + 3) trend = 'improving';
      else if (secondAvg < firstAvg - 3) trend = 'declining';
    }

    const subjectMap = new Map<string, { total: number; sum: number }>();
    for (const t of all) {
      if (!subjectMap.has(t.subject)) subjectMap.set(t.subject, { total: 0, sum: 0 });
      const entry = subjectMap.get(t.subject)!;
      entry.total++;
      entry.sum += t.percentage;
    }
    const subjectBreakdown = [...subjectMap.entries()].map(([subject, data]) => ({
      subject,
      tests: data.total,
      avgPercentage: Math.round(data.sum / data.total * 100) / 100,
    }));

    return {
      totalTests: all.length,
      averagePercentage: avgPct,
      bestScore: { testName: best.testName, percentage: best.percentage, subject: best.subject, date: best.date },
      worstScore: { testName: worst.testName, percentage: worst.percentage, subject: worst.subject, date: worst.date },
      trend,
      recentTests: all.slice(0, 10),
      subjectBreakdown,
    };
  }

  private toMockTest(row: Record<string, any>): MockTest {
    return {
      id: row.id,
      examType: row.exam_type || '',
      subject: row.subject,
      testName: row.test_name,
      score: row.score,
      maxMarks: row.max_marks,
      percentage: row.percentage,
      date: row.date,
      notes: row.notes || '',
      createdAt: row.created_at,
    };
  }

  // ── Todos ──

  async createTodo(data: CreateTodoData): Promise<Todo> {
    const id = generateId();
    const db = this.getDb();
    db.run(
      `INSERT INTO todos (id, user_id, title, description, category, priority, due_date, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
      [
        id, getCurrentUserId(), data.title, data.description || '',
        data.category || 'general', data.priority || 'medium',
        data.dueDate || null,
      ]
    );
    this.save();
    return (await this.getTodo(id))!;
  }

  async getTodo(id: string): Promise<Todo | null> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM todos WHERE id = ? AND user_id = ?`);
    stmt.bind([id, getCurrentUserId()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return this.toTodo(row);
    }
    stmt.free();
    return null;
  }

  async listTodos(filters?: TodoFilters): Promise<Todo[]> {
    const db = this.getDb();
    let sql = `SELECT * FROM todos WHERE user_id = ?`;
    const params: any[] = [getCurrentUserId()];

    if (filters?.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters?.category) {
      sql += ` AND category = ?`;
      params.push(filters.category);
    }
    if (filters?.priority) {
      sql += ` AND priority = ?`;
      params.push(filters.priority);
    }

    sql += ` ORDER BY sort_order ASC, created_at DESC`;

    const stmt = db.prepare(sql);
    stmt.bind(params);
    const todos: Todo[] = [];
    while (stmt.step()) {
      todos.push(this.toTodo(stmt.getAsObject()));
    }
    stmt.free();
    return todos;
  }

  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo | null> {
    const existing = await this.getTodo(id);
    if (!existing) return null;

    const db = this.getDb();
    db.run(
      `UPDATE todos SET title=?, description=?, category=?, priority=?, due_date=?, status=?, sort_order=?, updated_at=datetime('now')
       WHERE id=? AND user_id=?`,
      [
        data.title ?? existing.title,
        data.description ?? existing.description,
        data.category ?? existing.category,
        data.priority ?? existing.priority,
        data.dueDate !== undefined ? data.dueDate : existing.dueDate,
        data.status ?? existing.status,
        data.sortOrder ?? existing.sortOrder,
        id, getCurrentUserId(),
      ]
    );
    this.save();
    return await this.getTodo(id);
  }

  async deleteTodo(id: string): Promise<boolean> {
    const db = this.getDb();
    db.run(`DELETE FROM todos WHERE id = ? AND user_id = ?`, [id, getCurrentUserId()]);
    this.save();
    return (await this.getTodo(id)) === null;
  }

  private toTodo(row: Record<string, any>): Todo {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      category: row.category || 'general',
      priority: row.priority || 'medium',
      dueDate: row.due_date || null,
      status: row.status || 'pending',
      sortOrder: row.sort_order ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ── Auth ──

  async createUser(data: CreateUserData): Promise<User> {
    const db = this.getDb();
    const id = data.id ?? generateId();
    const createdAt = new Date().toISOString();
    db.run(
      `INSERT INTO users (id, name, email, password_hash, user_type, stream, class_level, goal, weak_subjects, coaching, target_rank, weekly_study_goal, study_days_per_week, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.email, '', data.userType ?? 'authenticated', data.stream || null, data.classLevel || null, data.goal || null, JSON.stringify(data.weakSubjects ?? []), data.coaching || null, data.targetRank || null, data.weeklyStudyGoal ?? 35, data.studyDaysPerWeek ?? 5, createdAt]
    );
    this.save();
    return {
      id, name: data.name, email: data.email,
      userType: data.userType ?? 'authenticated', stream: data.stream,
      classLevel: data.classLevel, goal: data.goal,
      weakSubjects: data.weakSubjects ?? [],
      coaching: (data.coaching as User['coaching']) ?? null,
      targetRank: data.targetRank ?? null,
      weeklyStudyGoal: data.weeklyStudyGoal ?? 35,
      studyDaysPerWeek: data.studyDaysPerWeek ?? 5,
      createdAt,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as Record<string, any>;
      stmt.free();
      return this.toUser(row);
    }
    stmt.free();
    return null;
  }

  async updateUser(id: string, data: Partial<Pick<User, 'name' | 'email' | 'stream' | 'goal' | 'userType' | 'classLevel' | 'weakSubjects' | 'coaching' | 'targetRank' | 'weeklyStudyGoal' | 'studyDaysPerWeek'>>): Promise<User | null> {
    const db = this.getDb();
    const sets: string[] = [];
    const params: any[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name); }
    if (data.email !== undefined) { sets.push('email = ?'); params.push(data.email); }
    if (data.stream !== undefined) { sets.push('stream = ?'); params.push(data.stream); }
    if (data.goal !== undefined) { sets.push('goal = ?'); params.push(data.goal); }
    if (data.userType !== undefined) { sets.push('user_type = ?'); params.push(data.userType); }
    if (data.classLevel !== undefined) { sets.push('class_level = ?'); params.push(data.classLevel); }
    if (data.weeklyStudyGoal !== undefined) { sets.push('weekly_study_goal = ?'); params.push(data.weeklyStudyGoal); }
    if (data.studyDaysPerWeek !== undefined) { sets.push('study_days_per_week = ?'); params.push(data.studyDaysPerWeek); }
    if (data.weakSubjects !== undefined) { sets.push('weak_subjects = ?'); params.push(JSON.stringify(data.weakSubjects)); }
    if (data.coaching !== undefined) { sets.push('coaching = ?'); params.push(data.coaching); }
    if (data.targetRank !== undefined) { sets.push('target_rank = ?'); params.push(data.targetRank); }
    if (sets.length === 0) return await this.getUserById(id);
    params.push(id);
    db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    this.save();
    return await this.getUserById(id);
  }

  private toUser(row: Record<string, any>): User {
    return {
      id: row.id, name: row.name, email: row.email,
      userType: row.user_type ?? 'authenticated',
      stream: row.stream,
      classLevel: row.class_level,
      goal: row.goal,
      weakSubjects: parseJSON(row.weak_subjects, []),
      coaching: row.coaching ?? null,
      targetRank: row.target_rank ?? null,
      weeklyStudyGoal: row.weekly_study_goal ?? 35,
      studyDaysPerWeek: row.study_days_per_week ?? 5,
      createdAt: row.created_at,
    };
  }

  // Wait for initialization
  async ensureReady(): Promise<void> {
    await this.ready;
  }
}
