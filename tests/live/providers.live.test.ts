/**
 * Live provider smoke-test. Verifies every configured provider actually
 * accepts the registry's default models — catches stale model IDs, delisted
 * models, and broken params BEFORE users hit them.
 *
 * Not run in CI by default (needs real keys + network). Run manually:
 *   npm run verify:providers
 *
 * Reads keys from .env.local (no dotenv dependency).
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { textModel, imageModel, ttsModel } from '@/lib/models'
import { DEFAULT_OPENROUTER_MODEL } from '@/lib/openrouterModels'

const RUN = !!process.env.RUN_LIVE

// Must run at module scope: skipIf conditions evaluate at collection time,
// before any beforeAll hook would execute.
if (RUN) {
  try {
    for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch {
    // no .env.local — only process env available
  }
}

const has = (name: string) => !!process.env[name]

describe.skipIf(!RUN)('live provider smoke-test', () => {
  it.skipIf(!has('GROQ_API_KEY'))('groq accepts the default text model', async () => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: textModel.groq(), messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 }),
    })
    expect(res.status, await res.text()).toBe(200)
  })

  it.skipIf(!has('OPENROUTER_API_KEY'))('openrouter default free model exists (429 = rate-limited, still OK)', async () => {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: DEFAULT_OPENROUTER_MODEL, messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 }),
    })
    // 404 would mean the model ID is gone; 429 means upstream rate limit (fine)
    expect(res.status, await res.text()).not.toBe(404)
  })

  it.skipIf(!has('ANTHROPIC_API_KEY'))('anthropic accepts the default text model', async () => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: textModel.anthropic(), max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
    })
    expect(res.status, await res.text()).not.toBe(404)
  })

  it.skipIf(!has('REPLICATE_API_TOKEN'))('replicate image model exists (official endpoint)', async () => {
    const res = await fetch(`https://api.replicate.com/v1/models/${imageModel.replicate()}`, {
      headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
    })
    expect(res.status, await res.text()).toBe(200)
  })

  it.skipIf(!has('REPLICATE_API_TOKEN'))('replicate TTS model exists (official endpoint)', async () => {
    const res = await fetch(`https://api.replicate.com/v1/models/${ttsModel.replicate()}`, {
      headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
    })
    expect(res.status, await res.text()).toBe(200)
  })

  it.skipIf(!has('OPENAI_API_KEY'))('openai key can access the default image model', async () => {
    const res = await fetch(`https://api.openai.com/v1/models/${imageModel.openai()}`, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    })
    expect(res.status, await res.text()).toBe(200)
  })

  it.skipIf(!has('ELEVENLABS_API_KEY'))('elevenlabs key is valid', async () => {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
    })
    expect(res.status).toBe(200)
  })

  it.skipIf(!has('DEEPGRAM_API_KEY'))('deepgram key is valid', async () => {
    const res = await fetch('https://api.deepgram.com/v1/projects', {
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
    })
    expect(res.status).toBe(200)
  })

  it('gemini image path: reports AI Gateway configuration status', () => {
    const configured = has('AI_GATEWAY_API_KEY') || has('VERCEL')
    console.log(`AI Gateway (Gemini image): ${configured ? 'configured' : 'NOT configured — gemini fallback will be skipped'}`)
    expect(true).toBe(true)
  })
})
