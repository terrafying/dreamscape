import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/lib/llm so tests don't need Anthropic credentials or Ollama
const mockCallLLM = vi.hoisted(() => vi.fn<[string, object?], Promise<string>>())
vi.mock('@/lib/llm', () => ({ callLLM: mockCallLLM }))

import { POST } from '@/app/api/extract/route'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/extract', () => {
  beforeEach(() => {
    mockCallLLM.mockClear()
    mockCallLLM.mockResolvedValue(JSON.stringify(VALID_EXTRACTION))
  })

  it('emits status events then extraction then done', async () => {
    const res = await POST(makeRequest({ transcript: 'I flew over a city.', date: '2026-03-16' }))
    const events = await collectSSE(res)
    const types = events.map((e) => e.type)

    expect(types).toContain('status')
    expect(types).toContain('extraction')
    expect(types).toContain('done')
    expect(types.indexOf('status')).toBeLessThan(types.indexOf('extraction'))
    expect(types.indexOf('extraction')).toBeLessThan(types.indexOf('done'))
  })

  it('extraction event contains valid DreamExtraction shape', async () => {
    const res = await POST(makeRequest({ transcript: 'I flew over a city.', date: '2026-03-16' }))
    const events = await collectSSE(res)
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
    mockCallLLM.mockResolvedValue('```json\n' + JSON.stringify(VALID_EXTRACTION) + '\n```')
    const res = await POST(makeRequest({ transcript: 'Test dream', date: '2026-03-16' }))
    const events = await collectSSE(res)
    expect(events.find((e) => e.type === 'extraction')).toBeDefined()
  })

  it('emits error event when model returns invalid JSON', async () => {
    mockCallLLM.mockResolvedValue('Sorry, I cannot do that.')
    const res = await POST(makeRequest({ transcript: 'Test', date: '2026-03-16' }))
    const events = await collectSSE(res)
    expect(events.find((e) => e.type === 'error')).toBeDefined()
  })

  it('emits error event when callLLM throws', async () => {
    mockCallLLM.mockRejectedValue(new Error('Ollama error (503): is Ollama running?'))
    const res = await POST(makeRequest({ transcript: 'Test', date: '2026-03-16' }))
    const events = await collectSSE(res)
    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect((errorEvent!.data as { message: string }).message).toContain('Ollama')
  })

  it('response has SSE content-type header', async () => {
    const res = await POST(makeRequest({ transcript: 'Test', date: '2026-03-16' }))
    expect(res.headers.get('content-type')).toContain('text/event-stream')
  })

  it('passes provider and model to callLLM', async () => {
    await POST(makeRequest({
      transcript: 'Ocean dream.',
      date: '2026-03-16',
      provider: 'ollama',
      model: 'qwen2.5:32b',
    }))
    await POST(makeRequest({ transcript: 'x', date: '2026-03-16' })) // consume stream
    expect(mockCallLLM).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ provider: 'ollama', model: 'qwen2.5:32b' })
    )
  })

  it('includes natal context in prompt when birthData provided', async () => {
    await POST(makeRequest({
      transcript: 'Ocean dream.',
      date: '2026-03-16',
      birthData: { date: '1990-04-15', location: 'New York, NY' },
    }))
    const prompt = mockCallLLM.mock.calls.at(-1)![0] as string
    expect(prompt).toContain('1990-04-15')
  })
})
