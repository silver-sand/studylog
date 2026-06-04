import { SQLiteAdapter } from './sqlite-adapter';
import type { Database } from './interface';

let db: Database;

async function initDb(): Promise<void> {
  const dbPath = process.env.STUDYLOG_DB_PATH || './db/studylog.db';
  const adapter = new SQLiteAdapter(dbPath);
  await adapter.ensureReady();
  db = adapter;
}

// Eager init via top-level await — module won't resolve until DB is ready.
// This guarantees getDb() is always safe to call synchronously after import.
await initDb();

export function getDb(): Database {
  return db;
}

// For testing: reset the DB singleton
export function resetDb(): void {
  // With eager init, reset is a no-op for runtime.
  // Tests can re-import the module to get a fresh DB.
}
