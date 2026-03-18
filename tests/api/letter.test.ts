import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCallLLM = vi.hoisted(() => vi.fn<[string, object?], Promise<string>>())
vi.mock('@/lib/llm', () => ({ callLLM: mockCallLLM }))

import { POST } from '@/app/api/letter/route'
import type { DreamLog } from '@/lib/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_PROSE = `Dear dreamer,\n\nYour dreams have been speaking of water and light...\n\nWhat the sea knows about you, you are beginning to know yourself.`

const MOCK_STRUCTURED = {
  key_patterns: [{ pattern: 'Water imagery', frequency: 3, significance: 'The unconscious is prominent' }],
  emotional_arc: 'From anxiety toward serenity over the past week.',
  dominant_symbol: { name: 'Water', meaning: 'The depths of the unconscious seeking expression' },
  recommendations: [{ action: 'Spend time near water', timing: 'This week', why: 'Reinforce the integration' }],
  closing_theme: 'You are learning to trust what lies beneath the surface.',
}

const MOCK_RESPONSE = `${MOCK_PROSE}\n\n---JSON---\n${JSON.stringify(MOCK_STRUCTURED)}`

function makeDream(id: string, date: string): DreamLog {
  return {
    id,
    date,
    transcript: 'I dreamed of the ocean.',
    createdAt: Date.now(),
    extraction: {
      symbols: [{ name: 'Ocean', salience: 0.9, category: 'Place', meaning: 'The unconscious' }],
      emotions: [{ name: 'Peace', intensity: 0.8, valence: 0.9 }],
      themes: [{ name: 'Depth', confidence: 0.85, category: 'Archetypal' }],
      characters: [],
      setting: { type: 'Ocean', quality: 'Vast', time: 'Night' },
      narrative_arc: 'descending',
      lucidity: 0,
      tone: 'serene',
      interpretation: 'A restful descent.',
      astro_context: {
        moon_phase: 'Full Moon',
        moon_sign: 'Pisces',
        cosmic_themes: [],
        transit_note: '',
        natal_aspects: [],
      },
      recommendations: [],
    },
  }
}

async function collectSSE(response: Response): Promise<Array<{ type: string; data: unknown }>> {
  const text = await response.text()
  const events: Array<{ type: string; data: unknown }> = []
  for (const chunk of text.split('\n\n').filter(Boolean)) {
    let type = ''
    let dataStr = ''
    for (const line of chunk.split('\n')) {
      if (line.startsWith('event:')) type = line.slice(6).trim()
      if (line.startsWith('data:')) dataStr = line.slice(5).trim()
    }
    if (dataStr) events.push({ type, data: JSON.parse(dataStr) })
  }
  return events
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/letter', () => {
  beforeEach(() => {
    mockCallLLM.mockClear()
    mockCallLLM.mockResolvedValue(MOCK_RESPONSE)
  })

  it('emits status events then letter then done', async () => {
    const req = new Request('http://localhost/api/letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreams: [makeDream('1', '2026-03-10')], date: '2026-03-16' }),
    })
    const res = await POST(req)
    const events = await collectSSE(res)

    const types = events.map((e) => e.type)
    expect(types).toContain('status')
    expect(types).toContain('letter')
    expect(types).toContain('done')
    expect(types.indexOf('letter')).toBeLessThan(types.indexOf('done'))
  })

  it('letter event contains prose string', async () => {
    const req = new Request('http://localhost/api/letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreams: [makeDream('1', '2026-03-10')], date: '2026-03-16' }),
    })
    const res = await POST(req)
    const events = await collectSSE(res)
    const letterEvent = events.find((e) => e.type === 'letter')

    expect(letterEvent).toBeDefined()
    const { prose } = letterEvent!.data as { prose: string; structured: unknown }
    expect(typeof prose).toBe('string')
    expect(prose.length).toBeGreaterThan(20)
  })

  it('letter event contains structured data when valid JSON follows ---JSON---', async () => {
    const req = new Request('http://localhost/api/letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreams: [makeDream('1', '2026-03-10')], date: '2026-03-16' }),
    })
    const res = await POST(req)
    const events = await collectSSE(res)
    const letterEvent = events.find((e) => e.type === 'letter')
    const { structured } = letterEvent!.data as { prose: string; structured: typeof MOCK_STRUCTURED }

    expect(structured).not.toBeNull()
    expect(structured.key_patterns).toBeInstanceOf(Array)
    expect(typeof structured.emotional_arc).toBe('string')
    expect(structured.dominant_symbol).toHaveProperty('name')
    expect(structured.recommendations).toBeInstanceOf(Array)
    expect(typeof structured.closing_theme).toBe('string')
  })

  it('structured is null when model omits ---JSON--- separator', async () => {
    mockCallLLM.mockResolvedValue('Just a letter, no JSON separator.')
    const req = new Request('http://localhost/api/letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreams: [makeDream('1', '2026-03-10')], date: '2026-03-16' }),
    })
    const res = await POST(req)
    const events = await collectSSE(res)
    const letterEvent = events.find((e) => e.type === 'letter')
    const { structured } = letterEvent!.data as { prose: string; structured: null }
    expect(structured).toBeNull()
  })

  it('emits error event when callLLM throws', async () => {
    mockCallLLM.mockRejectedValue(new Error('timeout'))
    const req = new Request('http://localhost/api/letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreams: [makeDream('1', '2026-03-10')], date: '2026-03-16' }),
    })
    const res = await POST(req)
    const events = await collectSSE(res)
    expect(events.find((e) => e.type === 'error')).toBeDefined()
  })

  it('caps dreams at 10 for the prompt', async () => {
    const dreams = Array.from({ length: 15 }, (_, i) => makeDream(`d${i}`, `2026-03-${String(i + 1).padStart(2, '0')}`))
    const req = new Request('http://localhost/api/letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreams, date: '2026-03-16' }),
    })
    await POST(req)
    const prompt = mockCallLLM.mock.calls.at(-1)![0] as string
    expect(prompt).toContain('Dream 10')
    expect(prompt).not.toContain('Dream 11')
  })

  it('passes provider and model to callLLM', async () => {
    const req = new Request('http://localhost/api/letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dreams: [makeDream('1', '2026-03-10')],
        date: '2026-03-16',
        provider: 'ollama',
        model: 'qwen2.5:32b',
      }),
    })
    await POST(req)
    expect(mockCallLLM).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ provider: 'ollama', model: 'qwen2.5:32b' })
    )
  })
})
