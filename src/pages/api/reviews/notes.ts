import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { scopeDbToUser } from '../../../services/user-scope';
import { validateOrigin } from '../_csrf';

export const PUT: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  scopeDbToUser(request);
  try {
    const body = await request.json();
    const { id, notes } = body;

    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ error: 'Review ID is required' }), { status: 400 });
    }

    const db = getDb();
    const review = db.getReview(id);
    if (!review) {
      return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404 });
    }

    const updated = db.updateReviewNotes(id, notes || '');
    return new Response(JSON.stringify(updated));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to save notes' }), { status: 500 });
  }
};
