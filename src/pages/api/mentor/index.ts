import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { createAIServiceFromEnv } from '../../../ai';
import type { MentorContext, ChatMessage } from '../../../types/ai';
import { scopeDbToUser } from '../../../services/user-scope';
import { getSyllabusKeyForExam } from '../../../utils/exam-map';

export const POST: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const { query, history } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'query is required' }), { status: 400 });
    }

    const db = getDb();
    const settings = db.getSettings();
    const currentUser = db.getUserById(db.getCurrentUser());

    // Use first selected exam for mentor context
    const selectedExams = settings.selectedExams?.length ? settings.selectedExams : ['JEE'];
    const primaryExam = selectedExams[0];
    const examKey = getSyllabusKeyForExam(primaryExam);

    db.seedSyllabusData();

    // Build profile context string
    const profileParts: string[] = [];
    if (currentUser?.classLevel) {
      profileParts.push(`Class ${currentUser.classLevel.replace('class_', '')}`);
    }
    if (currentUser?.stream) {
      profileParts.push(currentUser.stream.charAt(0).toUpperCase() + currentUser.stream.slice(1));
    }
    if (currentUser?.coaching) {
      const labels: Record<string, string> = { coaching_only: 'Attends coaching only', self_study: 'Self-studying', both: 'Coaching + self-study' };
      profileParts.push(labels[currentUser.coaching] || currentUser.coaching);
    }
    if (currentUser?.weakSubjects?.length) {
      profileParts.push(`Weak in: ${currentUser.weakSubjects.join(', ')}`);
    }
    if (currentUser?.targetRank) {
      profileParts.push(`Goal: ${currentUser.targetRank}`);
    }
    if (currentUser?.goal) {
      profileParts.push(`Goal: ${currentUser.goal}`);
    }
    const userProfile = profileParts.length > 0
      ? `Student profile: ${profileParts.join(' · ')}.`
      : 'Student profile: Not yet configured.';

    // Build syllabus/entry context
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
      examType: primaryExam,
      recentEntries: entriesStr,
      syllabusProgress: `${overallPercent}% overall\n${syllabusStr}`,
      weakChapters: weakStr,
      settings: settingsStr,
      userProfile,
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
