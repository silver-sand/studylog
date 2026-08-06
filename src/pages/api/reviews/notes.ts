import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { validateOrigin } from '../_csrf';

export const PUT: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  try {
    const body = await request.json();
    const { id, notes } = body;

    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ error: 'Review ID is required' }), { status: 400 });
    }

    const db = getDb();
    const review = await db.getReview(id);
    if (!review) {
      return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404 });
    }

    const updated = await db.updateReviewNotes(id, notes || '');
    return new Response(JSON.stringify(updated));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to save notes' }), { status: 500 });
  }
};
