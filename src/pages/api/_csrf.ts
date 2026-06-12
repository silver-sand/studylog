export function validateOrigin(request: Request): boolean {
  // Skip validation for GET/HEAD requests
  if (request.method === 'GET' || request.method === 'HEAD') return true;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // If neither header is present, trust SameSite cookies for CSRF protection
  if (!origin && !referer) return true;

  // Derive the expected origin from the Host header, which reliably reflects
  // the external hostname on all platforms (including Render where request.url
  // points to an internal address like http://0.0.0.0:10000/).
  const host = request.headers.get('host');
  if (!host) return false;

  const expectedHostname = host.split(':')[0];

  // Validate Origin header when present
  if (origin) {
    try {
      const originHostname = new URL(origin).hostname;
      if (originHostname !== expectedHostname) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // Validate Referer header when present
  if (referer) {
    try {
      const refererHostname = new URL(referer).hostname;
      if (refererHostname !== expectedHostname) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}
