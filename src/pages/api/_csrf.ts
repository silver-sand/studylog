export function validateOrigin(request: Request): boolean {
  // Skip validation for GET/HEAD requests
  if (request.method === 'GET' || request.method === 'HEAD') return true;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // If both are missing, allow through — SameSite cookies handle CSRF.
  // Some browser contexts (proxies, extensions, privacy modes) don't send
  // Origin on same-origin POST requests, so rejecting would be too strict.
  if (!origin && !referer) return true;

  // In development, allow all origins
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  if (isDev) return true;

  // Allow same-origin requests
  const url = new URL(request.url);
  const allowedOrigins = [
    `${url.protocol}//${url.host}`,
    'http://localhost:4321',  // dev server
  ];

  if (origin && !allowedOrigins.some(o => origin.startsWith(o))) return false;
  if (referer && !allowedOrigins.some(o => referer.startsWith(o))) return false;

  return true;
}
