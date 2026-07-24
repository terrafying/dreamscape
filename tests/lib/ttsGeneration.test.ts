import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const audioResponse = () => new Response(new Uint8Array([9, 9, 9]).buffer, { status: 200 })

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  delete process.env.ELEVENLABS_API_KEY
  delete process.env.REPLICATE_API_TOKEN
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.ELEVENLABS_API_KEY
  delete process.env.REPLICATE_API_TOKEN
})

describe('generateTTSSmart — Replicate fallback', () => {
  it('uses the official MiniMax endpoint with NO version hash', async () => {
    process.env.REPLICATE_API_TOKEN = 'r8_test'
    const { generateTTSSmart } = await import('@/lib/tts-generation')

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: 'p1', urls: { get: 'https://api.replicate.com/v1/predictions/p1' } }))
      .mockResolvedValueOnce(jsonResponse({ status: 'succeeded', output: 'https://cdn.example/speech.mp3' }))
      .mockResolvedValueOnce(audioResponse())
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateTTSSmart('sleep now', 'some-elevenlabs-voice')

    expect(result.provider).toBe('replicate')
    expect(result.model).toBe('minimax/speech-02-hd')
    expect(result.audioBuffer.length).toBe(3)

    const [startUrl, startInit] = fetchMock.mock.calls[0]
    expect(startUrl).toBe('https://api.replicate.com/v1/models/minimax/speech-02-hd/predictions')
    const body = JSON.parse(startInit.body as string)
    expect(body).not.toHaveProperty('version') // regression: Coqui hash pointed at a delisted model
    expect(body.input.text).toBe('sleep now')
    expect(body.input.voice_id).toBe('English_Wiselady')
  })

  it('throws when no TTS provider is configured', async () => {
    const { generateTTSSmart } = await import('@/lib/tts-generation')
    await expect(generateTTSSmart('hi', 'voice')).rejects.toThrow(/No TTS provider available/)
  })
})
