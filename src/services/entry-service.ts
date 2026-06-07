import { getDb } from '../db';
import { createAIServiceFromEnv } from '../ai';
import type { AIService } from '../ai/interface';
import type { Entry, CreateEntryData, EntryFilters } from '../types/entry';

let aiInstance: AIService | null = null;
function getAI(): AIService {
  if (!aiInstance) aiInstance = createAIServiceFromEnv();
  return aiInstance;
}

export async function createEntry(data: CreateEntryData): Promise<Entry> {
  const db = getDb();

  const entry = db.createEntry(data);

  try {
    const analysis = await getAI().analyzeEntry(data.content);
    return db.updateEntry(entry.id, {
      subjects: analysis.subjects,
      chapters: analysis.chapters,
      hoursStudied: data.hoursStudied ?? analysis.hoursStudied ?? 0,
      tags: analysis.tags,
      aiRaw: JSON.stringify(analysis),
      aiStatus: 'done',
    })!;
  } catch (e) {
    return db.updateEntry(entry.id, {
      aiStatus: 'error',
      aiRaw: e instanceof Error ? e.message : String(e),
    })!;
  }
}

export async function reanalyzeEntry(id: string): Promise<Entry | null> {
  const db = getDb();
  const entry = db.getEntry(id);
  if (!entry) return null;

  const pending = db.updateEntry(id, { aiStatus: 'processing' });
  if (!pending) return null;

  try {
    const analysis = await getAI().analyzeEntry(entry.content);
    return db.updateEntry(id, {
      subjects: analysis.subjects,
      chapters: analysis.chapters,
      // Preserve user-set hoursStudied — AI extraction is a fallback hint
      hoursStudied: entry.hoursStudied > 0 ? entry.hoursStudied : (analysis.hoursStudied ?? 0),
      tags: analysis.tags,
      aiRaw: JSON.stringify(analysis),
      aiStatus: 'done',
    })!;
  } catch (e) {
    return db.updateEntry(id, {
      aiStatus: 'error',
      aiRaw: e instanceof Error ? e.message : String(e),
    })!;
  }
}

export function getEntry(id: string): Entry | null {
  return getDb().getEntry(id);
}

export function getEntryByDate(date: string): Entry | null {
  return getDb().getEntryByDate(date);
}

export function listEntries(filters?: EntryFilters): Entry[] {
  return getDb().listEntries(filters);
}

export function updateEntry(id: string, data: Partial<Entry>): Entry | null {
  return getDb().updateEntry(id, data);
}

export function deleteEntry(id: string): boolean {
  return getDb().deleteEntry(id);
}
