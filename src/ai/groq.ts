import OpenAI from 'openai';
import type { AIService } from './interface';
import type { EntryAnalysis, WeeklyReviewData, DailyReviewData, MentorContext, ChatMessage } from '../types/ai';
import type { Entry } from '../types/entry';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * GroqAIService — fast, free AI via Groq LPU inference.
 *
 * Uses Llama 3 70B (or configured model) via OpenAI-compatible API.
 * No credit card needed, 30 req/min free tier.
 */
export class GroqAIService implements AIService {
  readonly provider = 'Groq';
  readonly modelName: string;
  private client: OpenAI;

  constructor(apiKey: string, modelName: string = 'llama-3.3-70b-versatile') {
    this.client = new OpenAI({
      apiKey,
      baseURL: GROQ_BASE_URL,
    });
    this.modelName = modelName;
  }

  async analyzeEntry(content: string): Promise<EntryAnalysis> {
    if (!content || content.trim().length < 5) {
      return {
        subjects: [],
        chapters: [],
        hoursStudied: null,
        summary: 'Entry too short to analyze.',
        tags: [],
      };
    }

    const prompt = `You are a study tracker AI. Analyze this student's study log entry and extract structured data.

Entry: "${content}"

Return ONLY valid JSON with these fields:
{
  "subjects": ["list of subjects detected, e.g. Physics, Chemistry, Mathematics"],
  "chapters": ["specific chapters or topics mentioned"],
  "hoursStudied": number|null (hours explicitly mentioned, or null if not specified),
  "summary": "one-sentence summary of what was studied",
  "tags": ["lowercase tags combining subjects and key topics"]
}

Rules:
- Subjects should be standard names: Physics, Chemistry, Mathematics, Biology, English, etc.
- If no clear subject is found, use ["General"]
- hoursStudied must be a number or null — never guess
- Keep summary under 100 characters
- Tags should be lowercase, max 8 tags`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content || '{}';
      const data = JSON.parse(text);

      return {
        subjects: Array.isArray(data.subjects) ? data.subjects : ['General'],
        chapters: Array.isArray(data.chapters) ? data.chapters : [],
        hoursStudied: typeof data.hoursStudied === 'number' ? data.hoursStudied : null,
        summary: typeof data.summary === 'string' ? data.summary : 'Study entry analyzed.',
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
    } catch (e) {
      console.warn('Groq analyzeEntry failed, falling back:', e instanceof Error ? e.message : e);
      return this.keywordFallback(content);
    }
  }

