import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { scopeDbToUser } from '../../services/user-scope';
import { validateOrigin } from './_csrf';

interface ImportPayload {
  version: number;
  exportedAt: string;
  data: {
    entries: Record<string, any>[];
    weeklyReviews: Record<string, any>[];
    dailyReviews: Record<string, any>[];
    syllabus: Record<string, any>[];
    mockTests: Record<string, any>[];
    settings: Record<string, any> | null;
  };
}

function validatePayload(body: any): body is ImportPayload {
  if (!body || typeof body !== 'object') return false;
  if (typeof body.version !== 'number') return false;
  if (!body.data || typeof body.data !== 'object') return false;
  if (!Array.isArray(body.data.entries)) return false;
  if (!Array.isArray(body.data.weeklyReviews)) return false;
  if (!Array.isArray(body.data.dailyReviews)) return false;
  if (!Array.isArray(body.data.syllabus)) return false;
  if (!Array.isArray(body.data.mockTests)) return false;
  return true;
}

export const POST: APIRoute = async ({ request, url }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  scopeDbToUser(request);
  const userId = getDb().getCurrentUser();
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

    if (!validatePayload(body)) {
      return new Response(JSON.stringify({ error: 'Invalid import format. Expected version, data.entries, data.weeklyReviews, data.dailyReviews, data.syllabus, data.mockTests.' }), { status: 400 });
    }

    const MAX_ROWS = 10_000;
    const { entries, weeklyReviews, dailyReviews, syllabus, mockTests } = body.data;
    if (entries.length > MAX_ROWS || weeklyReviews.length > MAX_ROWS || dailyReviews.length > MAX_ROWS || syllabus.length > MAX_ROWS || mockTests.length > MAX_ROWS) {
      return new Response(JSON.stringify({ error: `Too many rows. Maximum ${MAX_ROWS} per table.` }), { status: 413 });
    }

    // Validate row content before importing
    const validationErrors: string[] = [];
    for (const row of entries) {
      if (typeof row.content !== 'string' || row.content.length < 1 || row.content.length > 10000) {
        validationErrors.push(`Entry "${row.id}": content must be 1-10000 characters`);
      }
      if (row.hours_studied !== undefined && (typeof row.hours_studied !== 'number' || row.hours_studied < 0 || row.hours_studied > 24)) {
        validationErrors.push(`Entry "${row.id}": hours_studied must be 0-24`);
      }
    }
    for (const row of mockTests) {
      if (row.score !== undefined && typeof row.score !== 'number') {
        validationErrors.push(`Mock test "${row.id}": score must be a number`);
      }
      if (row.max_marks !== undefined && typeof row.max_marks !== 'number') {
        validationErrors.push(`Mock test "${row.id}": max_marks must be a number`);
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
      }));
    }

    const db = getDb();

    try {
      db.rawQuery('BEGIN TRANSACTION');

      // Delete all existing user data (same tables as deleteAllUserData)
      db.rawQuery(`DELETE FROM entries WHERE user_id = ?`, [userId]);
      db.rawQuery(`DELETE FROM weekly_reviews WHERE user_id = ?`, [userId]);
      db.rawQuery(`DELETE FROM daily_reviews WHERE user_id = ?`, [userId]);
      db.rawQuery(`DELETE FROM syllabus WHERE user_id = ?`, [userId]);
      db.rawQuery(`DELETE FROM mock_tests WHERE user_id = ?`, [userId]);
      db.rawQuery(`DELETE FROM settings WHERE user_id = ?`, [userId]);
      db.rawQuery(`DELETE FROM sessions WHERE user_id = ?`, [userId]);

      // Re-insert entries with original IDs
      for (const row of entries) {
        db.rawQuery(
          `INSERT INTO entries (id, user_id, date, content, subjects, chapters, hours_studied, study_type, focus_rating, exam_type, tags, ai_raw, ai_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.id, userId, row.date, row.content, row.subjects || '[]', row.chapters || '[]', row.hours_studied ?? 0, row.study_type || 'other', row.focus_rating ?? 0, row.exam_type || '', row.tags || '[]', row.ai_raw || null, row.ai_status || 'pending', row.created_at || new Date().toISOString()]
        );
      }

      // Re-insert weekly reviews
      for (const row of weeklyReviews) {
        db.rawQuery(
          `INSERT INTO weekly_reviews (id, user_id, week_start, week_end, content, insights, topic_coverage, strengths, weaknesses, recommendations, entry_ids, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.id, userId, row.week_start, row.week_end, row.content || '', row.insights || '[]', row.topic_coverage || '{}', row.strengths || '[]', row.weaknesses || '[]', row.recommendations || '[]', row.entry_ids || '[]', row.notes || '', row.created_at || new Date().toISOString()]
        );
      }

      // Re-insert daily reviews
      for (const row of dailyReviews) {
        db.rawQuery(
          `INSERT INTO daily_reviews (id, user_id, date, content, insights, total_hours, subjects, strengths, weaknesses, recommendations, entry_ids, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.id, userId, row.date, row.content || '', row.insights || '[]', row.total_hours ?? 0, row.subjects || '[]', row.strengths || '[]', row.weaknesses || '[]', row.recommendations || '[]', row.entry_ids || '[]', row.created_at || new Date().toISOString()]
        );
      }

      // Re-insert syllabus
      for (const row of syllabus) {
        db.rawQuery(
          `INSERT INTO syllabus (id, user_id, exam_type, subject, chapter, class_level, sort_order, status, completed_at, last_revised_at, revision_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.id, userId, row.exam_type, row.subject, row.chapter, row.class_level || null, row.sort_order ?? 0, row.status || 'not_started', row.completed_at || null, row.last_revised_at || null, row.revision_count ?? 0]
        );
      }

      // Re-insert mock tests
      for (const row of mockTests) {
        db.rawQuery(
          `INSERT INTO mock_tests (id, user_id, exam_type, subject, test_name, score, max_marks, percentage, date, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.id, userId, row.exam_type || '', row.subject, row.test_name, row.score, row.max_marks, row.percentage, row.date, row.notes || '', row.created_at || new Date().toISOString()]
        );
      }

      // Re-insert settings (if present)
      const settingsRow = body.data.settings;
      if (settingsRow) {
        db.rawQuery(
          `INSERT INTO settings (id, user_id, target_hours_per_week, study_days_per_week, subjects, selected_exams, exam_type, exam_date, theme, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            settingsRow.id || Date.now(),
            userId,
            settingsRow.target_hours_per_week ?? 35,
            settingsRow.study_days_per_week ?? 5,
            settingsRow.subjects || '[]',
            settingsRow.selected_exams || '[]',
            settingsRow.exam_type || 'JEE',
            settingsRow.exam_date || null,
            settingsRow.theme || 'dark',
            settingsRow.created_at || new Date().toISOString(),
            settingsRow.updated_at || new Date().toISOString(),
          ]
        );
      }

      db.rawQuery('COMMIT');
    } catch (e) {
      try { db.rawQuery('ROLLBACK'); } catch (_) {}
      throw e;
    }

    // Force flush to disk
    db.flush();

    return new Response(JSON.stringify({
      success: true,
      entriesImported: entries.length,
      weeklyReviewsImported: weeklyReviews.length,
      dailyReviewsImported: dailyReviews.length,
      syllabusImported: syllabus.length,
      mockTestsImported: mockTests.length,
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Import failed';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
