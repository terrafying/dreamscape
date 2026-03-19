/**
 * Lightweight API auth for Vercel endpoints.
 * iOS app sends a shared secret in the X-API-Key header.
 * Secret is set as DREAMSCAPE_API_KEY in Vercel env vars.
 * Local dev passes without a key when DREAMSCAPE_API_KEY is unset.
 */

const API_KEY = process.env.DREAMSCAPE_API_KEY

/**
 * Returns a 401 Response if the request fails auth, or null if it passes.
 * Usage: const denied = checkAuth(req); if (denied) return denied;
 */
export function checkAuth(req: Request): Response | null {
  // No key configured → allow all (local dev)
  if (!API_KEY) return null

  const provided =
    req.headers.get('x-api-key') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (provided === API_KEY) return null

  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
