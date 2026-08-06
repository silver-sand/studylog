import { getAdminFirestore } from './firebase-admin';
import type { Query } from 'firebase-admin/firestore';
import { generateId } from '../utils/uuid';
import { formatDate, getSunday } from '../utils/date';
import { getCurrentUserId } from './user-context';
import type { Database } from './interface';
import type { Entry, CreateEntryData, EntryFilters } from '../types/entry';
import type { WeeklyReview, CreateReviewData, DailyReview, CreateDailyReviewData, SyllabusChapter, SyllabusProgress, ChapterStatus } from '../types/review';
import { statusWeight } from '../types/review';
import { EXAM_SYLLABI } from '../utils/syllabus-data';
import { legacyExamToSelected, getSubjectsForExamKeys } from '../utils/exam-map';
import type { Settings, UpdateSettingsData } from '../types/settings';
import type { MockTest, CreateMockTestData, MockTestAnalytics } from '../types/mock-test';
import type { Todo, CreateTodoData, UpdateTodoData, TodoFilters } from '../types/todo';
import type { User, CreateUserData } from '../types/auth';
import type { UserDataExport, ImportResult } from '../types/data-port';

const DATA_COLLECTIONS = ['entries', 'weeklyReviews', 'dailyReviews', 'syllabus', 'mockTests', 'todos', 'settings'] as const;
const MAX_BATCH = 400;

/**
 * Firestore implementation of the async Database interface. Every data doc
 * carries `userId`; user scoping comes from AsyncLocalStorage
 * (getCurrentUserId) exactly like the sqlite adapter. Aggregates and
 * secondary sorts are computed in JS over the user's docs to keep the
 * composite-index footprint small (see firestore.indexes.json).
 */
export class FirestoreAdapter implements Database {
  private get fs() {
    return getAdminFirestore();
  }

  private uid(): string {
    const uid = getCurrentUserId();
    if (!uid) throw new Error('No user in context — Firestore queries require a scoped uid');
    return uid;
  }

  // ── Entries ──

  async createEntry(data: CreateEntryData): Promise<Entry> {
    const id = generateId();
    const doc: Entry = {
      id,
      date: data.date,
      content: data.content,
      subjects: data.subjects ?? [],
      chapters: [],
      hoursStudied: data.hoursStudied ?? 0,
      studyType: data.studyType || 'other',
      focusRating: data.focusRating ?? 0,
      examType: data.examType || '',
      tags: [],
      aiRaw: null,
      aiStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    await this.fs.collection('entries').doc(id).set({ ...doc, userId: this.uid() });
    return doc;
  }

  async getEntry(id: string): Promise<Entry | null> {
    const snap = await this.fs.collection('entries').doc(id).get();
    if (!snap.exists || snap.get('userId') !== this.uid()) return null;
    return this.toEntry(id, snap.data()!);
  }

  async getEntryByDate(date: string): Promise<Entry | null> {
    const snap = await this.fs.collection('entries').where('userId', '==', this.uid()).where('date', '==', date).limit(1).get();
    const d = snap.docs[0];
    return d ? this.toEntry(d.id, d.data()) : null;
  }

  async listEntries(filters?: EntryFilters): Promise<Entry[]> {
    let q: Query = this.fs.collection('entries').where('userId', '==', this.uid());
    if (filters?.from && filters?.to) {
      q = q.where('date', '>=', filters.from).where('date', '<=', filters.to);
    }
    q = q.orderBy('date', 'desc');
    if (filters?.limit) {
      q = q.limit(filters.limit + (filters.offset ?? 0));
    }
    const snap = await q.get();
    let entries = snap.docs.map(d => this.toEntry(d.id, d.data()));
    if (filters?.offset) entries = entries.slice(filters.offset);
    return entries;
  }

  async updateEntry(id: string, data: Partial<Entry>): Promise<Entry | null> {
    const existing = await this.getEntry(id);
    if (!existing) return null;
    const patch: Record<string, unknown> = {};
    if (data.content !== undefined) patch.content = data.content;
    if (data.subjects !== undefined) patch.subjects = data.subjects;
    if (data.chapters !== undefined) patch.chapters = data.chapters;
    if (data.hoursStudied !== undefined) patch.hoursStudied = data.hoursStudied;
    if (data.studyType !== undefined) patch.studyType = data.studyType;
    if (data.focusRating !== undefined) patch.focusRating = data.focusRating;
    if (data.examType !== undefined) patch.examType = data.examType;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.aiRaw !== undefined) patch.aiRaw = data.aiRaw;
    if (data.aiStatus !== undefined) patch.aiStatus = data.aiStatus;
    if (Object.keys(patch).length === 0) return existing;
    await this.fs.collection('entries').doc(id).update(patch);
    return await this.getEntry(id);
  }

