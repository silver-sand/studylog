import type { APIRoute } from 'astro';
import { generateReview } from '../../../services/review-service';
import { scopeDbToUser } from '../../../services/user-scope';

export const POST: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const body = await request.json().catch(() => ({}));
    const weekStart = body?.weekStart || undefined;

    const review = await generateReview(weekStart);
    return new Response(JSON.stringify(review), { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to generate review';
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
};
