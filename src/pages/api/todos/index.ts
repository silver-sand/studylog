import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { validateOrigin } from '../_csrf';
import type { TodoFilters, TodoStatus, TodoCategory, TodoPriority } from '../../../types/todo';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const VALID_CATEGORIES = ['general', 'study', 'personal', 'coaching'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['pending', 'completed', 'cancelled'];

export const GET: APIRoute = async ({ url }) => {
  try {
    const filters: TodoFilters = {};
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const priority = url.searchParams.get('priority');

    if (status && VALID_STATUSES.includes(status)) filters.status = status as TodoStatus;
    if (category && VALID_CATEGORIES.includes(category)) filters.category = category as TodoCategory;
    if (priority && VALID_PRIORITIES.includes(priority)) filters.priority = priority as TodoPriority;

    const todos = await getDb().listTodos(filters);
    return new Response(JSON.stringify(todos), { headers: JSON_HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to load todos' }), { status: 500, headers: JSON_HEADERS });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }
  try {
    const body = await request.json();
    const { title, description, category, priority, dueDate } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), { status: 400, headers: JSON_HEADERS });
    }
    if (title.trim().length > 500) {
      return new Response(JSON.stringify({ error: 'Title must be under 500 characters' }), { status: 400, headers: JSON_HEADERS });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return new Response(JSON.stringify({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }), { status: 400, headers: JSON_HEADERS });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return new Response(JSON.stringify({ error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` }), { status: 400, headers: JSON_HEADERS });
    }

    const todo = await getDb().createTodo({
      title: title.trim(),
      description: description || '',
      category: category || 'general',
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });

    return new Response(JSON.stringify(todo), { status: 201, headers: JSON_HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to create todo' }), { status: 500, headers: JSON_HEADERS });
  }
};