  async deleteEntry(id: string): Promise<boolean> {
    const existing = await this.getEntry(id);
    if (!existing) return false;
    await this.fs.collection('entries').doc(id).delete();
    return true;
  }

  // ── Weekly Reviews ──

  async createReview(data: CreateReviewData): Promise<WeeklyReview> {
    const id = generateId();
    const doc: WeeklyReview = {
      id,
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      content: data.content,
      insights: data.insights,
      topicCoverage: data.topicCoverage,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      recommendations: data.recommendations,
      entryIds: data.entryIds,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    await this.fs.collection('weeklyReviews').doc(id).set({ ...doc, userId: this.uid() });
    return doc;
  }

  async getReview(id: string): Promise<WeeklyReview | null> {
    const snap = await this.fs.collection('weeklyReviews').doc(id).get();
    if (!snap.exists || snap.get('userId') !== this.uid()) return null;
    return this.toReview(id, snap.data()!);
  }

  async getReviewByWeek(weekStart: string): Promise<WeeklyReview | null> {
    const snap = await this.fs.collection('weeklyReviews').where('userId', '==', this.uid()).where('weekStart', '==', weekStart).limit(1).get();
    const d = snap.docs[0];
    return d ? this.toReview(d.id, d.data()) : null;
  }

  async listReviews(): Promise<WeeklyReview[]> {
    const snap = await this.fs.collection('weeklyReviews').where('userId', '==', this.uid()).orderBy('weekStart', 'desc').get();
    return snap.docs.map(d => this.toReview(d.id, d.data()));
  }

  async upsertReview(data: CreateReviewData): Promise<WeeklyReview> {
    const existing = await this.getReviewByWeek(data.weekStart);
    const id = existing?.id ?? generateId();
    const doc = {
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      content: data.content,
      insights: data.insights,
      topicCoverage: data.topicCoverage,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      recommendations: data.recommendations,
      entryIds: data.entryIds,
      notes: data.notes || existing?.notes || '',
    };
    // Include userId on every write: getReview/getReviewByWeek/listReviews all
    // scope by userId, and a new review written without it is orphaned (invisible).
    await this.fs.collection('weeklyReviews').doc(id).set({ ...doc, userId: this.uid() }, { merge: true });
    const fresh = await this.getReview(id);
    if (!fresh) throw new Error(`Weekly review ${id} not found`);
    return fresh;
  }

  async updateReviewNotes(id: string, notes: string): Promise<WeeklyReview | null> {
    const existing = await this.getReview(id);
    if (!existing) return null;
    await this.fs.collection('weeklyReviews').doc(id).update({ notes: notes || '' });
    return await this.getReview(id);
  }

  async deleteReviewByWeek(weekStart: string): Promise<boolean> {
    const existing = await this.getReviewByWeek(weekStart);
    if (!existing) return false;
    await this.fs.collection('weeklyReviews').doc(existing.id).delete();
    return true;
  }

  // ── Daily Reviews ──

  async createDailyReview(data: CreateDailyReviewData): Promise<DailyReview> {
    const id = generateId();
    const doc: DailyReview = {
      id,
      date: data.date,
      content: data.content,
      insights: data.insights,
      totalHours: data.totalHours,
      subjects: data.subjects,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      recommendations: data.recommendations,
      entryIds: data.entryIds,
      createdAt: new Date().toISOString(),
    };
    await this.fs.collection('dailyReviews').doc(id).set({ ...doc, userId: this.uid() });
    return doc;
  }

  async getDailyReviewByDate(date: string): Promise<DailyReview | null> {
    const snap = await this.fs.collection('dailyReviews').where('userId', '==', this.uid()).where('date', '==', date).limit(1).get();
    const d = snap.docs[0];
    return d ? this.toDailyReview(d.id, d.data()) : null;
  }

  async upsertDailyReview(data: CreateDailyReviewData): Promise<DailyReview> {
    const existing = await this.getDailyReviewByDate(data.date);
    const id = existing?.id ?? generateId();
    // See upsertReview — daily reviews are scoped by userId too.
    await this.fs.collection('dailyReviews').doc(id).set({ ...data, userId: this.uid() }, { merge: true });
    const fresh = await this.getDailyReviewByDate(data.date);
    if (!fresh) throw new Error(`Daily review for ${data.date} not found`);
    return fresh;
  }

  async listDailyReviews(): Promise<DailyReview[]> {
    const snap = await this.fs.collection('dailyReviews').where('userId', '==', this.uid()).orderBy('date', 'desc').get();
    return snap.docs.map(d => this.toDailyReview(d.id, d.data()));
  }

  // ── Syllabus ──

  async seedSyllabusData(examType?: string, subjects?: string[]): Promise<void> {
    const uid = this.uid();

    // Auto-detect subjects from user's settings if not explicitly provided
    if (!subjects || subjects.length === 0) {
      const settingsSnap = await this.fs.collection('settings').doc(uid).get();
      if (settingsSnap.exists) {
        const selectedExams = settingsSnap.get('selectedExams') as string[] | undefined;
        if (Array.isArray(selectedExams) && selectedExams.length > 0) {
          subjects = getSubjectsForExamKeys(selectedExams);
        }
      }
    }

    let items = examType ? EXAM_SYLLABI.filter(i => i.examType === examType) : EXAM_SYLLABI;
    if (subjects && subjects.length > 0) {
      items = items.filter(i => subjects!.includes(i.subject));
    }
    if (items.length === 0) return;

    const existing = new Set<string>();
    const snap = await this.fs.collection('syllabus').where('userId', '==', uid).get();
    for (const d of snap.docs) {
      existing.add(`${d.get('examType')}::${d.get('subject')}::${d.get('chapter')}`);
    }

    const missing = items.filter(i => !existing.has(`${i.examType}::${i.subject}::${i.chapter}`));
    for (let i = 0; i < missing.length; i += MAX_BATCH) {
      const batch = this.fs.batch();
      for (const item of missing.slice(i, i + MAX_BATCH)) {
        batch.set(this.fs.collection('syllabus').doc(generateId()), {
          userId: uid,
          examType: item.examType,
          subject: item.subject,
          chapter: item.chapter,
          classLevel: item.classLevel ?? null,
          sortOrder: item.sortOrder,
          status: 'not_started' as ChapterStatus,
          completedAt: null,
          lastRevisedAt: null,
          revisionCount: 0,
        });
      }
      await batch.commit();
    }
  }

  async getSyllabus(examType?: string, subject?: string): Promise<SyllabusChapter[]> {
    const snap = await this.fs.collection('syllabus').where('userId', '==', this.uid()).get();
    let items = snap.docs.map(d => this.toSyllabusChapter(d.id, d.data()));
    if (examType) items = items.filter(c => c.examType === examType);
    if (subject) items = items.filter(c => c.subject === subject);
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return items;
  }

  async getSyllabusByIds(ids: string[]): Promise<SyllabusChapter[]> {
    const uid = this.uid();
    const results: SyllabusChapter[] = [];
    // `in` is capped at 30 per query.
    for (let i = 0; i < ids.length; i += 30) {
      const chunk = ids.slice(i, i + 30);
      const snap = await this.fs.collection('syllabus').where('__name__', 'in', chunk).get();
      for (const d of snap.docs) {
        if (d.get('userId') === uid) results.push(this.toSyllabusChapter(d.id, d.data()));
      }
    }
    return results;
  }

  async updateSyllabusStatus(id: string, status: string): Promise<SyllabusChapter> {
    const current = (await this.getSyllabusByIds([id]))[0];
    if (!current) throw new Error(`Syllabus entry ${id} not found`);
    const now = new Date().toISOString();
    const isForward = statusWeight(status) > statusWeight(current.status);
    const completedAt = status === 'mastered' ? now : null;
    const lastRevisedAt = isForward && statusWeight(status) >= statusWeight('studied') ? now : null;
    let revisionCount = current.revisionCount;
    if (isForward && (status === 'revision_1' || status === 'revision_2' || status === 'revision_3')) {
      revisionCount += 1;
    }
    await this.fs.collection('syllabus').doc(id).update({ status, completedAt, lastRevisedAt, revisionCount });
    const fresh = (await this.getSyllabusByIds([id]))[0];
    if (!fresh) throw new Error(`Syllabus entry ${id} not found`);
    return fresh;
  }

  async batchUpdateSyllabusStatus(updates: { id: string; status: string }[]): Promise<number> {
    if (updates.length === 0) return 0;
    const currentMap = new Map<string, SyllabusChapter>();
    const ids = updates.map(u => u.id);
    for (let i = 0; i < ids.length; i += 30) {
      const chunk = await this.getSyllabusByIds(ids.slice(i, i + 30));
      for (const c of chunk) currentMap.set(c.id, c);
    }

    const now = new Date().toISOString();
    const batch = this.fs.batch();
    let count = 0;
    for (const { id, status } of updates) {
      const current = currentMap.get(id);
      if (!current) continue;
      const isForward = statusWeight(status) > statusWeight(current.status);
      const completedAt = status === 'mastered' ? now : null;
      const lastRevisedAt = (status === 'revision_1' || status === 'revision_2' || status === 'revision_3') ? now : null;
      let revisionCount = current.revisionCount;
      if (isForward && (status === 'revision_1' || status === 'revision_2' || status === 'revision_3')) {
        revisionCount += 1;
      }
      batch.update(this.fs.collection('syllabus').doc(id), { status, completedAt, lastRevisedAt, revisionCount });
      count++;
    }
    if (count > 0) await batch.commit();
    return count;
  }

  async getSyllabusProgress(examType: string, subjects?: string[]): Promise<SyllabusProgress[]> {
    const chapters = await this.getSyllabus(examType, undefined);
    const filtered = subjects && subjects.length > 0 ? chapters.filter(c => subjects.includes(c.subject)) : chapters;

    const subjectMap = new Map<string, { total: number; sumWeight: number; mastered: number; revised: number }>();
    for (const ch of filtered) {
      if (!subjectMap.has(ch.subject)) {
        subjectMap.set(ch.subject, { total: 0, sumWeight: 0, mastered: 0, revised: 0 });
      }
      const entry = subjectMap.get(ch.subject)!;
      entry.total++;
      entry.sumWeight += statusWeight(ch.status);
      if (ch.status === 'mastered') entry.mastered++;
      if (ch.status === 'revision_1' || ch.status === 'revision_2' || ch.status === 'revision_3') entry.revised++;
    }

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
    const chapters = await this.getSyllabus(examType, undefined);
    const filtered = subjects && subjects.length > 0 ? chapters.filter(c => subjects.includes(c.subject)) : chapters;

    const weak: (SyllabusChapter & { health: number })[] = [];
    const now = Date.now();

    for (const ch of filtered) {
      let health: number;
      if (ch.status === 'mastered') {
        health = 100;
      } else if (ch.status === 'not_started') {
        health = 0;
      } else {
        health = Math.round(statusWeight(ch.status) * 100);
        if (ch.lastRevisedAt) {
          const daysSince = Math.floor((now - new Date(ch.lastRevisedAt).getTime()) / 86400000);
          if (daysSince > 7) health -= Math.min((daysSince - 7) * 2, 40);
        } else {
          health -= 20;
        }
        health = Math.max(0, Math.min(100, health));
      }
      if (health < threshold) weak.push({ ...ch, health });
    }

    weak.sort((a, b) => a.health - b.health);
    return weak;
  }

  // ── Settings ──

  async getSettings(): Promise<Settings> {
    const uid = this.uid();
    const ref = this.fs.collection('settings').doc(uid);
    const snap = await ref.get();
    if (snap.exists) return this.toSettings(uid, snap.data()!);

    const now = new Date().toISOString();
    const defaults: Settings = {
      id: uid,
      targetHoursPerWeek: 35,
      studyDaysPerWeek: 5,
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      selectedExams: ['JEE'],
      examType: 'JEE',
      examDate: null,
      theme: 'dark',
      accentColor: 'indigo',
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(defaults);
    return defaults;
  }

  async updateSettings(data: UpdateSettingsData): Promise<Settings> {
    const uid = this.uid();
    await this.getSettings(); // auto-create if missing
    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.targetHoursPerWeek !== undefined) patch.targetHoursPerWeek = data.targetHoursPerWeek;
    if (data.studyDaysPerWeek !== undefined) patch.studyDaysPerWeek = data.studyDaysPerWeek;
    if (data.subjects !== undefined) patch.subjects = data.subjects;
    if (data.selectedExams !== undefined) patch.selectedExams = data.selectedExams;
    if (data.examType !== undefined) patch.examType = data.examType;
    if (data.examDate !== undefined) patch.examDate = data.examDate;
    if (data.theme !== undefined) patch.theme = data.theme;
    if (data.accentColor !== undefined) patch.accentColor = data.accentColor;
    await this.fs.collection('settings').doc(uid).update(patch);
    return await this.getSettings();
  }

  // ── Mock Tests ──

  async createMockTest(data: CreateMockTestData): Promise<MockTest> {
    const id = generateId();
    const percentage = data.maxMarks > 0 ? Math.round((data.score / data.maxMarks) * 10000) / 100 : 0;
    const doc: MockTest = {
      id,
      examType: data.examType || '',
      subject: data.subject,
      testName: data.testName,
      score: data.score,
      maxMarks: data.maxMarks,
      percentage,
      date: data.date,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    await this.fs.collection('mockTests').doc(id).set({ ...doc, userId: this.uid() });
    return doc;
  }

  async getMockTests(filters?: { subject?: string; limit?: number }): Promise<MockTest[]> {
    const snap = await this.fs.collection('mockTests').where('userId', '==', this.uid()).orderBy('date', 'desc').get();
    let results = snap.docs.map(d => this.toMockTest(d.id, d.data()));
    if (filters?.subject) results = results.filter(m => m.subject === filters.subject);
    if (filters?.limit) results = results.slice(0, filters.limit);
    return results;
  }

  async listMockTests(): Promise<MockTest[]> {
    const snap = await this.fs.collection('mockTests').where('userId', '==', this.uid()).orderBy('date', 'desc').get();
    return snap.docs.map(d => this.toMockTest(d.id, d.data()));
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

  // ── Todos ──

  async createTodo(data: CreateTodoData): Promise<Todo> {
    const id = generateId();
    const now = new Date().toISOString();
    const doc: Todo = {
      id,
      title: data.title,
      description: data.description || '',
      category: data.category || 'general',
      priority: data.priority || 'medium',
      dueDate: data.dueDate ?? null,
      status: 'pending',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.fs.collection('todos').doc(id).set({ ...doc, userId: this.uid() });
    return doc;
  }

  async getTodo(id: string): Promise<Todo | null> {
    const snap = await this.fs.collection('todos').doc(id).get();
    if (!snap.exists || snap.get('userId') !== this.uid()) return null;
    return this.toTodo(id, snap.data()!);
  }

  async listTodos(filters?: TodoFilters): Promise<Todo[]> {
    const snap = await this.fs.collection('todos').where('userId', '==', this.uid()).get();
    let todos = snap.docs.map(d => this.toTodo(d.id, d.data()));
    if (filters?.status) todos = todos.filter(t => t.status === filters.status);
    if (filters?.category) todos = todos.filter(t => t.category === filters.category);
    if (filters?.priority) todos = todos.filter(t => t.priority === filters.priority);
    todos.sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));
    return todos;
  }

  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo | null> {
    const existing = await this.getTodo(id);
    if (!existing) return null;
    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.category !== undefined) patch.category = data.category;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.dueDate !== undefined) patch.dueDate = data.dueDate;
    if (data.status !== undefined) patch.status = data.status;
    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
    await this.fs.collection('todos').doc(id).update(patch);
    return await this.getTodo(id);
  }

