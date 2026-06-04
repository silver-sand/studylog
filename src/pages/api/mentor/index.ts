import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { createAIServiceFromEnv } from '../../../ai';
import type { MentorContext, ChatMessage } from '../../../types/ai';
import { scopeDbToUser } from '../../../services/user-scope';

export const POST: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const { query, history } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'query is required' }), { status: 400 });
    }

    const db = getDb();
    const settings = db.getSettings();

    // Map exam name to syllabus key
    const examKeyMap: Record<string, string> = {
      'JEE Main': 'JEE', 'JEE Advanced': 'JEE',
      'NEET': 'NEET', 'CET': 'MHT_CET',
      'Boards (PCM)': 'CBSE_12', 'Boards (PCB)': 'CBSE_12', 'Boards (Commerce)': 'CBSE_12',
      'CUET': 'CUET', 'GATE': 'GATE', 'CAT': 'CAT', 'UPSC': 'UPSC',
    };
    const examKey = examKeyMap[settings.examType] || 'JEE';

    db.seedSyllabusData();

    // Build context
    const progress = db.getSyllabusProgress(examKey);
    const weakChapters = db.getWeakChapters(examKey, 60);
    const recentEntries = db.listEntries({ limit: 10 });
    const totalChapters = progress.reduce((s, p) => s + p.total, 0);
    const weightedSum = progress.reduce((s, p) => s + p.weightedPercent * p.total, 0);
    const overallPercent = totalChapters > 0 ? Math.round(weightedSum / totalChapters) : 0;

    const syllabusStr = progress.map(p =>
      `${p.subject}: ${p.weightedPercent}% complete (${p.mastered} mastered, ${p.revised} in revision, ${p.total} total)`
    ).join('\n');

    const weakStr = weakChapters.length > 0
      ? weakChapters.slice(0, 10).map(w => `${w.subject} - ${w.chapter} (health: ${w.health})`).join('\n')
      : 'No weak chapters flagged.';

    const entriesStr = recentEntries.length > 0
      ? recentEntries.map(e => `[${e.date}] ${e.content} (${e.hoursStudied}h, ${e.subjects?.join(', ') || ''})`).join('\n')
      : 'No recent entries.';

    const settingsStr = `Target: ${settings.targetHoursPerWeek}h/week, Subjects: ${settings.subjects?.join(', ') || 'none'}`;

    const context: MentorContext = {
      examType: settings.examType || 'Unknown',
      recentEntries: entriesStr,
      syllabusProgress: `${overallPercent}% overall\n${syllabusStr}`,
      weakChapters: weakStr,
      settings: settingsStr,
    };

    // Validate and sanitize history
    const chatHistory: ChatMessage[] = Array.isArray(history)
      ? history.filter((m: any) => m && typeof m === 'object' && typeof m.content === 'string')
      : [];

    const ai = createAIServiceFromEnv();
    const providerInfo = { provider: ai.provider, model: ai.modelName };

    // Return SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send diagnostics first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'meta', provider: providerInfo.provider, model: providerInfo.model })}\n\n`));

          const startTime = Date.now();
          let chunkCount = 0;
          for await (const chunk of ai.generateMentorResponse(query, context, chatHistory)) {
            if (chunk) {
              chunkCount++;
              const data = JSON.stringify({ type: 'chunk', text: chunk });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          const latency = Date.now() - startTime;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', latency, chunkCount })}\n\n`));
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', text: errorMsg, provider: providerInfo.provider })}\n\n`));
        } finally {
          try { controller.close(); } catch { /* already closed */ }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to process mentor request';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
