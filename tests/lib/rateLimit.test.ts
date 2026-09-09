import { describe, it, expect, beforeEach } from 'vitest'
import { consumeRateWindow, rateLimitIdentity, readJsonWithLimit } from '@/lib/rateLimit'

function makeReq(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ok: true }),
  })
}

// Unique bucket per test so in-memory windows never collide.
const bucket = () => `test_${Math.random().toString(36).slice(2)}`

describe('rateLimitIdentity', () => {
  it('prefers the bearer token, then x-api-key, then IP', () => {
    expect(rateLimitIdentity(makeReq({ Authorization: 'Bearer abc' }))).toMatch(/^tok:abc/)
    expect(rateLimitIdentity(makeReq({ 'x-api-key': 'secret' }))).toMatch(/^key:secret/)
    expect(rateLimitIdentity(makeReq({ 'x-real-ip': '1.2.3.4' }))).toBe('ip:1.2.3.4')
    expect(rateLimitIdentity(makeReq())).toBe('ip:anonymous')
  })

  it('never stores a full token (40-char cap)', () => {
    const long = 'x'.repeat(300)
    expect(rateLimitIdentity(makeReq({ Authorization: `Bearer ${long}` }))).toHaveLength(44)
  })

  it('takes the first IP from x-forwarded-for', () => {
    expect(rateLimitIdentity(makeReq({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('ip:9.9.9.9')
  })
})

describe('consumeRateWindow', () => {
  it('allows requests under the limit and blocks beyond it', () => {
    const key = `${bucket()}:2.2.2.2`
    for (let i = 0; i < 3; i++) {
      expect(consumeRateWindow(key, { limit: 3, windowSeconds: 60 }).allowed).toBe(true)
    }
    const blocked = consumeRateWindow(key, { limit: 3, windowSeconds: 60 })
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('keys by identity: one caller exhausting the bucket does not block another', () => {
    const b = bucket()
    expect(consumeRateWindow(`${b}:3.3.3.3`, { limit: 1, windowSeconds: 60 }).allowed).toBe(true)
    expect(consumeRateWindow(`${b}:3.3.3.3`, { limit: 1, windowSeconds: 60 }).allowed).toBe(false)
    expect(consumeRateWindow(`${b}:4.4.4.4`, { limit: 1, windowSeconds: 60 }).allowed).toBe(true)
  })

  it('windows reset after expiry', async () => {
    const key = `${bucket()}:5.5.5.5`
    expect(consumeRateWindow(key, { limit: 1, windowSeconds: 1 }).allowed).toBe(true)
    expect(consumeRateWindow(key, { limit: 1, windowSeconds: 1 }).allowed).toBe(false)
    await new Promise((r) => setTimeout(r, 1100))
    expect(consumeRateWindow(key, { limit: 1, windowSeconds: 1 }).allowed).toBe(true)
  })
})

describe('readJsonWithLimit', () => {
  it('parses normal bodies', async () => {
    const res = await readJsonWithLimit(makeReq(), 10_000)
    expect(res.ok).toBe(true)
  })

  it('rejects oversized bodies with 413 before parsing', async () => {
    const big = new Request('http://localhost/api/test', {
      method: 'POST',
      body: 'x'.repeat(50_001),
    })
    const res = await readJsonWithLimit(big, 50_000)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.response.status).toBe(413)
  })

  it('rejects malformed JSON with 400', async () => {
    const bad = new Request('http://localhost/api/test', { method: 'POST', body: '{nope' })
    const res = await readJsonWithLimit(bad)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.response.status).toBe(400)
  })
})
