import { NextResponse } from 'next/server'
import { refreshOpenAIOAuthTokens } from '@openai-oauth/core'
import type { OpenAIOAuthSessionData } from '@/lib/openaiOAuthShared'

export async function POST(req: Request) {
  let body: { session?: OpenAIOAuthSessionData }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const session = body.session
  if (!session?.refreshToken || !session.accountId) {
    return NextResponse.json({ error: 'Missing session or refreshToken' }, { status: 400 })
  }

  try {
    const tokens = await refreshOpenAIOAuthTokens({ refreshToken: session.refreshToken })
    const next: OpenAIOAuthSessionData = {
      accessToken: tokens.accessToken,
      accountId: tokens.accountId || session.accountId,
      // Refresh tokens rotate: always persist the new one when returned.
      refreshToken: tokens.refreshToken || session.refreshToken,
      expiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString() : session.expiresAt,
      lastRefresh: new Date().toISOString(),
    }
    return NextResponse.json({ session: next })
  } catch (err) {
    console.error('openai oauth refresh failed', err)
    return NextResponse.json({ error: 'Token refresh failed — please sign in again' }, { status: 502 })
  }
}
