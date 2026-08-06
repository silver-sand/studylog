// Minimal in-memory sliding-window rate limiter. Sufficient for single-process
// Node SSR; if the app is ever scaled horizontally or run on multiple
// instances, swap this for a shared store (Redis, etc.).
interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= MAX_BUCKETS) buckets.clear(); // crude memory guard
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  // Drop timestamps outside the sliding window
  bucket.timestamps = bucket.timestamps.filter(t => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return { allowed: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }

  bucket.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

// Standard 429 response for auth routes; null when the request may proceed.
export function rateLimitResponse(result: RateLimitResult): Response | null {
  if (result.allowed) return null;
  return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
    },
  });
}
