/**
 * Delete the weekly review for a given week start.
 * Usage: npx tsx scripts/delete-weekly-review.mjs [weekStart]
 * Default: 2026-06-01 (this week)
 */
import { getDb } from '../src/db/index.ts';

const weekStart = process.argv[2] || '2026-06-01';

const db = getDb();
const deleted = await db.deleteReviewByWeek(weekStart);
console.log(deleted
  ? `Deleted weekly review for ${weekStart}`
  : `No weekly review found for ${weekStart}`);
