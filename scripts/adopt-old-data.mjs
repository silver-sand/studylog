/**
 * Rekey a uid's Firestore docs from an old uid to a new uid.
 *
 * Fallback for data that landed under the wrong uid: migrated before the
 * account existed, or orphaned guest data. Copies every data doc from
 * oldUid to newUid (same doc ids), replacing any existing newUid data.
 *
 * Usage (run with tsx so the adapter's extensionless .ts imports resolve):
 *   npx tsx scripts/adopt-old-data.mjs --old-uid <oldUid> --new-uid <newUid>
 *
 * Idempotent: newUid's data is replaced, so re-running with the same args
 * converges. Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 * FIREBASE_PRIVATE_KEY (or emulators via FIRESTORE_EMULATOR_HOST).
 *
 * To bring data from the LOCAL sqlite DB instead, use
 * scripts/migrate-sqlite-to-firestore.mjs with --old-uid <sqliteUid>.
 */
import 'dotenv/config';
import { FirestoreAdapter } from '../src/db/firestore-adapter.ts';
import { runWithUser } from '../src/db/user-context.ts';

function parseArgs(argv) {
  const args = { oldUid: null, newUid: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--old-uid') args.oldUid = argv[++i];
    else if (argv[i] === '--new-uid') args.newUid = argv[++i];
  }
  return args;
}

async function main() {
  const { oldUid, newUid } = parseArgs(process.argv.slice(2));

  if (!oldUid || !newUid) {
    console.error('Usage: npx tsx scripts/adopt-old-data.mjs --old-uid <oldUid> --new-uid <newUid>');
    process.exit(1);
  }
  if (oldUid === newUid) {
    console.error('--old-uid and --new-uid are the same; nothing to do.');
    process.exit(1);
  }

  const db = new FirestoreAdapter();

  console.log(`Exporting Firestore data for "${oldUid}" ...`);
  const payload = await runWithUser(oldUid, () => db.exportUserData());
  const total = ['entries', 'weeklyReviews', 'dailyReviews', 'syllabus', 'mockTests', 'todos', 'settings']
    .reduce((s, k) => s + (k === 'settings' ? (payload.data.settings ? 1 : 0) : payload.data[k].length), 0);
  if (total === 0) {
    console.error(`No data found under "${oldUid}" — nothing to adopt.`);
    process.exit(1);
  }

  console.log(`Importing under "${newUid}" (replace: true) ...`);
  const result = await runWithUser(newUid, () => db.importUserData(payload, { replace: true }));

  console.log('Adoption complete:');
  for (const [k, v] of Object.entries(result.counts)) {
    console.log(`  ${k}: ${v}`);
  }
}

main().catch(e => {
  console.error('Adoption failed:', e.message || e);
  process.exit(1);
});
