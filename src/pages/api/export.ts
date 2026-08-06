import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { getCurrentUserId } from '../../db/user-context';

export const GET: APIRoute = async () => {
  const userId = getCurrentUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  try {
    const db = getDb();
    const payload = await db.exportUserData();

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
