/**
 * Wrapper around fetch that automatically adds the API key header
 * when NEXT_PUBLIC_API_KEY is set (used by the iOS Capacitor build).
 * In local dev without the env var, requests go through unauthenticated
 * (the server allows this when DREAMSCAPE_API_KEY is also unset).
 */

const API_KEY = process.env.NEXT_PUBLIC_API_KEY

function getLocalApiKeys() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('dreamscape_api_keys') || '{}') } catch { return {} }
}
// Empty string = relative URL (works in local dev + Vercel web deployment).
// Set NEXT_PUBLIC_API_BASE_URL=https://www.dreamscape.quest only in Capacitor/mobile builds
// where the app runs from a file:// origin and needs absolute API URLs.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (API_KEY) headers['x-api-key'] = API_KEY
  const local = getLocalApiKeys() as any
  if (local.openai) headers['x-openai-key'] = local.openai
  if (local.openrouter) headers['x-openrouter-key'] = local.openrouter
  if (local.anthropic) headers['x-anthropic-key'] = local.anthropic
  if (local.deepgram) headers['x-deepgram-key'] = local.deepgram

  return fetch(`${BASE_URL}${path}`, { ...init, headers })
}
