import type { APIRoute } from 'astro';
import { getDashboardStats } from '../../services/stats-service';

export const GET: APIRoute = async () => {
  try {
    const stats = getDashboardStats();
    return new Response(JSON.stringify(stats));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to load stats' }), { status: 500 });
  }
};
