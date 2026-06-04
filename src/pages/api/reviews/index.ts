import type { APIRoute } from 'astro';
import { listReviews } from '../../../services/review-service';

export const GET: APIRoute = async () => {
  try {
    const reviews = listReviews();
    return new Response(JSON.stringify(reviews));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to list reviews' }), { status: 500 });
  }
};
