// Vercel's cross-site form submission protection blocks the DELETE verb at the
// platform edge — even legitimate same-origin fetches (todo/entry delete buttons
// returned 403 "Cross-site DELETE form submissions are forbidden"). It also blocks
// bodyless POST/PUT/PATCH. The UI therefore sends a JSON-body POST carrying an
// X-HTTP-Method-Override: DELETE header, and routes honor the header to delete.
// Native DELETE handlers are kept for API clients and the local node adapter.
export function isDeleteOverride(request: Request): boolean {
  return (request.headers.get('x-http-method-override') || '').trim().toUpperCase() === 'DELETE';
}
