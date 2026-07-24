import { NextResponse } from 'next/server'
import { deriveAccountId, exchangeOpenAIOAuthCode } from '@openai-oauth/core'
import type { OpenAIOAuthSessionData } from '@/lib/openaiOAuthShared'
import { OAUTH_REDIRECT_URI } from '@/app/api/auth/openai/start/route'

// Accepts either the full pasted redirect URL (http://localhost:1455/auth/callback?code=...&state=...)
// or a bare authorization code.
function parsePastedInput(pasted: string): { code: string; state?: string } | null {
  const trimmed = pasted.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    const code = url.searchParams.get('code')
    if (!code) return null
    return { code, state: url.searchParams.get('state') || undefined }
  } catch {
    // Not a URL — treat as a bare code (allow "code=..." paste too)
    const raw = trimmed.startsWith('code=') ? trimmed.slice(5) : trimmed
    if (!/^[\w-]{10,}$/.test(raw)) return null
    return { code: raw }
  }
}

export async function POST(req: Request) {
  let body: { pasted?: string; state?: string; codeVerifier?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { pasted, state, codeVerifier } = body
  if (!pasted || !state || !codeVerifier) {
    return NextResponse.json({ error: 'Missing pasted, state, or codeVerifier' }, { status: 400 })
  }

  const parsed = parsePastedInput(pasted)
  if (!parsed) {
    return NextResponse.json({ error: 'Could not find an authorization code in what you pasted' }, { status: 400 })
  }
  if (parsed.state && parsed.state !== state) {
    return NextResponse.json({ error: 'State mismatch — please restart sign-in' }, { status: 400 })
  }

  try {
    const tokens = await exchangeOpenAIOAuthCode({
      code: parsed.code,
      codeVerifier,
      redirectUri: OAUTH_REDIRECT_URI,
    })
    const accountId = tokens.accountId || deriveAccountId(tokens.idToken)
    if (!accountId) {
      return NextResponse.json({ error: 'Sign-in succeeded but no account id was returned' }, { status: 502 })
    }
    // The idToken is intentionally dropped: accountId is already derived and
    // the session rides in a request header on every call, so keep it small.
    const session: OpenAIOAuthSessionData = {
      accessToken: tokens.accessToken,
      accountId,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString() : undefined,
      lastRefresh: new Date().toISOString(),
    }
    return NextResponse.json({ session })
  } catch (err) {
    console.error('openai oauth exchange failed', err)
    return NextResponse.json({ error: 'Code exchange failed — the code may have expired, please restart sign-in' }, { status: 502 })
  }
}
