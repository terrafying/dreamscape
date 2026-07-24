import { describe, it, expect, vi, afterEach } from 'vitest'

import { POST as startPOST } from '@/app/api/auth/openai/start/route'
import { POST as exchangePOST } from '@/app/api/auth/openai/exchange/route'
import { POST as refreshPOST } from '@/app/api/auth/openai/refresh/route'
import { GET as modelsGET } from '@/app/api/openai/oauth-models/route'
import { encodeOpenAIOAuthHeader } from '@/lib/openaiOAuthShared'

function makeRequest(url: string, body?: unknown): Request {
  return new Request(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function fakeJwt(payload: Record<string, unknown>): string {
  const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${enc({ alg: 'none' })}.${enc(payload)}.sig`
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('POST /api/auth/openai/start', () => {
  it('returns an authorization URL with PKCE state and verifier', async () => {
    const res = await startPOST()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.authorizationUrl).toContain('https://auth.openai.com/oauth/authorize')
    expect(data.authorizationUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A1455')
    expect(typeof data.state).toBe('string')
    expect(typeof data.codeVerifier).toBe('string')
  })
})

describe('POST /api/auth/openai/exchange', () => {
  it('rejects missing fields', async () => {
    const res = await exchangePOST(makeRequest('http://localhost/api/auth/openai/exchange', {}))
    expect(res.status).toBe(400)
  })

  it('rejects paste input without a code', async () => {
    const res = await exchangePOST(
      makeRequest('http://localhost/api/auth/openai/exchange', {
        pasted: 'not a url and not a code!!',
        state: 's',
        codeVerifier: 'v',
      }),
    )
    expect(res.status).toBe(400)
  })

  it('rejects state mismatch from the pasted URL', async () => {
    const res = await exchangePOST(
      makeRequest('http://localhost/api/auth/openai/exchange', {
        pasted: 'http://localhost:1455/auth/callback?code=abcdef1234567890&state=WRONG',
        state: 'RIGHT',
        codeVerifier: 'v',
      }),
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/state mismatch/i)
  })

  it('exchanges a pasted callback URL and returns a trimmed session', async () => {
    const idToken = fakeJwt({ chatgpt_account_id: 'acct-test-123' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      access_token: 'at-123',
      refresh_token: 'rt-456',
      id_token: idToken,
      expires_in: 3600,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    const res = await exchangePOST(
      makeRequest('http://localhost/api/auth/openai/exchange', {
        pasted: 'http://localhost:1455/auth/callback?code=abcdef1234567890&state=s1',
        state: 's1',
        codeVerifier: 'verifier-abc',
      }),
    )
    expect(res.status).toBe(200)
    const { session } = await res.json()
    expect(session.accessToken).toBe('at-123')
    expect(session.refreshToken).toBe('rt-456')
    expect(session.accountId).toBe('acct-test-123')
    expect(session.expiresAt).toBeTruthy()
    // idToken must not ride along (header-size discipline)
    expect('idToken' in session).toBe(false)
  })
})

describe('POST /api/auth/openai/refresh', () => {
  it('rejects missing refresh token', async () => {
    const res = await refreshPOST(makeRequest('http://localhost/api/auth/openai/refresh', { session: { accountId: 'a' } }))
    expect(res.status).toBe(400)
  })

  it('rotates and merges the session', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      access_token: 'at-new',
      refresh_token: 'rt-new',
      expires_in: 3600,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    const res = await refreshPOST(
      makeRequest('http://localhost/api/auth/openai/refresh', {
        session: { accessToken: 'at-old', accountId: 'acct-1', refreshToken: 'rt-old' },
      }),
    )
    expect(res.status).toBe(200)
    const { session } = await res.json()
    expect(session.accessToken).toBe('at-new')
    expect(session.refreshToken).toBe('rt-new')
    expect(session.accountId).toBe('acct-1')
  })
})

describe('GET /api/openai/oauth-models', () => {
  it('rejects requests without a session header', async () => {
    const res = await modelsGET(makeRequest('http://localhost/api/openai/oauth-models'))
    expect(res.status).toBe(401)
  })

  it('rejects a malformed session header', async () => {
    const req = new Request('http://localhost/api/openai/oauth-models', {
      headers: { 'x-openai-oauth': 'garbage!!!' },
    })
    const res = await modelsGET(req)
    expect(res.status).toBe(401)
  })
})

describe('openaiOAuthShared codec', () => {
  it('round-trips a session through the header encoding', () => {
    const session = { accessToken: 'at', accountId: 'acct', refreshToken: 'rt', expiresAt: '2026-01-01T00:00:00Z' }
    const encoded = encodeOpenAIOAuthHeader(session)
    expect(encoded).not.toContain('{')
    // parseOpenAIOAuthHeader is exercised indirectly via the 401 tests above;
    // direct round-trip here:
    return import('@/lib/openaiOAuthShared').then(({ parseOpenAIOAuthHeader }) => {
      expect(parseOpenAIOAuthHeader(encoded)).toEqual(session)
    })
  })
})
