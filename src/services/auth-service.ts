import { getAdminAuth } from '../db/firebase-admin';
import { getDb } from '../db';
import type { AuthResult, User } from '../types/auth';

/**
 * Firebase Auth integration — no client SDK.
 *
 * The SSR app authenticates against Firebase Auth's public Identity Toolkit
 * REST API using the Web API key (public by design), then mints an HttpOnly
 * session cookie with the Admin SDK. Guests use Anonymous Auth; the guest →
 * email signup upgrade preserves the uid so guest data carries over.
 *
 * Env: FIREBASE_WEB_API_KEY (REST calls) plus the Admin SDK env in
 * firebase-admin.ts. Set FIREBASE_AUTH_EMULATOR_HOST to route every call at
 * the Auth emulator for local development.
 */

export const SESSION_COOKIE_MAX_AGE_SECONDS = 14 * 24 * 60 * 60; // 14 days

/** Error carrying an HTTP status, mapped from Firebase Auth error codes. */
export class AuthError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

// ── Identity Toolkit REST helpers ──

const AUTH_REST_BASE = () => {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  return host
    ? `http://${host}/identitytoolkit.googleapis.com/v1`
    : 'https://identitytoolkit.googleapis.com/v1';
};

const SECURE_TOKEN_BASE = () => {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  return host
    ? `http://${host}/securetoken.googleapis.com/v1`
    : 'https://securetoken.googleapis.com/v1';
};

function webApiKey(): string {
  const key = process.env.FIREBASE_WEB_API_KEY;
  if (!key) throw new AuthError(500, 'Firebase Auth is not configured (missing FIREBASE_WEB_API_KEY).');
  return key;
}

interface AuthRestResponse {
  idToken?: string;
  refreshToken?: string;
  localId?: string;
  email?: string;
  error?: { message?: string };
}

async function identitytoolkit(path: string, body: Record<string, unknown>): Promise<AuthRestResponse> {
  const res = await fetch(`${AUTH_REST_BASE()}/${path}?key=${webApiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: AuthRestResponse = await res.json().catch(() => ({}));
  if (!res.ok) throw mapAuthError(data.error?.message, res.status);
  return data;
}

function mapAuthError(code: string | undefined, fallbackStatus: number): AuthError {
  switch (code) {
    case 'EMAIL_EXISTS':
      return new AuthError(409, 'An account with this email already exists.');
    case 'WEAK_PASSWORD':
      return new AuthError(400, 'Password should be at least 6 characters.');
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
      return new AuthError(401, 'Invalid email or password.');
    case 'INVALID_ID_TOKEN':
      return new AuthError(401, 'This session is no longer valid. Please sign in again.');
    case 'USER_DISABLED':
      return new AuthError(403, 'This account has been disabled.');
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return new AuthError(429, 'Too many attempts. Try again later.');
    default:
      return new AuthError(
        fallbackStatus,
        code
          ? `Authentication failed: ${code.replace(/_/g, ' ').toLowerCase()}.`
          : 'Authentication failed. Please try again.'
      );
  }
}

/** Exchange a Firebase refresh token for a fresh idToken (guest-upgrade path). */
async function exchangeRefreshToken(refreshToken: string): Promise<{ idToken: string; refreshToken: string }> {
  const res = await fetch(`${SECURE_TOKEN_BASE()}/token?key=${webApiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id_token) throw mapAuthError(data.error?.message, 401);
  return { idToken: data.id_token, refreshToken: data.refresh_token || refreshToken };
}

async function mintSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_MAX_AGE_SECONDS * 1000 });
}

// ── Cookie helpers ──

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

export function getTokenFromCookie(request: Request): string | null {
  return readCookie(request, 'session_token');
}

/** Guest-only cookie holding the anonymous Firebase refresh token (guest upgrade). */
export function getRefreshTokenFromCookie(request: Request): string | null {
  return readCookie(request, 'sl_refresh_token');
}

// ── Auth flows ──

export async function createGuestUser(): Promise<AuthResult> {
  const res = await identitytoolkit('accounts:signUp', { returnSecureToken: true });
  const uid = res.localId;
  if (!uid || !res.idToken || !res.refreshToken) {
    throw new AuthError(500, 'Failed to create a guest session. Please try again.');
  }

  const user = await getDb().createUser({
    id: uid,
    name: 'Guest',
    email: `guest-${uid}@studylog.local`,
    userType: 'guest',
  });
  const sessionCookie = await mintSessionCookie(res.idToken);
  return { user, sessionCookie, refreshToken: res.refreshToken };
}

export interface GuestUpgradeContext {
  /** Firebase refresh token of the anonymous session being upgraded. */
  guestRefreshToken: string;
}

export async function signup(
  name: string,
  email: string,
  password: string,
  guestUpgrade?: GuestUpgradeContext
): Promise<AuthResult> {
  let uid: string | undefined;
  let idToken: string | undefined;
  let refreshToken: string | undefined;

  if (guestUpgrade) {
    // Link the anonymous uid to the new credentials — Firebase preserves the
    // localId, so the guest profile and all its data carry over.
    const fresh = await exchangeRefreshToken(guestUpgrade.guestRefreshToken);
    const res = await identitytoolkit('accounts:signUp', {
      idToken: fresh.idToken,
      email,
      password,
      returnSecureToken: true,
    });
    uid = res.localId;
    idToken = res.idToken;
    refreshToken = res.refreshToken || fresh.refreshToken;
  } else {
    const res = await identitytoolkit('accounts:signUp', { email, password, returnSecureToken: true });
    uid = res.localId;
    idToken = res.idToken;
    refreshToken = res.refreshToken;
  }
  if (!uid || !idToken) throw new AuthError(500, 'Signup failed. Please try again.');

  const existing = await getDb().getUserById(uid);
  const user = existing
    ? await getDb().updateUser(uid, { name: name.trim(), email, userType: 'authenticated' })
    : await getDb().createUser({ id: uid, name: name.trim(), email, userType: 'authenticated' });
  if (!user) throw new AuthError(500, 'Failed to save your profile. Please try again.');

  const sessionCookie = await mintSessionCookie(idToken);
  return { user, sessionCookie, refreshToken };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await identitytoolkit('accounts:signInWithPassword', { email, password, returnSecureToken: true });
  const uid = res.localId;
  if (!uid || !res.idToken) throw new AuthError(500, 'Login failed. Please try again.');

  let user = await getDb().getUserById(uid);
  if (!user) {
    // Firebase account without a profile row (console-created, or a guest whose
    // profile was deleted). Recreate it so the app keeps working.
    user = await getDb().createUser({
      id: uid,
      name: res.email?.split('@')[0] || 'User',
      email: res.email || email,
      userType: 'authenticated',
    });
  }
  const sessionCookie = await mintSessionCookie(res.idToken);
  return { user, sessionCookie, refreshToken: res.refreshToken };
}

export async function getSessionUser(token: string | null | undefined): Promise<User | null> {
  if (!token) return null;
  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(token, false);
    uid = decoded.uid;
  } catch {
    // Invalid/expired cookie — or Firebase not configured (sqlite dev mode),
    // where there are no sessions to verify anyway.
    return null;
  }
  return getDb().getUserById(uid);
}

export async function logout(_token: string | null): Promise<void> {
  // Session cookies are cleared client-side. We deliberately do NOT revoke
  // Firebase refresh tokens: verifySessionCookie(cookie, false) is a local
  // check and a stolen cookie already lives until expiry — revoking here
  // would also sign the user out of every other device.
  return;
}