  async generateDailyReview(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied' | 'studyType' | 'focusRating'>[]
  ): Promise<DailyReviewData> {
    if (entries.length === 0) {
      return {
        content: '# Daily Review\n\nNo entries logged today. Start studying and log your progress!',
        insights: ['No study data recorded for today.'],
        totalHours: 0,
        subjects: [],
        strengths: [],
        weaknesses: [],
        recommendations: ['Log your first study session to get a daily review.'],
      };
    }

    const entriesJson = JSON.stringify(
      entries.map(e => ({
        date: e.date,
        content: e.content,
        subjects: e.subjects,
        chapters: e.chapters,
        hoursStudied: e.hoursStudied,
        studyType: e.studyType,
        focusRating: e.focusRating,
      })),
      null,
      2
    );

    const prompt = `You are a detailed AI study coach. Analyze today's study sessions and generate a thorough daily review.

ENTRIES:
${entriesJson}

RULES:
- Write 8-12 lines total — detailed but not excessive
- Use ## headings for sections, - for bullet points
- ## Overview: 2-3 sentence summary covering total hours, subjects studied, and overall pace
- ## Topics: bullet list of specific subjects and topics/chapters studied (reference actual chapter names from entries)
- ## Focus: one-line observation about focus level based on focusRating (1-5 scale)
- ## Tomorrow: 2-3 specific, actionable recommendations based on today's gaps
- Be specific — reference actual subjects and topics from the entries
- No motivational filler — just signal and action

Return ONLY valid JSON:
{
  "content": "## Overview\\n- ...\\n\\n## Topics\\n- ...\\n\\n## Focus\\n- ...\\n\\n## Tomorrow\\n- ...",
  "insights": ["insight 1", "insight 2"],
  "totalHours": 3.5,
  "subjects": ["Physics", "Chemistry"],
  "strengths": ["What went well today"],
  "weaknesses": ["What could improve"],
  "recommendations": ["Actionable tip 1", "Actionable tip 2"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content || '{}';
      const data = JSON.parse(text);

      return {
        content: typeof data.content === 'string' ? data.content : this.buildDailyFallbackContent(entries),
        insights: Array.isArray(data.insights) ? data.insights : [],
        totalHours: typeof data.totalHours === 'number' ? data.totalHours : entries.reduce((s, e) => s + (e.hoursStudied || 0), 0),
        subjects: Array.isArray(data.subjects) ? data.subjects : [...new Set(entries.flatMap(e => e.subjects))],
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : ['Keep up the consistency!'],
      };
    } catch (e) {
      console.warn('Groq generateDailyReview failed, falling back:', e instanceof Error ? e.message : e);
      return this.dailyReviewFallback(entries);
    }
  }

  async generateWeeklyReview(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied'>[]
  ): Promise<WeeklyReviewData> {
    if (entries.length === 0) {
      return {
        content: '# Weekly Review\n\nNo entries this week. Start logging to get AI-powered insights!',
        insights: ['No study data recorded for this week.'],
        topicCoverage: {},
        strengths: [],
        weaknesses: [],
        recommendations: ['Start logging your daily study sessions to get personalized weekly reviews.'],
      };
    }

    const entriesJson = JSON.stringify(
      entries.map(e => ({
        date: e.date,
        content: e.content,
        subjects: e.subjects,
        chapters: e.chapters,
        hoursStudied: e.hoursStudied,
      })),
      null,
      2
    );

    const prompt = `You are a detailed AI study coach. Analyze these daily logs and generate a comprehensive weekly review.

ENTRIES:
${entriesJson}

REQUIRED SECTIONS:
- ## Overview: 2-3 sentence summary of the week
- ## Topic Coverage: markdown table with columns Subject | Hours | Topics Studied
- ## Strengths: 3-4 bullet points — what went well
- ## Areas for Improvement: 2-4 bullet points
- ## Action Items: 3-5 actionable recommendations for next week

RULES:
- Write substantial content — aim for 15-25 lines total
- Reference actual subjects, chapters, and study patterns from the entries
- Each bullet should be a complete thought (2-3 sentences max per bullet)
- No motivational filler — just signal and specific guidance
- Specific and measurable action items

Return ONLY valid JSON:
{
  "content": "## Overview\\n...\\n\\n## Topic Coverage\\n| Subject | Hours | Topics |\\n...\\n\\n## Strengths\\n- ...\\n\\n## Areas for Improvement\\n- ...\\n\\n## Action Items\\n- ...",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "topicCoverage": {"Subject": hours},
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["action 1", "action 2", "action 3"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content || '{}';
      const data = JSON.parse(text);

      return {
        content: typeof data.content === 'string' ? data.content : this.buildFallbackContent(entries),
        insights: Array.isArray(data.insights) ? data.insights : ['Weekly review generated.'],
        topicCoverage: typeof data.topicCoverage === 'object' ? data.topicCoverage : {},
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : ['Keep studying consistently!'],
      };
    } catch (e) {
      console.warn('Groq generateWeeklyReview failed, falling back:', e instanceof Error ? e.message : e);
      return this.reviewFallback(entries);
    }
  }

  async *generateMentorResponse(query: string, context: MentorContext, history?: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    const systemPrompt = `You are an AI study mentor for a student preparing for ${context.examType || 'their exam'}.
You have access to their study data. Be concise, specific, and actionable — no generic motivational filler.
${context.userProfile ? `\nSTUDENT PROFILE:\n${context.userProfile}\n` : ''}
STUDY CONTEXT:
- Exam: ${context.examType}
- Syllabus progress: ${context.syllabusProgress}
- Weak chapters: ${context.weakChapters}
- Recent entries: ${context.recentEntries}
- Settings: ${context.settings}

YOUR ROLE:
1. Analyze what they've studied and identify gaps — reference their class, stream, and target goals
2. Ask targeted questions to check their understanding, especially in their weak subjects
3. Give specific advice based on their actual progress and target score/rank
4. When they answer, engage with their response — correct misunderstandings gently
5. Suggest what to study next based on syllabus gaps
6. Keep responses under 4 paragraphs — be direct

If the user asks about a specific topic, quiz them on it. If they describe what they studied, ask a follow-up that checks depth of understanding. If they sound stuck, give practical next-step advice.`;

    try {
      const messages: { role: string; content: string }[] = [
        { role: 'system', content: systemPrompt },
      ];
      if (history && history.length > 0) {
        for (const msg of history) {
          messages.push({ role: msg.role === 'mentor' ? 'assistant' : 'user', content: msg.content });
        }
      }
      messages.push({ role: 'user', content: query });

      const stream = await this.client.chat.completions.create({
        model: this.modelName,
        messages: messages as any,
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content || '';
        if (text) {
          yield text;
        }
      }
    } catch (e) {
      console.warn('Groq generateMentorResponse failed:', e instanceof Error ? e.message : e);
      if (e instanceof Error && e.stack) console.warn(e.stack.split('\n').slice(0, 3).join('\n'));
      yield "I'm having trouble connecting right now. Please try again in a moment.";
    }
  }

  // ── Keyword fallback (same as Gemini) ──

  private keywordFallback(content: string): EntryAnalysis {
    const lower = content.toLowerCase();
    const subjects: string[] = [];
    const chapters: string[] = [];

    const SUBJECT_MAP: Record<string, string[]> = {
      Physics: ['physics', 'mechanics', 'kinematics', 'dynamics', 'electro', 'optics', 'wave', 'thermo'],
      Chemistry: ['chemistry', 'organic', 'inorganic', 'physical chem', 'mole', 'equilibrium', 'redox'],
      Mathematics: ['math', 'algebra', 'calculus', 'geometry', 'trigonometry', 'coordinate', 'vector'],
      Biology: ['biology', 'bio', 'cell', 'genetics', 'evolution', 'ecology'],
      English: ['english', 'grammar', 'vocabulary', 'reading', 'comprehension'],
    };

    for (const [subject, keywords] of Object.entries(SUBJECT_MAP)) {
      if (keywords.some(k => lower.includes(k))) {
        subjects.push(subject);
      }
    }

    const hourPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:hr|hour|hrs|hours|h)\b/gi,
      /studied\s+for\s+(\d+(?:\.\d+)?)/gi,
    ];
    let hoursStudied: number | null = null;
    for (const pattern of hourPatterns) {
      const match = pattern.exec(content);
      if (match) {
        hoursStudied = parseFloat(match[1]);
        break;
      }
    }

    return {
      subjects: subjects.length > 0 ? subjects : ['General'],
      chapters,
      hoursStudied,
      summary: `Studied ${subjects.join(', ') || 'general topics'}.`,
      tags: [...subjects.map(s => s.toLowerCase())],
    };
  }

