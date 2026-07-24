'use client'

// Client-side helpers for per-user "Sign in with ChatGPT" (OAuth via Codex).
// The session lives in localStorage (like BYO API keys) and is sent to our
// API routes as the x-openai-oauth header. Never imports apiFetch (it uses
// plain fetch) to avoid a refresh→apiFetch→refresh cycle.

import { Capacitor } from '@capacitor/core'
import {
  encodeOpenAIOAuthHeader,
  OPENAI_OAUTH_HEADER,
  type OpenAIOAuthSessionData,
} from '@/lib/openaiOAuthShared'

const SESSION_KEY = 'dreamscape_openai_oauth'
const MODEL_KEY = 'dreamscape_openai_oauth_model'
const PENDING_KEY = 'dreamscape_openai_oauth_pending' // sessionStorage: { state, codeVerifier }

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export const OPENAI_OAUTH_FALLBACK_MODEL = 'gpt-5.4-mini'

// ---------- storage ----------

export function getOpenAIOAuthSession(): OpenAIOAuthSessionData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as OpenAIOAuthSessionData) : null
  } catch {
    return null
  }
}

export function storeOpenAIOAuthSession(session: OpenAIOAuthSessionData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearOpenAIOAuthSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getOpenAIOAuthModel(): string {
  if (typeof window === 'undefined') return OPENAI_OAUTH_FALLBACK_MODEL
  return localStorage.getItem(MODEL_KEY) || OPENAI_OAUTH_FALLBACK_MODEL
}

export function setOpenAIOAuthModel(model: string) {
  localStorage.setItem(MODEL_KEY, model)
}

// ---------- header for apiFetch ----------

export function getOpenAIOAuthHeader(): string | null {
  const session = getOpenAIOAuthSession()
  return session ? encodeOpenAIOAuthHeader(session) : null
}

// Refresh 60s before expiry so LLM calls never ride a stale token. No-op when
// signed out or the token is still fresh. On rotation the new refresh token
// replaces the old one (server merges).
export async function refreshOpenAISessionIfNeeded(): Promise<void> {
  const session = getOpenAIOAuthSession()
  if (!session?.refreshToken || !session.expiresAt) return
  if (new Date(session.expiresAt).getTime() - Date.now() > 60_000) return
  try {
    const res = await fetch(`${BASE_URL}/api/auth/openai/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    })
    if (!res.ok) return // keep stale session; the LLM call's 401 surfaces naturally
    const { session: next } = (await res.json()) as { session: OpenAIOAuthSessionData }
    if (next?.accessToken) storeOpenAIOAuthSession(next)
  } catch {
    // offline / transient — leave the session untouched
  }
}

// ---------- sign-in flow ----------

async function openInBrowser(url: string) {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
  } else {
    window.open(url, '_blank', 'noopener')
  }
}

export async function startOpenAISignIn(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/openai/start`, { method: 'POST' })
    if (!res.ok) return { ok: false, error: 'Could not start sign-in' }
    const { authorizationUrl, state, codeVerifier } = await res.json()
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ state, codeVerifier }))
    await openInBrowser(authorizationUrl)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not start sign-in' }
  }
}

export async function completeOpenAISignIn(
  pasted: string,
): Promise<{ ok: true; session: OpenAIOAuthSessionData } | { ok: false; error: string }> {
  const pendingRaw = sessionStorage.getItem(PENDING_KEY)
  if (!pendingRaw) return { ok: false, error: 'Sign-in was not started (or expired) — press Sign in again' }
  const { state, codeVerifier } = JSON.parse(pendingRaw)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/openai/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pasted, state, codeVerifier }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || 'Sign-in failed' }
    storeOpenAIOAuthSession(data.session)
    sessionStorage.removeItem(PENDING_KEY)
    return { ok: true, session: data.session }
  } catch {
    return { ok: false, error: 'Sign-in failed — check your connection' }
  }
}

export function cancelOpenAISignIn() {
  sessionStorage.removeItem(PENDING_KEY)
}

// ---------- model resolution ----------

export function hasByoOpenAIKey(): boolean {
  try {
    const keys = JSON.parse(localStorage.getItem('dreamscape_api_keys') || '{}')
    return !!keys.openai
  } catch {
    return false
  }
}

// When provider=openai and the user relies on their ChatGPT OAuth session
// (no BYO API key), the requested model must come from the Codex catalog —
// the API-key default (gpt-4.1-mini) is not served by the Codex backend.
export function resolveOpenAIModel(provider: string, model: string | undefined): string | undefined {
  if (provider !== 'openai') return model
  if (!getOpenAIOAuthSession() || hasByoOpenAIKey()) return model
  return getOpenAIOAuthModel()
}
