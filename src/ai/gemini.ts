import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIService } from './interface';
import type { EntryAnalysis, WeeklyReviewData, DailyReviewData } from '../types/ai';
import type { Entry } from '../types/entry';

/**
 * GeminiAIService — real AI analysis using Google Gemini free tier.
 *
 * Uses gemini-2.0-flash (60 req/min free, $0 cost).
 */
export class GeminiAIService implements AIService {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
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
  "tags": ["lowecase tags combining subjects and key topics"]
}

Rules:
- Subjects should be standard names: Physics, Chemistry, Mathematics, Biology, English, etc.
- If no clear subject is found, use ["General"]
- hoursStudied must be a number or null — never guess
- Keep summary under 100 characters
- Tags should be lowercase, max 8 tags`;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Parse JSON from response (handle markdown code blocks)
      const jsonStr = this.extractJson(text);
      const data = JSON.parse(jsonStr);

      return {
        subjects: Array.isArray(data.subjects) ? data.subjects : ['General'],
        chapters: Array.isArray(data.chapters) ? data.chapters : [],
        hoursStudied: typeof data.hoursStudied === 'number' ? data.hoursStudied : null,
        summary: typeof data.summary === 'string' ? data.summary : 'Study entry analyzed.',
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
    } catch (e) {
      console.warn('Gemini analyzeEntry failed, falling back:', e);
      // Fallback: basic keyword extraction
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
- ## Focus: one-line observation about focus level based on focusRating (1-5 scale), e.g. "Focus was moderate (3/5) — consider shorter sessions with breaks"
- ## Tomorrow: 2-3 specific, actionable recommendations based on today's gaps
- Be specific — reference actual subjects and topics from the entries
- No motivational filler — just signal and action

Return ONLY valid JSON:
{
  "content": "## Overview\\n- Content with proper markdown...\\n\\n## Topics\\n- Subject: Topic\\n\\n## Focus\\n- Focus observation...\\n\\n## Tomorrow\\n- Specific recommendation...",
  "insights": ["insight based on focus rating", "subject-specific insight"],
  "totalHours": 3.5,
  "subjects": ["Physics", "Chemistry"],
  "strengths": ["What went well today"],
  "weaknesses": ["What could improve"],
  "recommendations": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"]
}`;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = this.extractJson(text);
      const data = JSON.parse(jsonStr);

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
      console.warn('Gemini generateDailyReview failed, falling back:', e);
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
- ## Overview: 2-3 sentence summary of the week — total days studied, total hours, subjects covered, overall consistency
- ## Topic Coverage: markdown table with columns Subject | Hours | Topics Studied showing what was covered (use the actual chapters/topics from entries)
- ## Strengths: 3-4 bullet points — what went well this week (be specific, reference subjects/days)
- ## Areas for Improvement: 2-4 bullet points — specific gaps or patterns to address
- ## Action Items: 3-5 actionable recommendations for next week — specific, measurable, tied to actual gaps

RULES:
- Write substantial content — aim for 15-25 lines total
- Reference actual subjects, chapters, and study patterns from the entries
- Each bullet should be a complete thought (2-3 sentences max per bullet)
- No arbitrary word limits — write what's needed
- No motivational filler — just signal and specific guidance
- Topic coverage table should list actual chapters studied per subject

Return ONLY valid JSON:
{
  "content": "## Overview\\n...\\n\\n## Topic Coverage\\n| Subject | Hours | Topics |\\n...\\n\\n## Strengths\\n- ...\\n\\n## Areas for Improvement\\n- ...\\n\\n## Action Items\\n- ...",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "topicCoverage": {"Subject": hours},
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["action 1", "action 2", "action 3", "action 4"]
}`;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = this.extractJson(text);
      const data = JSON.parse(jsonStr);

      return {
        content: typeof data.content === 'string' ? data.content : this.buildFallbackContent(entries),
        insights: Array.isArray(data.insights) ? data.insights : ['Weekly review generated.'],
        topicCoverage: typeof data.topicCoverage === 'object' ? data.topicCoverage : {},
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : ['Keep studying consistently!'],
      };
    } catch (e) {
      console.warn('Gemini generateWeeklyReview failed, falling back:', e);
      return this.reviewFallback(entries);
    }
  }

  /**
   * Extract JSON from a response that may contain markdown code blocks or extra text.
   */
  private extractJson(text: string): string {
    // Try to extract from code block first
    const blockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (blockMatch) return blockMatch[1].trim();

    // Otherwise try to find JSON object directly
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0].trim();

    return text.trim();
  }

  /**
   * Keyword-based fallback for entry analysis if Gemini fails.
   */
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

    // Extract hours
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

  /**
   * Fallback daily review generation if Gemini fails.
   */
  private dailyReviewFallback(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied' | 'studyType' | 'focusRating'>[]
  ): DailyReviewData {
    const totalHours = entries.reduce((s, e) => s + (e.hoursStudied || 0), 0);
    const subjects = [...new Set(entries.flatMap(e => e.subjects))].filter(Boolean);
    const avgFocus = entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + (e.focusRating || 0), 0) / entries.length)
      : 0;

    const content = this.buildDailyFallbackContent(entries);

    return {
      content,
      insights: [
        `Studied ${subjects.join(', ') || 'various topics'} for ${Math.round(totalHours * 10) / 10}h.`,
        ...(avgFocus > 0 ? [`Average focus rating: ${avgFocus}/5.`] : []),
      ],
      totalHours,
      subjects,
      strengths: avgFocus >= 4 ? ['High focus throughout the session'] : [],
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
    const studyTypes = [...new Set(entries.map(e => e.studyType).filter(Boolean))];

    let content = `## Overview\n- Studied ${subjects.join(', ') || 'various topics'} for ${Math.round(totalHours * 10) / 10}h`;
    if (studyTypes.length > 0) {
      content += ` (${studyTypes.join(', ').replace(/_/g, ' ')})`;
    }

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

  /**
   * Fallback weekly review generation if Gemini fails.
   */
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
