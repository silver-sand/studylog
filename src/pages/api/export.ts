import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { scopeDbToUser } from '../../services/user-scope';

export const GET: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  const userId = getDb().getCurrentUser();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  try {
    const db = getDb();

    // Use raw queries to get all data for this user
    const entries = db.rawQuery(`SELECT * FROM entries WHERE user_id = ? ORDER BY date DESC`, [userId]);
    const weeklyReviews = db.rawQuery(`SELECT * FROM weekly_reviews WHERE user_id = ? ORDER BY week_start DESC`, [userId]);
    const dailyReviews = db.rawQuery(`SELECT * FROM daily_reviews WHERE user_id = ? ORDER BY date DESC`, [userId]);
    const syllabus = db.rawQuery(`SELECT * FROM syllabus WHERE user_id = ? ORDER BY subject, sort_order`, [userId]);
    const mockTests = db.rawQuery(`SELECT * FROM mock_tests WHERE user_id = ? ORDER BY date DESC`, [userId]);
    const settings = db.rawQuery(`SELECT * FROM settings WHERE user_id = ?`, [userId]);

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        entries,
        weeklyReviews,
        dailyReviews,
        syllabus,
        mockTests,
        settings: settings[0] || null,
      },
    };

    const today = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="studylog-backup-${today}.json"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Export failed';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
