import type { Database } from './interface';

/**
 * Adapter selection: DB_PROVIDER=firestore uses the Firestore adapter
 * (production, Vercel); unset or 'sqlite' uses the in-memory sql.js adapter
 * (local dev + migration source). Both adapters are imported dynamically so
 * the Vercel function bundle never loads sql.js.
 */
let db: Database | null = null;

async function initDb(): Promise<void> {
  const provider = process.env.DB_PROVIDER || 'sqlite';

  if (provider === 'firestore') {
    const { FirestoreAdapter } = await import('./firestore-adapter');
    db = new FirestoreAdapter();
  } else {
    const { SQLiteAdapter } = await import('./sqlite-adapter');
    const dbPath = process.env.STUDYLOG_DB_PATH || './db/studylog.db';
    const adapter = new SQLiteAdapter(dbPath);
    await adapter.ensureReady();
    db = adapter;
  }
}

// Eager init via top-level await — module won't resolve until the DB is ready.
// This guarantees getDb() is always safe to call after import.
await initDb();

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

// For testing: reset the DB singleton
export function resetDb(): void {
  // With eager init, reset is a no-op for runtime.
  // Tests can re-import the module to get a fresh DB.
}
