import { getDb } from '../db';
import type { AuthResult, User } from '../types/auth';

// ── Node 18+ safe crypto ──
// Use global crypto if available (browsers, Node 19+), otherwise fall back to Node's crypto module.
function getCrypto(): typeof globalThis.crypto & { randomUUID?: () => string } {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as any;
  }
  // Node 18: require('crypto').webcrypto is the Web Crypto API
  try {
    const nodeCrypto = require('crypto');
    return (nodeCrypto as any).webcrypto || nodeCrypto;
  } catch {
    throw new Error('No crypto API available');
  }
}

function generateUUID(): string {
  const c = getCrypto();
  if (typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  // Polyfill for older runtimes
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  // Set version 4 UUID bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

// ── Password hashing (Web Crypto API) ──

async function hashPassword(password: string): Promise<string> {
  const c = getCrypto();
  const salt = new Uint8Array(16);
  c.getRandomValues(salt);

  const key = await c.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await c.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256
  );

  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return `${saltB64}:${hashB64}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Legacy: old SHA-256 hex hashes have no ':' separator
  if (!stored.includes(':')) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const c = getCrypto();
    const hash = await c.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hex === stored;
  }

  const [saltB64, hashB64] = stored.split(':');
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const expectedHash = Uint8Array.from(atob(hashB64), (c) => c.charCodeAt(0));

  const c = getCrypto();
  const key = await c.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await c.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256
  );

  const actualHash = new Uint8Array(hash);
  if (actualHash.length !== expectedHash.length) return false;
  return actualHash.every((b, i) => b === expectedHash[i]);
}

// ── Session tokens ──

function generateToken(): string {
  const c = getCrypto();
  const bytes = new Uint8Array(32);
  c.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getExpiresAt(): string {
  return new Date(Date.now() + SESSION_DURATION_MS).toISOString();
}

// ── Guest user helpers ──

/**
 * Create a guest user and return a session token.
 * Guest users use a UUID-based email and empty password hash.
 */
export function createGuestUser(): { user: Omit<User, 'passwordHash'>; token: string } {
  const db = getDb();
  const guestId = generateUUID();
  const guestEmail = `guest-${guestId}@studylog.local`;
  const guestName = 'Guest';

  const user = db.createUser({
    name: guestName,
    email: guestEmail,
    passwordHash: '',
    userType: 'guest',
  });

  const token = generateToken();
  const expiresAt = getExpiresAt();
  db.createSession(user.id, token, expiresAt);

  return { user: { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt }, token };
}

/**
 * Convert a guest user to a registered (authenticated) user.
 * Preserves all data — entries, reviews, syllabus progress.
 */
export async function convertGuestToAuthenticated(
  userId: string,
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const db = getDb();

  const existing = db.getUserByEmail(email);
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  db.updateUser(userId, { userType: 'authenticated', name });
  // Update email and password hash via the secure interface method
  db.updateUserCredentials(userId, email, passwordHash);

  const user = db.getUserById(userId)!;

  const token = generateToken();
  const expiresAt = getExpiresAt();
  db.createSession(user.id, token, expiresAt);
  return { user: { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt }, token };
}

// ── Public API ──

export async function signup(name: string, email: string, password: string, isGuestConversion?: { guestUserId: string }): Promise<AuthResult> {
  const db = getDb();

  if (isGuestConversion) {
    return convertGuestToAuthenticated(isGuestConversion.guestUserId, name, email, password);
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = db.createUser({ name, email, passwordHash, userType: 'authenticated' });

  const token = generateToken();
  const expiresAt = getExpiresAt();
  db.createSession(user.id, token, expiresAt);

  return { user: { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt }, token };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const db = getDb();

  const user = db.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  // If guest user somehow logs in, convert them
  if (user.userType === 'guest') {
    db.updateUser(user.id, { userType: 'authenticated' });
  }

  const token = generateToken();
  const expiresAt = getExpiresAt();
  db.createSession(user.id, token, expiresAt);

  return { user: { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt }, token };
}

export function logout(token: string): boolean {
  const db = getDb();
  db.deleteSession(token);
  return true;
}

export function getSessionUser(token: string | undefined | null): Omit<User, 'passwordHash'> | null {
  if (!token) return null;
  const db = getDb();

  const session = db.getSessionByToken(token);
  if (!session) return null;

  const user = db.getUserById(session.userId);
  if (!user) return null;

  return { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt };
}

export function getTokenFromCookie(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)session_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Exit guest mode: delete the guest's session so they see the landing page.
 * Does NOT delete the guest user or their data — signing up later reconnects.
 */
export function exitGuestMode(token: string): boolean {
  const db = getDb();
  db.deleteSession(token);
  return true;
}
