import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { startAudioGeneration, getAudioPredictionStatus } from '@/lib/audio-generation'

const MODEL_BODY = {
  latest_version: { id: 'ver'.repeat(10) },
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('startAudioGeneration', () => {
  beforeEach(() => {
    process.env.REPLICATE_API_TOKEN = 'r8_test'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.REPLICATE_API_TOKEN
  })

  it('resolves the latest version then starts a versioned prediction', async () => {
    const fetchMock = vi.fn()
      // GET /models/meta/musicgen → version id
      .mockResolvedValueOnce(jsonResponse(MODEL_BODY))
      // POST /predictions → accepted
      .mockResolvedValueOnce(jsonResponse({ id: 'pred123', status: 'starting' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await startAudioGeneration('dreamy ambient pad')

    expect(result.predictionId).toBe('pred123')
    expect(result.model).toBe('meta/musicgen')
    expect(result.modelVersion).toBe('stereo-melody-large')

    // Regression guard: musicgen is versioned-endpoint-only (no official-model route).
    const startUrl = fetchMock.mock.calls[1][0] as string
    expect(startUrl).toBe('https://api.replicate.com/v1/predictions')
    const startBody = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(startBody.version).toBe(MODEL_BODY.latest_version.id)
    expect(startBody.input.model_version).toBe('stereo-melody-large')
    expect(startBody.input.duration).toBe(8)
    expect(startBody.input.output_format).toBe('mp3')
  })

  it('clamps duration into the 1–30s MusicGen range', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(MODEL_BODY))
      .mockResolvedValueOnce(jsonResponse({ id: 'pred456', status: 'starting' }))
    vi.stubGlobal('fetch', fetchMock)

    await startAudioGeneration('too long', undefined, { duration: 120 })

    expect(JSON.parse(fetchMock.mock.calls[1][1].body).input.duration).toBe(30)
  })

  it('translates the 402 insufficient-credit error into an actionable message', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(MODEL_BODY))
      .mockResolvedValueOnce(jsonResponse(
        { title: 'Insufficient credit', detail: 'You have insufficient credit to run this model.' },
        402,
      ))
    vi.stubGlobal('fetch', fetchMock)

    await expect(startAudioGeneration('prompt')).rejects.toThrow(/insufficient credit|top up/i)
  })

  it('throws without REPLICATE_API_TOKEN', async () => {
    delete process.env.REPLICATE_API_TOKEN
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(startAudioGeneration('prompt')).rejects.toThrow('REPLICATE_API_TOKEN is not set')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('getAudioPredictionStatus', () => {
  beforeEach(() => {
    process.env.REPLICATE_API_TOKEN = 'r8_test'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.REPLICATE_API_TOKEN
  })

  it('extracts the audio URL from a succeeded prediction', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      status: 'succeeded',
      output: 'https://replicate.delivery/audio.mp3',
    })))

    const result = await getAudioPredictionStatus('pred789', 'seed-key')

    expect(result.status).toBe('succeeded')
    expect(result.audioUrl).toBe('https://replicate.delivery/audio.mp3')
  })

  it('returns failed with the prediction error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      status: 'failed',
      error: 'OOM on worker',
    })))

    const result = await getAudioPredictionStatus('pred000')

    expect(result.status).toBe('failed')
    expect(result.error).toBe('OOM on worker')
  })
})
