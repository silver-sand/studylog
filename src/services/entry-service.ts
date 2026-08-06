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

  const entry = await db.createEntry(data);

  try {
    const analysis = await getAI().analyzeEntry(data.content);
    const updated = await db.updateEntry(entry.id, {
      // User's explicit chip selection is authoritative; AI extraction is a fallback.
      subjects: data.subjects?.length ? data.subjects : analysis.subjects,
      chapters: analysis.chapters,
      hoursStudied: data.hoursStudied ?? analysis.hoursStudied ?? 0,
      tags: analysis.tags,
      aiRaw: JSON.stringify(analysis),
      aiStatus: 'done',
    });
    return updated!;
  } catch (e) {
    const updated = await db.updateEntry(entry.id, {
      aiStatus: 'error',
      aiRaw: e instanceof Error ? e.message : String(e),
    });
    return updated!;
  }
}

export async function reanalyzeEntry(id: string): Promise<Entry | null> {
  const db = getDb();
  const entry = await db.getEntry(id);
  if (!entry) return null;

  const pending = await db.updateEntry(id, { aiStatus: 'processing' });
  if (!pending) return null;

  try {
    const analysis = await getAI().analyzeEntry(entry.content);
    return await db.updateEntry(id, {
      subjects: analysis.subjects,
      chapters: analysis.chapters,
      // Preserve user-set hoursStudied — AI extraction is a fallback hint
      hoursStudied: entry.hoursStudied > 0 ? entry.hoursStudied : (analysis.hoursStudied ?? 0),
      tags: analysis.tags,
      aiRaw: JSON.stringify(analysis),
      aiStatus: 'done',
    });
  } catch (e) {
    return db.updateEntry(id, {
      aiStatus: 'error',
      aiRaw: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function getEntry(id: string): Promise<Entry | null> {
  return getDb().getEntry(id);
}

export async function getEntryByDate(date: string): Promise<Entry | null> {
  return getDb().getEntryByDate(date);
}

export async function listEntries(filters?: EntryFilters): Promise<Entry[]> {
  return getDb().listEntries(filters);
}

export async function updateEntry(id: string, data: Partial<Entry>): Promise<Entry | null> {
  return getDb().updateEntry(id, data);
}

export async function deleteEntry(id: string): Promise<boolean> {
  return getDb().deleteEntry(id);
}
