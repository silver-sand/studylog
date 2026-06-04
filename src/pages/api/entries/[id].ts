import type { APIRoute } from 'astro';
import { getEntry, updateEntry, deleteEntry, reanalyzeEntry } from '../../../services/entry-service';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), { status: 400 });
    }

    const entry = getEntry(id);
    if (!entry) {
      return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(entry));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to get entry' }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), { status: 400 });
    }

    const body = await request.json();
    const { content, hoursStudied, studyType, focusRating, examType } = body;

    const existing = getEntry(id);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404 });
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length < 10) {
        return new Response(JSON.stringify({ error: 'Content must be at least 10 characters' }), { status: 400 });
      }
    }

    if (hoursStudied !== undefined) {
      const h = Number(hoursStudied);
      if (isNaN(h) || h < 0 || h > 24) {
        return new Response(JSON.stringify({ error: 'Hours must be between 0 and 24' }), { status: 400 });
      }
    }

    const VALID_STUDY_TYPES = ['theory', 'problem_solving', 'revision', 'test', 'other'];
    if (studyType !== undefined && !VALID_STUDY_TYPES.includes(studyType)) {
      return new Response(JSON.stringify({ error: 'Invalid study type' }), { status: 400 });
    }

    if (focusRating !== undefined) {
      const r = Number(focusRating);
      if (isNaN(r) || r < 0 || r > 5) {
        return new Response(JSON.stringify({ error: 'Focus rating must be 0-5' }), { status: 400 });
      }
    }

    if (content && content !== existing.content) {
      // Save new content + fields FIRST, then re-analyze
      updateEntry(id, {
        content: content.trim(),
        hoursStudied: hoursStudied !== undefined ? Number(hoursStudied) : existing.hoursStudied,
        studyType: studyType || existing.studyType,
        focusRating: focusRating !== undefined ? Number(focusRating) : existing.focusRating,
        examType: examType ?? existing.examType,
      });
      const updated = await reanalyzeEntry(id);
      return new Response(JSON.stringify(updated ?? getEntry(id)));
    }

    const updated = updateEntry(id, {
      content: content?.trim() ?? existing.content,
      hoursStudied: hoursStudied !== undefined ? Number(hoursStudied) : existing.hoursStudied,
      studyType: studyType || existing.studyType,
      focusRating: focusRating !== undefined ? Number(focusRating) : existing.focusRating,
      examType: examType ?? existing.examType,
    });

    return new Response(JSON.stringify(updated));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to update entry' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), { status: 400 });
    }

    const deleted = deleteEntry(id);
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to delete entry' }), { status: 500 });
  }
};
