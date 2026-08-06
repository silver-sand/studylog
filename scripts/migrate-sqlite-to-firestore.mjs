/**
 * Migrate a user's data from the local sql.js/SQLite DB to Firestore.
 *
 * Firebase Auth uses new uids, so run this AFTER re-registering the account
 * in Firebase. Pass the fresh Firebase uid and your data lands under it.
 *
 * Usage (run with tsx so the adapter's extensionless .ts imports resolve):
 *   npx tsx scripts/migrate-sqlite-to-firestore.mjs <firebaseUid> [--old-uid <sqliteUid>]
 *   npx tsx scripts/migrate-sqlite-to-firestore.mjs --list
 *
 *   <firebaseUid>   uid of the freshly created Firebase account (target).
 *   --old-uid       sqlite user_id to read from (source). Defaults to
 *                   <firebaseUid> — use it when the old sqlite uid differs.
 *   --list          print every user_id found in the sqlite DB and exit.
 *
 * Reads db/studylog.db via SQLiteAdapter (exportUserData per uid), then
 * writes to Firestore via FirestoreAdapter.importUserData under the target
 * uid, preserving document ids. Idempotent — importUserData replaces any
 * existing Firestore data for the target uid.
 *
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * (or run the emulators: FIRESTORE_EMULATOR_HOST with FIREBASE_PROJECT_ID
 * set to a demo-* project).
 */
// Load local .env (gitignored) so FIREBASE_* credentials don't need to be
// pasted into the shell. Run via tsx: npx tsx scripts/migrate-sqlite-to-firestore.mjs
import 'dotenv/config';
import { SQLiteAdapter } from '../src/db/sqlite-adapter.ts';
import { FirestoreAdapter } from '../src/db/firestore-adapter.ts';
import { runWithUser } from '../src/db/user-context.ts';

const DB_PATH = process.env.STUDYLOG_DB_PATH || './db/studylog.db';

const UID_SQL = `
  SELECT DISTINCT d.user_id AS user_id, u.email AS email
  FROM (
    SELECT user_id FROM entries
    UNION SELECT user_id FROM weekly_reviews
    UNION SELECT user_id FROM daily_reviews
    UNION SELECT user_id FROM syllabus
    UNION SELECT user_id FROM mock_tests
    UNION SELECT user_id FROM todos
    UNION SELECT user_id FROM settings
  ) d
  LEFT JOIN users u ON u.id = d.user_id
`;

function parseArgs(argv) {
  const args = { targetUid: null, oldUid: null, list: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--list') args.list = true;
    else if (argv[i] === '--old-uid') args.oldUid = argv[++i];
    else if (!args.targetUid) args.targetUid = argv[i];
  }
  return args;
}

async function main() {
  const { targetUid, oldUid, list } = parseArgs(process.argv.slice(2));

  const source = new SQLiteAdapter(DB_PATH);
  await source.ensureReady();

  if (list) {
    const rows = source.rawQuery(UID_SQL).filter(r => r.user_id);
    console.log('user_id values found in sqlite DB (find your email):');
    for (const r of rows) console.log(`  ${r.user_id}  ${r.email ? `(${r.email})` : '(no email on record)'}`);
    if (rows.length === 0) console.log('  (none — DB is empty)');
    process.exit(0);
  }

  if (!targetUid) {
    console.error('Usage: npx tsx scripts/migrate-sqlite-to-firestore.mjs <firebaseUid> [--old-uid <sqliteUid>]');
    console.error('       npx tsx scripts/migrate-sqlite-to-firestore.mjs --list');
    process.exit(1);
  }

  const sourceUid = oldUid || targetUid;
  const known = source.rawQuery(UID_SQL).filter(r => r.user_id);
  if (!known.some(r => r.user_id === sourceUid)) {
    console.error(`No sqlite data found for user_id "${sourceUid}". Known uids:`);
    for (const r of known) console.error(`  ${r.user_id}  ${r.email ? `(${r.email})` : ''}`);
    console.error(`(pass --old-uid <sqliteUid> if the source uid differs from the Firebase uid, or run --list)`);
    process.exit(1);
  }

  console.log(`Exporting data for sqlite user "${sourceUid}" ...`);
  const payload = await runWithUser(sourceUid, () => source.exportUserData());
  const total = ['entries', 'weeklyReviews', 'dailyReviews', 'syllabus', 'mockTests', 'todos', 'settings']
    .reduce((s, k) => s + (k === 'settings' ? (payload.data.settings ? 1 : 0) : payload.data[k].length), 0);
  if (total === 0) {
    console.error('Export produced zero rows — aborting (nothing to migrate).');
    process.exit(1);
  }

  console.log(`Importing into Firestore under uid "${targetUid}" (replace: true) ...`);
  const target = new FirestoreAdapter();
  const result = await runWithUser(targetUid, () => target.importUserData(payload, { replace: true }));

  console.log('Migration complete:');
  for (const [k, v] of Object.entries(result.counts)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log('\nSign in with the re-registered account — data should appear immediately.');
}

main().catch(e => {
  console.error('Migration failed:', e.message || e);
  process.exit(1);
});
