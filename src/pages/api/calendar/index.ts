import type { APIRoute } from 'astro';
import { getDb } from '../../../db';

export const GET: APIRoute = async ({ url }) => {
  const year = parseInt(url.searchParams.get('year') || '0');
  const month = parseInt(url.searchParams.get('month') || '0');
  if (!year || !month || month < 1 || month > 12) {
    return new Response(JSON.stringify({ error: 'Invalid year/month' }), { status: 400 });
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  const prefix = `${year}-${pad(month)}`;
  const db = getDb();
  const entries = await db.listEntries({ from: `${prefix}-01`, to: `${prefix}-31` });
  const dates: string[] = [];
  const set = new Set<string>();
  for (const entry of entries) {
    if (!set.has(entry.date)) {
      set.add(entry.date);
      dates.push(entry.date);
    }
  }
  return new Response(JSON.stringify({ dates, year, month }));
};
