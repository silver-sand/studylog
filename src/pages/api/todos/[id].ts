import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { validateOrigin } from '../_csrf';
import { isDeleteOverride } from '../_http-method-override';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const VALID_CATEGORIES = ['general', 'study', 'personal', 'coaching'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['pending', 'completed', 'cancelled'];

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Todo ID is required' }), { status: 400, headers: JSON_HEADERS });
    }

    const body = await request.json();
    const { title, description, category, priority, dueDate, status, sortOrder } = body;

    if (title !== undefined && (!title.trim() || typeof title !== 'string')) {
      return new Response(JSON.stringify({ error: 'Title must be a non-empty string' }), { status: 400, headers: JSON_HEADERS });
    }

    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return new Response(JSON.stringify({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }), { status: 400, headers: JSON_HEADERS });
    }
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return new Response(JSON.stringify({ error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` }), { status: 400, headers: JSON_HEADERS });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return new Response(JSON.stringify({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` }), { status: 400, headers: JSON_HEADERS });
    }

    const existing = await getDb().getTodo(id);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Todo not found' }), { status: 404, headers: JSON_HEADERS });
    }

    const updated = await getDb().updateTodo(id, {
      title: title !== undefined ? title.trim() : undefined,
      description,
      category,
      priority,
      dueDate: dueDate !== undefined ? dueDate : undefined,
      status,
      sortOrder,
    });

    return new Response(JSON.stringify(updated), { headers: JSON_HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to update todo' }), { status: 500, headers: JSON_HEADERS });
  }
};

async function handleDelete(id: string | undefined): Promise<Response> {
  if (!id) {
    return new Response(JSON.stringify({ error: 'Todo ID is required' }), { status: 400, headers: JSON_HEADERS });
  }
  const existing = await getDb().getTodo(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Todo not found' }), { status: 404, headers: JSON_HEADERS });
  }
  await getDb().deleteTodo(id);
  return new Response(JSON.stringify({ success: true }), { headers: JSON_HEADERS });
}

// POST accepts an X-HTTP-Method-Override: DELETE header so deletions work through
// Vercel's platform CSRF protection, which blocks the DELETE verb outright.
export const POST: APIRoute = async ({ params, request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }
  if (!isDeleteOverride(request)) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: JSON_HEADERS });
  }
  try {
    return await handleDelete(params.id);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to delete todo' }), { status: 500, headers: JSON_HEADERS });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }
  try {
    return await handleDelete(params.id);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to delete todo' }), { status: 500, headers: JSON_HEADERS });
  }
};
