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
    const body = await request.json();

    if (!validatePayload(body)) {
      return new Response(JSON.stringify({ error: 'Invalid import format. Expected version, data.entries, data.weeklyReviews, data.dailyReviews, data.syllabus, data.mockTests.' }), { status: 400 });
    }

    const db = getDb();
    const { entries, weeklyReviews, dailyReviews, syllabus, mockTests } = body.data;

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

    // Wipe existing data for this user
    db.deleteAllUserData(userId);

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
