import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCallLLMWithSource = vi.hoisted(() => vi.fn<[string, object?], Promise<{ text: string; source: string }>>())
vi.mock('@/lib/llm', () => ({ callLLMWithSource: mockCallLLMWithSource }))

import { POST } from '@/app/api/extract/route'

const VALID_EXTRACTION = {
  symbols: [{ name: 'Water', salience: 0.9, category: 'Element', meaning: 'The unconscious' }],
  emotions: [{ name: 'Peace', intensity: 0.8, valence: 0.9 }],
  themes: [{ name: 'Integration', confidence: 0.85, category: 'Transformative' }],
  characters: [],
  setting: { type: 'Ocean', quality: 'Vast', time: 'Night' },
  narrative_arc: 'descending',
  lucidity: 1,
  tone: 'serene',
  interpretation: 'A dream about depth and peace.',
  astro_context: {
    moon_phase: 'Full Moon',
    moon_sign: 'Pisces',
    cosmic_themes: ['Healing'],
    transit_note: 'Full Moon amplifies emotional depth.',
    natal_aspects: [],
  },
  recommendations: [{ action: 'Journal tonight', timing: 'Today', why: 'The images are fresh' }],
  goetic_resonance: {
    spirit: 'Vassago',
    reason: 'Search-and-revelation themes mirror hidden knowledge imagery.',
    barbarous: 'VASSAGO USAN BABAGE',
  },
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

function makeRequest(body: object) {
  return new Request('http://localhost/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function runExtract(body: object) {
  const res = await POST(makeRequest(body))
  const events = await collectSSE(res)
  return { res, events }
}

describe('POST /api/extract', () => {
  beforeEach(() => {
    mockCallLLMWithSource.mockReset()
    mockCallLLMWithSource.mockResolvedValue({ text: JSON.stringify(VALID_EXTRACTION), source: 'openrouter:openrouter/free' })
  })

  it('emits status events then extraction then done', async () => {
    const { events } = await runExtract({ transcript: `I flew over a city ${Date.now()}.`, date: '2026-03-16' })
    const types = events.map((e) => e.type)

    expect(types).toContain('status')
    expect(types).toContain('extraction')
    expect(types).toContain('done')
    expect(types.indexOf('status')).toBeLessThan(types.indexOf('extraction'))
    expect(types.indexOf('extraction')).toBeLessThan(types.indexOf('done'))
  })

  it('extraction event contains valid DreamExtraction shape', async () => {
    const { events } = await runExtract({ transcript: `I flew over a city ${Date.now()}.`, date: '2026-03-16' })
    const extractionEvent = events.find((e) => e.type === 'extraction')

    expect(extractionEvent).toBeDefined()
    const { data } = extractionEvent!.data as { data: typeof VALID_EXTRACTION }
    expect(data.symbols).toBeInstanceOf(Array)
    expect(data.emotions).toBeInstanceOf(Array)
    expect(data.themes).toBeInstanceOf(Array)
    expect(data.recommendations).toBeInstanceOf(Array)
    expect(data.astro_context).toHaveProperty('moon_phase')
    expect(typeof data.lucidity).toBe('number')
    expect(typeof data.interpretation).toBe('string')
  })

  it('strips markdown fences from model response', async () => {
    mockCallLLMWithSource.mockResolvedValue({ text: '```json\n' + JSON.stringify(VALID_EXTRACTION) + '\n```', source: 'openrouter:openrouter/free' })
    const { events } = await runExtract({ transcript: `Test dream ${Date.now()}`, date: '2026-03-16' })
    expect(events.find((e) => e.type === 'extraction')).toBeDefined()
  })

  it('emits error event when model returns invalid JSON', async () => {
    mockCallLLMWithSource.mockResolvedValue({ text: 'Sorry, I cannot do that.', source: 'openrouter:openrouter/free' })
    const { events } = await runExtract({ transcript: `Test ${Date.now()}`, date: '2026-03-16' })
    expect(events.find((e) => e.type === 'error')).toBeDefined()
  })

  it('emits error event when callLLMWithSource throws', async () => {
    mockCallLLMWithSource.mockRejectedValue(new Error('OpenRouter error (503): timeout'))
    const { events } = await runExtract({ transcript: `Test ${Date.now()}`, date: '2026-03-16' })
    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect((errorEvent!.data as { message: string }).message).toContain('OpenRouter')
  })

  it('response has SSE content-type header', async () => {
    const { res } = await runExtract({ transcript: `Test ${Date.now()}`, date: '2026-03-16' })
    expect(res.headers.get('content-type')).toContain('text/event-stream')
  })

  it('passes provider and model to callLLMWithSource', async () => {
    await runExtract({
      transcript: `Ocean dream ${Date.now()}`,
      date: '2026-03-16',
      provider: 'openrouter',
      model: 'openrouter/free',
    })
    expect(mockCallLLMWithSource).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ provider: 'openrouter', model: 'openrouter/free' }),
    )
  })

  it('includes natal context in prompt when birthData provided', async () => {
    await runExtract({
      transcript: `Ocean dream ${Date.now()}`,
      date: '2026-03-16',
      birthData: { date: '1990-04-15', location: 'New York, NY' },
    })
    const prompt = mockCallLLMWithSource.mock.calls.at(-1)?.[0] as string
    expect(prompt).toContain('1990-04-15')
  })

  it('passes groq provider with llama model', async () => {
    await runExtract({
      transcript: `Forest dream ${Date.now()}`,
      date: '2026-03-16',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
    })
    expect(mockCallLLMWithSource).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ provider: 'groq', model: 'llama-3.3-70b-versatile' }),
    )
  })
})
