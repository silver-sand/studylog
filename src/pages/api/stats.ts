import type { APIRoute } from 'astro';
import { getDashboardStats } from '../../services/stats-service';
import { scopeDbToUser } from '../../services/user-scope';

export const GET: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const stats = getDashboardStats();
    return new Response(JSON.stringify(stats));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to load stats' }), { status: 500 });
  }
};
