import initSqlJs, { type Database as SqlJsDb } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA_SQL } from './schema';
import { generateId } from '../utils/uuid';
import { formatDate, getSunday } from '../utils/date';
import type { Database as DatabaseInterface } from './interface';
import type { Entry, CreateEntryData, EntryFilters } from '../types/entry';
import type { WeeklyReview, CreateReviewData, DailyReview, CreateDailyReviewData, SyllabusChapter, SyllabusProgress } from '../types/review';
import { EXAM_SYLLABI } from '../utils/syllabus-data';
import type { Settings, UpdateSettingsData } from '../types/settings';

function parseJSON<T>(val: string | null | Uint8Array | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val as string); } catch { return fallback; }
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

function toSyllabusChapter(row: Record<string, any>): SyllabusChapter {
  return {
    id: row.id,
    examType: row.exam_type,
    subject: row.subject,
    chapter: row.chapter,
    classLevel: row.class_level || null,
    sortOrder: row.sort_order,
    status: row.status || 'not_started',
    completedAt: row.completed_at || null,
  };
}

function toSettings(row: Record<string, any>): Settings {
  return {
    id: row.id,
    targetHoursPerWeek: row.target_hours_per_week,
    subjects: parseJSON(row.subjects, ['Physics', 'Chemistry', 'Mathematics']),
    examType: row.exam_type || 'JEE',
    theme: row.theme,
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

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    // Run schema
    for (const statement of SCHEMA_SQL.split(';').filter(s => s.trim())) {
      this.db.run(statement + ';');
    }

    // Migrations for existing DBs (new columns added after initial release)
    const migrations = [
      `ALTER TABLE entries ADD COLUMN study_type TEXT NOT NULL DEFAULT 'other'`,
      `ALTER TABLE entries ADD COLUMN focus_rating INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE entries ADD COLUMN exam_type TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE settings ADD COLUMN exam_type TEXT NOT NULL DEFAULT 'JEE'`,
    ];
    for (const sql of migrations) {
      try { this.db.run(sql); } catch { /* column already exists — ignore */ }
    }

    // Create syllabus table for existing DBs
    try {
      this.db.run(`CREATE TABLE IF NOT EXISTS syllabus (
        id TEXT PRIMARY KEY,
        exam_type TEXT NOT NULL,
        subject TEXT NOT NULL,
        chapter TEXT NOT NULL,
        class_level TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'not_started',
        completed_at TEXT
      )`);
      this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_syllabus_unique ON syllabus(exam_type, subject, chapter)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_syllabus_exam ON syllabus(exam_type, subject)`);
    } catch { /* table already exists */ }

    // Create daily_reviews table for existing DBs
    try {
      this.db.run(`CREATE TABLE IF NOT EXISTS daily_reviews (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL DEFAULT '',
        insights TEXT NOT NULL DEFAULT '[]',
        total_hours REAL NOT NULL DEFAULT 0,
        subjects TEXT NOT NULL DEFAULT '[]',
        strengths TEXT NOT NULL DEFAULT '[]',
        weaknesses TEXT NOT NULL DEFAULT '[]',
        recommendations TEXT NOT NULL DEFAULT '[]',
        entry_ids TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_date ON daily_reviews(date)`);
    } catch { /* table already exists */ }

    this.save();
  }

  private save(): void {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  private getDb(): SqlJsDb {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  // ── Entries ──

  createEntry(data: CreateEntryData): Entry {
    const id = generateId();
    const db = this.getDb();
    db.run(
      `INSERT INTO entries (id, date, content, subjects, chapters, hours_studied, study_type, focus_rating, exam_type, tags, ai_raw, ai_status)
       VALUES (?, ?, ?, '[]', '[]', ?, ?, ?, ?, '[]', NULL, 'pending')`,
      [
        id,
        data.date,
        data.content,
        data.hoursStudied ?? 0,
        data.studyType || 'other',
        data.focusRating ?? 0,
        data.examType || '',
      ]
    );
    this.save();
    return this.getEntry(id)!;
  }

  getEntry(id: string): Entry | null {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM entries WHERE id = ?`);
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toEntry(row);
    }
    stmt.free();
    return null;
  }

  getEntryByDate(date: string): Entry | null {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM entries WHERE date = ?`);
    stmt.bind([date]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toEntry(row);
    }
    stmt.free();
    return null;
  }

  listEntries(filters?: EntryFilters): Entry[] {
    const db = this.getDb();
    let sql = `SELECT * FROM entries`;
    const params: any[] = [];

    if (filters?.from && filters?.to) {
      sql += ` WHERE date >= ? AND date <= ?`;
      params.push(filters.from, filters.to);
    }

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

  updateEntry(id: string, data: Partial<Entry>): Entry | null {
    const existing = this.getEntry(id);
    if (!existing) return null;

    const db = this.getDb();
    db.run(
      `UPDATE entries SET content = ?, subjects = ?, chapters = ?, hours_studied = ?, study_type = ?, focus_rating = ?, exam_type = ?, tags = ?, ai_raw = ?, ai_status = ?
       WHERE id = ?`,
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
      ]
    );
    this.save();
    return this.getEntry(id);
  }

  deleteEntry(id: string): boolean {
    const db = this.getDb();
    db.run(`DELETE FROM entries WHERE id = ?`, [id]);
    this.save();
    const check = this.getEntry(id);
    return check === null;
  }

  // ── Weekly Reviews ──

  createReview(data: CreateReviewData): WeeklyReview {
    const id = generateId();
    const db = this.getDb();
    db.run(
      `INSERT INTO weekly_reviews (id, week_start, week_end, content, insights, topic_coverage, strengths, weaknesses, recommendations, entry_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
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
    return this.getReview(id)!;
  }

  getReview(id: string): WeeklyReview | null {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM weekly_reviews WHERE id = ?`);
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toReview(row);
    }
    stmt.free();
    return null;
  }

  getReviewByWeek(weekStart: string): WeeklyReview | null {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM weekly_reviews WHERE week_start = ?`);
    stmt.bind([weekStart]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toReview(row);
    }
    stmt.free();
    return null;
  }

  listReviews(): WeeklyReview[] {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM weekly_reviews ORDER BY week_start DESC`);
    const reviews: WeeklyReview[] = [];
    while (stmt.step()) {
      reviews.push(toReview(stmt.getAsObject()));
    }
    stmt.free();
    return reviews;
  }

  upsertReview(data: CreateReviewData): WeeklyReview {
    const existing = this.getReviewByWeek(data.weekStart);
    const id = existing?.id ?? generateId();
    const db = this.getDb();

    if (existing) {
      db.run(
        `UPDATE weekly_reviews SET week_start=?, week_end=?, content=?, insights=?, topic_coverage=?, strengths=?, weaknesses=?, recommendations=?, entry_ids=? WHERE id=?`,
        [
          data.weekStart, data.weekEnd, data.content,
          JSON.stringify(data.insights),
          JSON.stringify(data.topicCoverage),
          JSON.stringify(data.strengths),
          JSON.stringify(data.weaknesses),
          JSON.stringify(data.recommendations),
          JSON.stringify(data.entryIds),
          id,
        ]
      );
    } else {
      db.run(
        `INSERT INTO weekly_reviews (id, week_start, week_end, content, insights, topic_coverage, strengths, weaknesses, recommendations, entry_ids)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, data.weekStart, data.weekEnd, data.content,
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
    return this.getReview(id)!;
  }

  // ── Daily Reviews ──

  createDailyReview(data: CreateDailyReviewData): DailyReview {
    const id = generateId();
    const db = this.getDb();
    db.run(
      `INSERT INTO daily_reviews (id, date, content, insights, total_hours, subjects, strengths, weaknesses, recommendations, entry_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
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
    return this.getDailyReviewByDate(data.date)!;
  }

  getDailyReviewByDate(date: string): DailyReview | null {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM daily_reviews WHERE date = ?`);
    stmt.bind([date]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toDailyReview(row);
    }
    stmt.free();
    return null;
  }

  upsertDailyReview(data: CreateDailyReviewData): DailyReview {
    const existing = this.getDailyReviewByDate(data.date);
    const id = existing?.id ?? generateId();
    const db = this.getDb();

    if (existing) {
      db.run(
        `UPDATE daily_reviews SET date=?, content=?, insights=?, total_hours=?, subjects=?, strengths=?, weaknesses=?, recommendations=?, entry_ids=? WHERE id=?`,
        [
          data.date, data.content,
          JSON.stringify(data.insights),
          data.totalHours,
          JSON.stringify(data.subjects),
          JSON.stringify(data.strengths),
          JSON.stringify(data.weaknesses),
          JSON.stringify(data.recommendations),
          JSON.stringify(data.entryIds),
          id,
        ]
      );
    } else {
      db.run(
        `INSERT INTO daily_reviews (id, date, content, insights, total_hours, subjects, strengths, weaknesses, recommendations, entry_ids)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, data.date, data.content,
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
    return this.getDailyReviewByDate(data.date)!;
  }

  // ── Syllabus ──

  seedSyllabusData(): void {
    const db = this.getDb();
    const count = db.exec(`SELECT COUNT(*) as cnt FROM syllabus`);
    if (count.length > 0) {
      const row = count[0].values[0];
      if (row && Number(row[0]) > 0) return; // already seeded
    }

    for (const item of EXAM_SYLLABI) {
      const id = generateId();
      try {
        db.run(
          `INSERT OR IGNORE INTO syllabus (id, exam_type, subject, chapter, class_level, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, item.examType, item.subject, item.chapter, item.classLevel || null, item.sortOrder]
        );
      } catch { /* skip duplicates */ }
    }
    this.save();
  }

  getSyllabus(examType?: string, subject?: string): SyllabusChapter[] {
    const db = this.getDb();
    let sql = `SELECT * FROM syllabus`;
    const params: any[] = [];

    if (examType && subject) {
      sql += ` WHERE exam_type = ? AND subject = ?`;
      params.push(examType, subject);
    } else if (examType) {
      sql += ` WHERE exam_type = ?`;
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

  updateSyllabusStatus(id: string, status: string): SyllabusChapter {
    const db = this.getDb();
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    db.run(
      `UPDATE syllabus SET status = ?, completed_at = ? WHERE id = ?`,
      [status, completedAt, id]
    );
    this.save();

    const stmt = db.prepare(`SELECT * FROM syllabus WHERE id = ?`);
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toSyllabusChapter(row);
    }
    stmt.free();
    throw new Error(`Syllabus entry ${id} not found`);
  }

  getSyllabusProgress(examType: string): SyllabusProgress[] {
    const db = this.getDb();
    const stmt = db.prepare(
      `SELECT subject,
              COUNT(*) as total,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM syllabus
       WHERE exam_type = ?
       GROUP BY subject
       ORDER BY subject`
    );
    stmt.bind([examType]);
    const results: SyllabusProgress[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as { subject: string; total: number; completed: number };
      results.push({
        subject: row.subject,
        total: row.total,
        completed: row.completed,
        percent: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
      });
    }
    stmt.free();
    return results;
  }

  // ── Settings ──

  getSettings(): Settings {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM settings WHERE id = 1`);
    stmt.bind([]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return toSettings(row);
    }
    stmt.free();
    return {
      id: 1,
      targetHoursPerWeek: 35,
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      theme: 'dark',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  updateSettings(data: UpdateSettingsData): Settings {
    const current = this.getSettings();
    const db = this.getDb();
    db.run(
      `UPDATE settings SET target_hours_per_week=?, subjects=?, exam_type=?, theme=?, updated_at=datetime('now') WHERE id=1`,
      [
        data.targetHoursPerWeek ?? current.targetHoursPerWeek,
        JSON.stringify(data.subjects ?? current.subjects),
        data.examType ?? current.examType,
        data.theme ?? current.theme,
      ]
    );
    this.save();
    return this.getSettings();
  }

  // ── Stats ──

  getEntryCount(): number {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM entries`);
    stmt.bind([]);
    stmt.step();
    const row = stmt.getAsObject() as { count: number };
    stmt.free();
    return row.count;
  }

  getEntryCountForMonth(year: number, month: number): number {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const db = this.getDb();
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM entries WHERE date LIKE ? || '%'`);
    stmt.bind([prefix]);
    stmt.step();
    const row = stmt.getAsObject() as { count: number };
    stmt.free();
    return row.count;
  }

  getStreak(): number {
    const db = this.getDb();
    const stmt = db.prepare(`SELECT DISTINCT date FROM entries ORDER BY date DESC`);
    const dates: string[] = [];
    while (stmt.step()) {
      dates.push((stmt.getAsObject() as { date: string }).date);
    }
    stmt.free();

    if (dates.length === 0) return 0;

    let streak = 0;
    const today = formatDate(new Date());

    // Check if there's an entry today or yesterday
    const hasToday = dates[0] === today;
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    const hasYesterday = dates[0] === yesterday;

    if (!hasToday && !hasYesterday) return 0;

    // Start counting from today (or yesterday if that's the latest)
    let checkDate = hasToday ? today : yesterday;

    for (const date of dates) {
      if (date === checkDate) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = formatDate(d);
      } else if (date < checkDate) {
        // Gap found
        break;
      }
    }

    return streak;
  }

  getTotalHoursForWeek(weekStart: string): number {
    const weekEnd = getSunday(new Date(weekStart));
    const db = this.getDb();
    const stmt = db.prepare(
      `SELECT COALESCE(SUM(hours_studied), 0) as total FROM entries WHERE date >= ? AND date <= ?`
    );
    stmt.bind([weekStart, weekEnd]);
    stmt.step();
    const row = stmt.getAsObject() as { total: number };
    stmt.free();
    return row.total;
  }

  // Wait for initialization
  async ensureReady(): Promise<void> {
    await this.ready;
  }
}
