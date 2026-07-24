import { NextResponse } from 'next/server'
import { createOpenAIOAuthTransport } from '@openai-oauth/core'
import { OPENAI_OAUTH_HEADER, parseOpenAIOAuthHeader } from '@/lib/openaiOAuthShared'

// The Codex client version sent when listing models. Only used for catalog
// compatibility, not tied to any installed CLI.
const CODEX_CLIENT_VERSION = process.env.OPENAI_OAUTH_CODEX_CLIENT_VERSION || '0.144.1'

type CatalogEntry = { slug?: string; visibility?: string; supportedInApi?: boolean }

// Returns the models available to the signed-in user's ChatGPT account, so
// they can pick any model their plan serves (not just our default).
export async function GET(req: Request) {
  const session = parseOpenAIOAuthHeader(req.headers.get(OPENAI_OAUTH_HEADER))
  if (!session) {
    return NextResponse.json({ error: 'Missing or invalid x-openai-oauth session header' }, { status: 401 })
  }

  try {
    const transport = createOpenAIOAuthTransport({ auth: session })
    const res = await transport.request(`/models?client_version=${encodeURIComponent(CODEX_CLIENT_VERSION)}`)
    if (!res.ok) throw new Error(`catalog responded ${res.status}`)
    const parsed = (await res.json()) as { models?: CatalogEntry[] }
    // Public filter mirrors @openai-oauth/core's isPublicCodexModel (not exported publicly).
    const models = (Array.isArray(parsed.models) ? parsed.models : [])
      .filter((m) => typeof m.slug === 'string' && m.supportedInApi !== false && (m.visibility === undefined || m.visibility === 'list'))
      .map((m) => ({ slug: m.slug as string }))
    return NextResponse.json({ models })
  } catch (err) {
    console.error('codex model catalog fetch failed', err)
    return NextResponse.json({ error: 'Could not fetch available models — your session may have expired' }, { status: 502 })
  }
}
