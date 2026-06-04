/**
 * Delete the weekly review for a given week start.
 * Usage: node scripts/delete-weekly-review.mjs [weekStart]
 * Default: 2026-06-01 (this week)
 */
import { getDb } from '../src/db/index.ts';
import { SQLiteAdapter } from '../src/db/sqlite-adapter.ts';

const weekStart = process.argv[2] || '2026-06-01';

// The adapter doesn't expose a delete method, so we access sql.js directly
const db = getDb();

// Cast to SQLiteAdapter to access internal db
const adapter = db;
const sqlDb = adapter['db'];

if (sqlDb) {
  sqlDb.run('DELETE FROM weekly_reviews WHERE week_start = ?', [weekStart]);
  // Trigger save
  adapter['save']();
  console.log(`Deleted weekly review for ${weekStart}`);
} else {
  console.error('Could not access database');
}