  async deleteTodo(id: string): Promise<boolean> {
    const existing = await this.getTodo(id);
    if (!existing) return false;
    await this.fs.collection('todos').doc(id).delete();
    return true;
  }

  // ── Auth (profile rows only — authentication itself is Firebase Auth) ──

  async createUser(data: CreateUserData): Promise<User> {
    const id = data.id ?? generateId();
    const doc: User = {
      id,
      name: data.name,
      email: data.email,
      userType: data.userType ?? 'authenticated',
      stream: data.stream,
      classLevel: data.classLevel,
      goal: data.goal,
      weakSubjects: data.weakSubjects ?? [],
      coaching: data.coaching ?? null,
      targetRank: data.targetRank ?? null,
      weeklyStudyGoal: data.weeklyStudyGoal ?? 35,
      studyDaysPerWeek: data.studyDaysPerWeek ?? 5,
      createdAt: new Date().toISOString(),
    };
    await this.fs.collection('users').doc(id).set(doc);
    return doc;
  }

  async getUserById(id: string): Promise<User | null> {
    const snap = await this.fs.collection('users').doc(id).get();
    if (!snap.exists) return null;
    return this.toUser(id, snap.data()!);
  }

  async updateUser(id: string, data: Partial<Pick<User, 'name' | 'email' | 'stream' | 'goal' | 'userType' | 'classLevel' | 'weakSubjects' | 'coaching' | 'targetRank' | 'weeklyStudyGoal' | 'studyDaysPerWeek'>>): Promise<User | null> {
    const existing = await this.getUserById(id);
    if (!existing) return null;
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.stream !== undefined) patch.stream = data.stream;
    if (data.goal !== undefined) patch.goal = data.goal;
    if (data.userType !== undefined) patch.userType = data.userType;
    if (data.classLevel !== undefined) patch.classLevel = data.classLevel;
    if (data.weakSubjects !== undefined) patch.weakSubjects = data.weakSubjects;
    if (data.coaching !== undefined) patch.coaching = data.coaching;
    if (data.targetRank !== undefined) patch.targetRank = data.targetRank;
    if (data.weeklyStudyGoal !== undefined) patch.weeklyStudyGoal = data.weeklyStudyGoal;
    if (data.studyDaysPerWeek !== undefined) patch.studyDaysPerWeek = data.studyDaysPerWeek;
    if (Object.keys(patch).length === 0) return existing;
    await this.fs.collection('users').doc(id).update(patch);
    return await this.getUserById(id);
  }

  // ── Export / Import ──

  async deleteAllUserData(userId: string): Promise<void> {
    for (const coll of DATA_COLLECTIONS) {
      const snap = await this.fs.collection(coll).where('userId', '==', userId).get();
      for (let i = 0; i < snap.docs.length; i += MAX_BATCH) {
        const batch = this.fs.batch();
        for (const d of snap.docs.slice(i, i + MAX_BATCH)) batch.delete(d.ref);
        await batch.commit();
      }
    }
  }

  async exportUserData(): Promise<UserDataExport> {
    const uid = this.uid();
    const [entries, weeklyReviews, dailyReviews, syllabus, mockTests, todos] = await Promise.all([
      this.listEntries(),
      this.listReviews(),
      this.listDailyReviews(),
      this.getSyllabus(),
      this.listMockTests(),
      this.listTodos(),
    ]);

    let settings: Settings | null = null;
    const snap = await this.fs.collection('settings').doc(uid).get();
    if (snap.exists) settings = this.toSettings(uid, snap.data()!);

    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      userId: uid,
      data: { entries, weeklyReviews, dailyReviews, syllabus, mockTests, todos, settings },
    };
  }

  async importUserData(payload: UserDataExport, opts?: { replace?: boolean }): Promise<ImportResult> {
    const uid = this.uid();
    if (opts?.replace) await this.deleteAllUserData(uid);

    const fs = this.fs;
    const counts = { entries: 0, weeklyReviews: 0, dailyReviews: 0, syllabus: 0, mockTests: 0, todos: 0, settings: 0 };

    const setDocs = async (coll: string, rows: { id: string; data: Record<string, unknown> }[]): Promise<void> => {
      for (let i = 0; i < rows.length; i += MAX_BATCH) {
        const batch = fs.batch();
        for (const r of rows.slice(i, i + MAX_BATCH)) batch.set(fs.collection(coll).doc(r.id), r.data);
        await batch.commit();
      }
    };

    // Truncate aiRaw under the 1 MiB Firestore doc limit (~1M chars).
    const entryRows = payload.data.entries.map(e => {
      const aiRaw = e.aiRaw && e.aiRaw.length > 900_000 ? e.aiRaw.slice(0, 900_000) : e.aiRaw;
      return { id: e.id, data: { ...e, aiRaw, userId: uid } };
    });
    const reviewRows = payload.data.weeklyReviews.map(r => ({ id: r.id, data: { ...r, userId: uid } }));
    const dailyRows = payload.data.dailyReviews.map(d => ({ id: d.id, data: { ...d, userId: uid } }));
    const syllabusRows = payload.data.syllabus.map(s => ({ id: s.id, data: { ...s, userId: uid } }));
    const mockRows = payload.data.mockTests.map(m => ({ id: m.id, data: { ...m, userId: uid } }));
    const todoRows = payload.data.todos.map(t => ({ id: t.id, data: { ...t, userId: uid } }));

    await setDocs('entries', entryRows);
    await setDocs('weeklyReviews', reviewRows);
    await setDocs('dailyReviews', dailyRows);
    await setDocs('syllabus', syllabusRows);
    await setDocs('mockTests', mockRows);
    await setDocs('todos', todoRows);

    counts.entries = entryRows.length;
    counts.weeklyReviews = reviewRows.length;
    counts.dailyReviews = dailyRows.length;
    counts.syllabus = syllabusRows.length;
    counts.mockTests = mockRows.length;
    counts.todos = todoRows.length;

    if (payload.data.settings) {
      const s = payload.data.settings;
      await fs.collection('settings').doc(uid).set({ ...s, id: uid, userId: uid });
      counts.settings = 1;
    }

    return { success: true, counts };
  }

  // ── Stats ──

  async getEntryCount(): Promise<number> {
    const snap = await this.fs.collection('entries').where('userId', '==', this.uid()).count().get();
    return snap.data().count;
  }

  async getEntryCountForMonth(year: number, month: number): Promise<number> {
    // Reuse listEntries (existing userId+date DESC composite index) instead of a
    // raw range+count query, which would require a missing userId+date ASC index.
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const entries = await this.listEntries({ from: `${prefix}-01`, to: `${prefix}-31` });
    return entries.length;
  }

  async getStreak(): Promise<number> {
    const snap = await this.fs.collection('entries').where('userId', '==', this.uid()).select('date').get();
    const dates = snap.docs.map(d => d.get('date') as string).sort().reverse();

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
    // See getEntryCountForMonth — avoid a raw range query that needs a missing index.
    const weekEnd = getSunday(new Date(weekStart));
    const entries = await this.listEntries({ from: weekStart, to: weekEnd });
    return entries.reduce((sum, e) => sum + (e.hoursStudied ?? 0), 0);
  }

  // ── Mappers ──

  private toEntry(id: string, d: Record<string, any>): Entry {
    return {
      id,
      date: d.date,
      content: d.content,
      subjects: d.subjects ?? [],
      chapters: d.chapters ?? [],
      hoursStudied: d.hoursStudied ?? 0,
      studyType: d.studyType || 'other',
      focusRating: d.focusRating ?? 0,
      examType: d.examType || '',
      tags: d.tags ?? [],
      aiRaw: d.aiRaw ?? null,
      aiStatus: d.aiStatus ?? 'pending',
      createdAt: d.createdAt,
    };
  }

  private toReview(id: string, d: Record<string, any>): WeeklyReview {
    return {
      id,
      weekStart: d.weekStart,
      weekEnd: d.weekEnd,
      content: d.content,
      insights: d.insights ?? [],
      topicCoverage: d.topicCoverage ?? {},
      strengths: d.strengths ?? [],
      weaknesses: d.weaknesses ?? [],
      recommendations: d.recommendations ?? [],
      entryIds: d.entryIds ?? [],
      notes: d.notes || '',
      createdAt: d.createdAt,
    };
  }

  private toDailyReview(id: string, d: Record<string, any>): DailyReview {
    return {
      id,
      date: d.date,
      content: d.content,
      insights: d.insights ?? [],
      totalHours: d.totalHours ?? 0,
      subjects: d.subjects ?? [],
      strengths: d.strengths ?? [],
      weaknesses: d.weaknesses ?? [],
      recommendations: d.recommendations ?? [],
      entryIds: d.entryIds ?? [],
      createdAt: d.createdAt,
    };
  }

  private toSyllabusChapter(id: string, d: Record<string, any>): SyllabusChapter {
    return {
      id,
      examType: d.examType,
      subject: d.subject,
      chapter: d.chapter,
      classLevel: d.classLevel ?? null,
      sortOrder: d.sortOrder ?? 0,
      status: (d.status ?? 'not_started') as ChapterStatus,
      completedAt: d.completedAt ?? null,
      lastRevisedAt: d.lastRevisedAt ?? null,
      revisionCount: d.revisionCount ?? 0,
    };
  }

  private toSettings(id: string, d: Record<string, any>): Settings {
    const selectedExams = Array.isArray(d.selectedExams) && d.selectedExams.length > 0
      ? d.selectedExams
      : legacyExamToSelected(d.examType || 'JEE');
    return {
      id,
      targetHoursPerWeek: d.targetHoursPerWeek,
      studyDaysPerWeek: d.studyDaysPerWeek ?? 5,
      subjects: d.subjects ?? ['Physics', 'Chemistry', 'Mathematics'],
      selectedExams,
      examType: d.examType || 'JEE',
      examDate: d.examDate ?? null,
      theme: d.theme || 'dark',
      accentColor: d.accentColor || 'indigo',
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private toMockTest(id: string, d: Record<string, any>): MockTest {
    return {
      id,
      examType: d.examType || '',
      subject: d.subject,
      testName: d.testName,
      score: d.score,
      maxMarks: d.maxMarks,
      percentage: d.percentage,
      date: d.date,
      notes: d.notes || '',
      createdAt: d.createdAt,
    };
  }

  private toTodo(id: string, d: Record<string, any>): Todo {
    return {
      id,
      title: d.title,
      description: d.description || '',
      category: d.category || 'general',
      priority: d.priority || 'medium',
      dueDate: d.dueDate ?? null,
      status: d.status || 'pending',
      sortOrder: d.sortOrder ?? 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private toUser(id: string, d: Record<string, any>): User {
    return {
      id,
      name: d.name,
      email: d.email,
      userType: d.userType ?? 'authenticated',
      stream: d.stream,
      classLevel: d.classLevel,
      goal: d.goal,
      weakSubjects: d.weakSubjects ?? [],
      coaching: d.coaching ?? null,
      targetRank: d.targetRank ?? null,
      weeklyStudyGoal: d.weeklyStudyGoal ?? 35,
      studyDaysPerWeek: d.studyDaysPerWeek ?? 5,
      createdAt: d.createdAt,
    };
  }
}