  private dailyReviewFallback(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied' | 'studyType' | 'focusRating'>[]
  ): DailyReviewData {
    const totalHours = entries.reduce((s, e) => s + (e.hoursStudied || 0), 0);
    const subjects = [...new Set(entries.flatMap(e => e.subjects))].filter(Boolean);
    return {
      content: this.buildDailyFallbackContent(entries),
      insights: [`Studied ${subjects.join(', ') || 'various topics'} for ${Math.round(totalHours * 10) / 10}h.`],
      totalHours,
      subjects,
      strengths: [],
      weaknesses: totalHours < 1 ? ['Very short study time'] : [],
      recommendations: [
        totalHours < 2 ? 'Try to study at least 2 hours per day.' : 'Maintain this pace.',
        'Review what you learned today before tomorrow\'s session.',
      ],
    };
  }

  private buildDailyFallbackContent(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied' | 'studyType' | 'focusRating'>[]
  ): string {
    const totalHours = entries.reduce((s, e) => s + (e.hoursStudied || 0), 0);
    const subjects = [...new Set(entries.flatMap(e => e.subjects))].filter(Boolean);
    let content = `## Overview\n- Studied ${subjects.join(', ') || 'various topics'} for ${Math.round(totalHours * 10) / 10}h`;
    content += '\n\n## Topics\n';
    for (const entry of entries) {
      for (const subject of entry.subjects) {
        const chapters = entry.chapters?.filter(Boolean);
        if (chapters && chapters.length > 0) {
          content += `- ${subject}: ${chapters.join(', ')}\n`;
        } else {
          content += `- ${subject}\n`;
        }
      }
    }
    content += `\n## Tomorrow\n- Review today's material briefly before starting new topics\n- Focus on weaker areas identified today`;
    return content;
  }

  private reviewFallback(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied'>[]
  ): WeeklyReviewData {
    const topicCoverage: Record<string, number> = {};
    let totalHours = 0;
    const studyDays = new Set<string>();

    for (const entry of entries) {
      for (const subject of entry.subjects) {
        topicCoverage[subject] = (topicCoverage[subject] || 0) + (entry.hoursStudied || 1);
      }
      totalHours += entry.hoursStudied || 1;
      studyDays.add(entry.date);
    }

    const sorted = Object.entries(topicCoverage).sort(([, a], [, b]) => b - a);
    const strengths = sorted.length > 0
      ? [`${sorted[0][0]}: ${Math.round(sorted[0][1])} hours — most studied subject.`]
      : [];
    const weaknesses = entries.length < 7
      ? [`Only studied ${entries.length} out of 7 days. Aim for daily consistency.`]
      : [];

    const content = `## Overview\n- ${studyDays.size} days, ${Math.round(totalHours)}h total\n\n## Strengths\n${strengths.map(s => `- ${s}`).join('\n')}\n\n## Action Items\n- ${weaknesses.length > 0 ? 'Study at least 6 days/week' : 'Keep the momentum'}\n- Review weaker topics first\n- Take breaks every 90min`;

    return {
      content,
      insights: [`Studied ${studyDays.size} days, ~${Math.round(totalHours)} hours total.`],
      topicCoverage,
      strengths,
      weaknesses,
      recommendations: [
        weaknesses.length > 0 ? 'Aim for daily consistency.' : 'Maintain your routine.',
        'Review your weakest topics first each session.',
        'Take breaks every 90 minutes to maintain focus.',
      ],
    };
  }

  private buildFallbackContent(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied'>[]
  ): string {
    const totalHours = entries.reduce((sum, e) => sum + (e.hoursStudied || 0), 0);
    return `# Weekly Review\n\nStudied ${entries.length} days, ${Math.round(totalHours)} hours total.`;
  }
}
