import { AsyncLocalStorage } from 'node:async_hooks';

// Ambient per-request user scope. Middleware wraps every request in
// runWithUser; every DB query reads the scope synchronously via
// getCurrentUserId. This is immune to request interleaving — a concurrent
// request can never clobber the scope of an in-flight one the way the old
// shared-mutable userId field could (which cross-contaminated user data
// whenever two requests awaited in overlapping order).
const storage = new AsyncLocalStorage<string>();

export function runWithUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  return storage.run(userId, fn);
}

export function getCurrentUserId(): string {
  return storage.getStore() ?? '';
}
