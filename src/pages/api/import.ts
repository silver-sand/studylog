import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { getCurrentUserId } from '../../db/user-context';
import { validateOrigin } from './_csrf';
import type { UserDataExport } from '../../types/data-port';

// ── v1 → v2 normalization ──
// v1 backups were raw sqlite rows (snake_case columns; array/object columns
// stored as JSON strings). v2 is the camelCase domain-object shape that
// importUserData consumes, so legacy backups get lifted to v2 here.

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeV1(body: any): UserDataExport {
  const d = body.data;
  return {
    version: 2,
    exportedAt: body.exportedAt || new Date().toISOString(),
    userId: '',
    data: {
      entries: (d.entries || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        content: r.content || '',
        subjects: parseJson<string[]>(r.subjects, []),
        chapters: parseJson<string[]>(r.chapters, []),
        hoursStudied: r.hours_studied ?? 0,
        studyType: r.study_type || 'other',
        focusRating: r.focus_rating ?? 0,
        examType: r.exam_type || '',
        tags: parseJson<string[]>(r.tags, []),
        aiRaw: r.ai_raw ?? null,
        aiStatus: r.ai_status || 'pending',
        createdAt: r.created_at || new Date().toISOString(),
      })),
      weeklyReviews: (d.weeklyReviews || []).map((r: any) => ({
        id: r.id,
        weekStart: r.week_start,
        weekEnd: r.week_end,
        content: r.content || '',
        insights: parseJson<string[]>(r.insights, []),
        topicCoverage: parseJson<Record<string, number>>(r.topic_coverage, {}),
        strengths: parseJson<string[]>(r.strengths, []),
        weaknesses: parseJson<string[]>(r.weaknesses, []),
        recommendations: parseJson<string[]>(r.recommendations, []),
        entryIds: parseJson<string[]>(r.entry_ids, []),
        notes: r.notes || '',
        createdAt: r.created_at || new Date().toISOString(),
      })),
      dailyReviews: (d.dailyReviews || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        content: r.content || '',
        insights: parseJson<string[]>(r.insights, []),
        totalHours: r.total_hours ?? 0,
        subjects: parseJson<string[]>(r.subjects, []),
        strengths: parseJson<string[]>(r.strengths, []),
        weaknesses: parseJson<string[]>(r.weaknesses, []),
        recommendations: parseJson<string[]>(r.recommendations, []),
        entryIds: parseJson<string[]>(r.entry_ids, []),
        createdAt: r.created_at || new Date().toISOString(),
      })),
      syllabus: (d.syllabus || []).map((r: any) => ({
        id: r.id,
        examType: r.exam_type || '',
        subject: r.subject,
        chapter: r.chapter,
        classLevel: r.class_level ?? null,
        sortOrder: r.sort_order ?? 0,
        status: r.status || 'not_started',
        completedAt: r.completed_at ?? null,
        lastRevisedAt: r.last_revised_at ?? null,
        revisionCount: r.revision_count ?? 0,
      })),
      mockTests: (d.mockTests || []).map((r: any) => ({
        id: r.id,
        examType: r.exam_type || '',
        subject: r.subject,
        testName: r.test_name,
        score: r.score,
        maxMarks: r.max_marks,
        percentage: r.percentage,
        date: r.date,
        notes: r.notes || '',
        createdAt: r.created_at || new Date().toISOString(),
      })),
      todos: (d.todos || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        category: r.category || 'general',
        priority: r.priority || 'medium',
        dueDate: r.due_date ?? null,
        status: r.status || 'pending',
        sortOrder: r.sort_order ?? 0,
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at || r.created_at || new Date().toISOString(),
      })),
      settings: d.settings ? {
        id: d.settings.id || '',
        targetHoursPerWeek: d.settings.target_hours_per_week ?? 35,
        studyDaysPerWeek: d.settings.study_days_per_week ?? 5,
        subjects: parseJson<string[]>(d.settings.subjects, []),
        selectedExams: parseJson<string[]>(d.settings.selected_exams, []),
        examType: d.settings.exam_type || 'JEE',
        examDate: d.settings.exam_date ?? null,
        theme: d.settings.theme || 'dark',
        accentColor: d.settings.accent_color || 'indigo',
        createdAt: d.settings.created_at || new Date().toISOString(),
        updatedAt: d.settings.updated_at || new Date().toISOString(),
      } : null,
    },
  };
}

function toV2(body: any): UserDataExport | null {
  if (!body || typeof body !== 'object') return null;
  if (body.version === 2 && body.data && typeof body.data === 'object') return body as UserDataExport;
  if (body.version === 1 && body.data && typeof body.data === 'object') return normalizeV1(body);
  return null;
}

export const POST: APIRoute = async ({ request, url }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const userId = getCurrentUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const dryRun = url.searchParams.get('dryRun') === 'true';

  try {
    // Enforce 10 MB payload limit
    const text = await request.text();
    if (text.length > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Payload too large. Maximum size is 10 MB.' }), { status: 413 });
    }
    const body = JSON.parse(text);

    const payload = toV2(body);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid import format. Expected version 1 or 2 with data.entries, data.weeklyReviews, data.dailyReviews, data.syllabus, data.mockTests.' }), { status: 400 });
    }

    const MAX_ROWS = 10_000;
    const { entries, weeklyReviews, dailyReviews, syllabus, mockTests, todos } = payload.data;
    if (entries.length > MAX_ROWS || weeklyReviews.length > MAX_ROWS || dailyReviews.length > MAX_ROWS || syllabus.length > MAX_ROWS || mockTests.length > MAX_ROWS || todos.length > MAX_ROWS) {
      return new Response(JSON.stringify({ error: `Too many rows. Maximum ${MAX_ROWS} per table.` }), { status: 413 });
    }

    // Validate row content before importing
    const validationErrors: string[] = [];
    for (const row of entries) {
      if (typeof row.content !== 'string' || row.content.length < 1 || row.content.length > 10000) {
        validationErrors.push(`Entry "${row.id}": content must be 1-10000 characters`);
      }
      if (row.hoursStudied !== undefined && (typeof row.hoursStudied !== 'number' || row.hoursStudied < 0 || row.hoursStudied > 24)) {
        validationErrors.push(`Entry "${row.id}": hoursStudied must be 0-24`);
      }
    }
    for (const row of mockTests) {
      if (row.score !== undefined && typeof row.score !== 'number') {
        validationErrors.push(`Mock test "${row.id}": score must be a number`);
      }
      if (row.maxMarks !== undefined && typeof row.maxMarks !== 'number') {
        validationErrors.push(`Mock test "${row.id}": maxMarks must be a number`);
      }
    }
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation errors', details: validationErrors.slice(0, 20) }), { status: 400 });
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dryRun: true,
        entriesCount: entries.length,
        weeklyReviewsCount: weeklyReviews.length,
        dailyReviewsCount: dailyReviews.length,
        syllabusCount: syllabus.length,
        mockTestsCount: mockTests.length,
        todosCount: todos.length,
      }));
    }

    const db = getDb();
    const result = await db.importUserData(payload, { replace: true });

    return new Response(JSON.stringify({
      success: result.success,
      entriesImported: result.counts.entries,
      weeklyReviewsImported: result.counts.weeklyReviews,
      dailyReviewsImported: result.counts.dailyReviews,
      syllabusImported: result.counts.syllabus,
      mockTestsImported: result.counts.mockTests,
      todosImported: result.counts.todos,
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Import failed';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
