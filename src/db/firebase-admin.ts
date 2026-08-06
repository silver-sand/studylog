import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Lazy Firebase Admin SDK singleton. Initialized on first use so the sqlite
 * dev path (DB_PROVIDER unset) never requires Firebase config to boot.
 *
 * Env (see .env.example):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * Emulator mode: set FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST and
 * FIREBASE_PROJECT_ID=demo-* — the Admin SDK auto-connects to the emulators.
 */
let app: App | null = null;

export function getAdminApp(): App {
  if (!app) {
    const existing = getApps()[0];
    if (existing) {
      app = existing;
      return app;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const isEmulator = !!(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);

    if (isEmulator && projectId) {
      app = initializeApp({ projectId });
    } else if (projectId && clientEmail && privateKey) {
      app = initializeApp({
        projectId,
        credential: cert({
          projectId,
          clientEmail,
          // Env vars can't hold real newlines — allow escaped \n in .env
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      throw new Error(
        'Firebase Admin SDK is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, ' +
          'and FIREBASE_PRIVATE_KEY (or run the emulators with FIRESTORE_EMULATOR_HOST/FIREBASE_AUTH_EMULATOR_HOST).'
      );
    }
  }
  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

let firestoreConfigured = false;

export function getAdminFirestore(): Firestore {
  const fs = getFirestore(getAdminApp());
  if (!firestoreConfigured) {
    // Firestore rejects undefined field values by default; our optional profile
    // fields (stream, goal, classLevel, ...) are undefined when unset, so omit
    // them rather than throw (matches sqlite storing NULL).
    fs.settings({ ignoreUndefinedProperties: true });
    firestoreConfigured = true;
  }
  return fs;
}
