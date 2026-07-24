// Shared (server + client) codec for per-user ChatGPT OAuth sessions.
// Sessions travel from the browser to our API routes as a base64url-encoded
// JSON header (`x-openai-oauth`), mirroring the BYO API key pattern.
// No Node or browser APIs here — safe to import anywhere.

export interface OpenAIOAuthSessionData {
  accessToken: string
  accountId: string
  refreshToken?: string
  expiresAt?: string
  lastRefresh?: string
}

export const OPENAI_OAUTH_HEADER = 'x-openai-oauth'

function base64UrlEncode(input: string): string {
  // btoa is available in both modern Node (>=16) and browsers.
  return btoa(unescape(encodeURIComponent(input))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  return decodeURIComponent(escape(atob(b64)))
}

export function encodeOpenAIOAuthHeader(session: OpenAIOAuthSessionData): string {
  return base64UrlEncode(JSON.stringify(session))
}

export function parseOpenAIOAuthHeader(value: string | null | undefined): OpenAIOAuthSessionData | undefined {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(base64UrlDecode(value.trim()))
    if (typeof parsed?.accessToken !== 'string' || typeof parsed?.accountId !== 'string') return undefined
    return {
      accessToken: parsed.accessToken,
      accountId: parsed.accountId,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined,
      expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : undefined,
      lastRefresh: typeof parsed.lastRefresh === 'string' ? parsed.lastRefresh : undefined,
    }
  } catch {
    return undefined
  }
}
