import type { APIRoute } from 'astro';
import { getEntry, updateEntry, deleteEntry, reanalyzeEntry } from '../../../services/entry-service';
import { validateOrigin } from '../_csrf';
import { isDeleteOverride } from '../_http-method-override';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), { status: 400, headers: JSON_HEADERS });
    }

    const entry = await getEntry(id);
    if (!entry) {
      return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404, headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify(entry), { headers: JSON_HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to get entry' }), { status: 500, headers: JSON_HEADERS });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), { status: 400, headers: JSON_HEADERS });
    }

    const body = await request.json();
    const { content, hoursStudied, studyType, focusRating, examType, subjects } = body;

    const existing = await getEntry(id);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404, headers: JSON_HEADERS });
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length < 10) {
        return new Response(JSON.stringify({ error: 'Content must be at least 10 characters' }), { status: 400, headers: JSON_HEADERS });
      }
    }

    if (hoursStudied !== undefined) {
      const h = Number(hoursStudied);
      if (isNaN(h) || h < 0 || h > 24) {
        return new Response(JSON.stringify({ error: 'Hours must be between 0 and 24' }), { status: 400, headers: JSON_HEADERS });
      }
    }

    const VALID_STUDY_TYPES = ['theory', 'problem_solving', 'revision', 'test', 'other'];
    if (studyType !== undefined && !VALID_STUDY_TYPES.includes(studyType)) {
      return new Response(JSON.stringify({ error: 'Invalid study type' }), { status: 400, headers: JSON_HEADERS });
    }

    if (focusRating !== undefined) {
      const r = Number(focusRating);
      if (isNaN(r) || r < 0 || r > 5) {
        return new Response(JSON.stringify({ error: 'Focus rating must be 0-5' }), { status: 400, headers: JSON_HEADERS });
      }
    }

    if (content && content !== existing.content) {
      await updateEntry(id, {
        content: content.trim(),
        hoursStudied: hoursStudied !== undefined ? Number(hoursStudied) : existing.hoursStudied,
        studyType: studyType ?? existing.studyType,
        focusRating: focusRating !== undefined ? Number(focusRating) : existing.focusRating,
        examType: examType ?? existing.examType,
      });
      const updated = await reanalyzeEntry(id);
      return new Response(JSON.stringify(updated ?? await getEntry(id)), { headers: JSON_HEADERS });
    }

    const updated = await updateEntry(id, {
      content: content?.trim() ?? existing.content,
      hoursStudied: hoursStudied !== undefined ? Number(hoursStudied) : existing.hoursStudied,
      studyType: studyType ?? existing.studyType,
      focusRating: focusRating !== undefined ? Number(focusRating) : existing.focusRating,
      examType: examType ?? existing.examType,
      subjects: Array.isArray(subjects) && subjects.length ? subjects : existing.subjects,
    });

    return new Response(JSON.stringify(updated), { headers: JSON_HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to update entry' }), { status: 500, headers: JSON_HEADERS });
  }
};

async function handleDelete(id: string | undefined): Promise<Response> {
  if (!id) {
    return new Response(JSON.stringify({ error: 'Entry ID is required' }), { status: 400, headers: JSON_HEADERS });
  }
  const deleted = await deleteEntry(id);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404, headers: JSON_HEADERS });
  }
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
    return new Response(JSON.stringify({ error: 'Failed to delete entry' }), { status: 500, headers: JSON_HEADERS });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }
  try {
    return await handleDelete(params.id);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to delete entry' }), { status: 500, headers: JSON_HEADERS });
  }
};
