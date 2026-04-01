import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGenerateImageSmart = vi.hoisted(() => vi.fn())

vi.mock('@/lib/image-generation', () => ({
  generateImageSmart: mockGenerateImageSmart,
  fetchImageAsBase64: vi.fn().mockResolvedValue(''),
}))

import { POST } from '@/app/api/generate-card/route'
import type { DreamLog } from '@/lib/types'

function makeDream(overrides: Partial<DreamLog> = {}): DreamLog {
  return {
    id: 'test-id',
    date: '2026-03-16',
    transcript: 'I was flying over a glass city.',
    createdAt: Date.now(),
    extraction: {
      symbols: [{ name: 'Glass City', salience: 0.9, category: 'Place', meaning: 'Illusion of transparency' }],
      emotions: [{ name: 'Wonder', intensity: 0.8, valence: 0.9 }],
      themes: [{ name: 'Freedom', confidence: 0.85, category: 'Archetypal' }],
      characters: [],
      setting: { type: 'Aerial', quality: 'Vast and transparent', time: 'Dusk' },
      narrative_arc: 'ascending',
      lucidity: 2,
      tone: 'expansive yet melancholic',
      interpretation: 'A test dream.',
      astro_context: {
        moon_phase: 'First Quarter',
        moon_sign: 'Cancer',
        cosmic_themes: [],
        transit_note: '',
        natal_aspects: [],
      },
      recommendations: [],
    },
    ...overrides,
  }
}

async function collectSSE(response: Response): Promise<Array<{ type: string; data: unknown }>> {
  const text = await response.text()
  const events = []
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
  return new Request('http://localhost/api/generate-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/generate-card', () => {
  beforeEach(() => {
    mockGenerateImageSmart.mockReset()
  })

  it('emits status then done with base64 image', async () => {
    mockGenerateImageSmart.mockResolvedValue({
      base64: 'aGVsbG93b3JsZA==',
      model: 'dall-e-3',
      provider: 'openai',
    })

    const req = makeRequest({ dreams: [makeDream()] })
    const res = await POST(req)
    const events = await collectSSE(res)

    const types = events.map((e) => e.type)
    expect(types).toContain('status')
    expect(types).toContain('done')
    expect(types).not.toContain('error')

    const doneEvent = events.find((e) => e.type === 'done')!
    expect((doneEvent.data as { base64: string }).base64).toBe('aGVsbG93b3JsZA==')
  })

  it('includes title derived from narrative_arc', async () => {
    mockGenerateImageSmart.mockResolvedValue({ base64: 'test', model: 'dall-e-3', provider: 'openai' })

    const req = makeRequest({ dreams: [makeDream({ extraction: { ...makeDream().extraction!, narrative_arc: 'ascending' } })] })
    const res = await POST(req)
    const events = await collectSSE(res)

    const doneEvent = events.find((e) => e.type === 'done')!
    expect((doneEvent.data as { title: string }).title).toBe('The Ascent')
  })

  it('derives title from storyTitle when provided', async () => {
    mockGenerateImageSmart.mockResolvedValue({ base64: 'test', model: 'dall-e-3', provider: 'openai' })

    const req = makeRequest({ dreams: [], storyTitle: 'The Midnight Garden' })
    const res = await POST(req)
    const events = await collectSSE(res)

    const doneEvent = events.find((e) => e.type === 'done')!
    expect((doneEvent.data as { title: string }).title).toBe('The Midnight Garden')
  })

  it('emits error event when generateImageSmart throws', async () => {
    mockGenerateImageSmart.mockRejectedValue(new Error('DALL-E quota exceeded'))

    const req = makeRequest({ dreams: [makeDream()] })
    const res = await POST(req)
    const events = await collectSSE(res)

    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect((errorEvent!.data as { message: string }).message).toContain('DALL-E quota exceeded')
  })

  it('response has SSE content-type header', async () => {
    mockGenerateImageSmart.mockResolvedValue({ base64: 'test', model: 'dall-e-3', provider: 'openai' })

    const req = makeRequest({ dreams: [makeDream()] })
    const res = await POST(req)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
  })

  it('uses story card prompt when dreams array is empty', async () => {
    mockGenerateImageSmart.mockResolvedValue({ base64: 'test', model: 'dall-e-3', provider: 'openai' })

    const req = makeRequest({ dreams: [] })
    await POST(req)

    expect(mockGenerateImageSmart).toHaveBeenCalledWith(
      expect.stringContaining('dreamer floats in a cosmic sleep between two worlds'),
    )
  })

  it('uses dream card prompt when dreams are provided', async () => {
    mockGenerateImageSmart.mockResolvedValue({ base64: 'test', model: 'dall-e-3', provider: 'openai' })

    const req = makeRequest({ dreams: [makeDream()] })
    await POST(req)

    expect(mockGenerateImageSmart).toHaveBeenCalledWith(
      expect.stringContaining('translucent glass towers'),
    )
  })
})
