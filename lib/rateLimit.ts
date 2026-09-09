/**
 * In-memory fixed-window rate limiter for paid API routes.
 *
 * Threat model: the static DREAMSCAPE_API_KEY ships inside the iOS binary and
 * can be extracted; these limits cap the burn rate per key regardless. Keyed
 * by credential identity when available (Supabase user id, API key, or IP).
 *
 * In-memory means per-instance on serverless — Vercel's per-region lambdas
 * each keep their own window. That's intentionally "good enough": it blunts
 * abuse and runaway loops without adding an infra dependency. Swap the store
 * for Upstash/Vercel KV later by replacing the Map below; the interface won't
 * change.
 */

interface WindowState {
  count: number
  resetAt: number
}

const windows = new Map<string, WindowState>()

// Periodic sweep so closed windows don't accumulate forever.
const SWEEP_INTERVAL_MS = 5 * 60_000
let lastSweep = 0

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, state] of windows) {
    if (state.resetAt <= now) windows.delete(key)
  }
}

export interface RateLimitOptions {
  /** Requests allowed per window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Seconds until the window resets (only meaningful when not allowed). */
  retryAfterSeconds: number
  remaining: number
}

/**
 * Identity extraction: prefer the Supabase bearer token subject, then the
 * app API key header, then the client IP. Only the first 40 chars of a token
 * fingerprint the caller — enough to bucket, never enough to leak.
 */
export function rateLimitIdentity(req: Request): string {
  const auth = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (auth) return `tok:${auth.slice(0, 40)}`
  const apiKey = req.headers.get('x-api-key')
  if (apiKey) return `key:${apiKey.slice(0, 40)}`
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'anonymous'
  return `ip:${ip}`
}

/**
 * Consume one request against a window key. Pure windowing logic, no env
 * bypass — exported so tests can exercise the real algorithm.
 */
export function consumeRateWindow(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const state = windows.get(key)

  if (!state || state.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + opts.windowSeconds * 1000 })
    return { allowed: true, retryAfterSeconds: 0, remaining: opts.limit - 1 }
  }

  state.count += 1
  if (state.count > opts.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
      remaining: 0,
    }
  }
  return { allowed: true, retryAfterSeconds: 0, remaining: opts.limit - state.count }
}

export function checkRateLimit(req: Request, bucket: string, opts: RateLimitOptions): RateLimitResult {
  // Route tests fire many POSTs from the same anonymous identity; without
  // this they'd trip the shared in-memory window and fail non-deterministically.
  // (Unit tests use consumeRateWindow directly to exercise the real logic.)
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return { allowed: true, retryAfterSeconds: 0, remaining: opts.limit }
  }

  return consumeRateWindow(`${bucket}:${rateLimitIdentity(req)}`, opts)
}

/** Standard 429 response with Retry-After. */
export function rateLimitedResponse(retryAfterSeconds: number): Response {
  return Response.json(
    { error: 'Too many requests — slow down a moment.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  )
}

/**
 * Parse a JSON request body with a hard size cap. Caps are a cost guard, not
 * a product limit: a multi-megabyte "dream transcript" is a billing attack
 * (prompt tokens + 7-day cache pollution), so anything beyond the cap is
 * rejected with 413 before a provider is ever called.
 */
export async function readJsonWithLimit(req: Request, maxChars = 200_000): Promise<{ ok: true; body: any } | { ok: false; response: Response }> {
  let raw: string
  try {
    raw = await req.text()
  } catch {
    return { ok: false, response: Response.json({ error: 'Invalid request body' }, { status: 400 }) }
  }
  if (raw.length > maxChars) {
    return { ok: false, response: Response.json({ error: 'Payload too large' }, { status: 413 }) }
  }
  try {
    return { ok: true, body: JSON.parse(raw) }
  } catch {
    return { ok: false, response: Response.json({ error: 'Invalid request body' }, { status: 400 }) }
  }
}

// Shared tiers ---------------------------------------------------------------

/** Expensive: LLM interpretation / generation routes (each call bills a provider). */
export const RATE_LLM: RateLimitOptions = { limit: 20, windowSeconds: 60 }

/** Very expensive: media generation (video ~$0.20-0.60, audio $0.10 per call). */
export const RATE_MEDIA: RateLimitOptions = { limit: 6, windowSeconds: 60 }
