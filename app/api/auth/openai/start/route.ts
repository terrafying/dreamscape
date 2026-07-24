import { NextResponse } from 'next/server'
import { createOpenAIOAuthRequest } from '@openai-oauth/core'
import { OAUTH_REDIRECT_URI } from '@/lib/openaiOAuthConfig'

// ChatGPT's OAuth client only allows localhost redirect URIs (this is the one
// Codex CLI registers). The user completes sign-in in their browser, the
// redirect to localhost fails to load, and they paste the resulting URL back
// into the app — see components/ChatGPTSignIn.tsx.

export async function POST() {
  try {
    const req = await createOpenAIOAuthRequest({ redirectUri: OAUTH_REDIRECT_URI })
    // The code verifier goes to the client (sessionStorage) — the client is the
    // OAuth client here, so this is correct per PKCE, and it keeps the route
    // stateless (works on serverless and across Capacitor cross-origin calls).
    return NextResponse.json({
      authorizationUrl: req.authorizationUrl,
      state: req.state,
      codeVerifier: req.codeVerifier,
    })
  } catch (err) {
    console.error('openai oauth start failed', err)
    return NextResponse.json({ error: 'Failed to start ChatGPT sign-in' }, { status: 500 })
  }
}
