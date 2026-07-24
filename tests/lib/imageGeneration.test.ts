import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockGenerateText = vi.fn()
vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}))
vi.mock('@ai-sdk/gateway', () => ({
  gateway: (id: string) => ({ kind: 'gateway-model', id }),
}))

import { generateImageSmart } from '@/lib/image-generation'

const ENV_VARS = ['REPLICATE_API_TOKEN', 'OPENAI_API_KEY', 'AI_GATEWAY_API_KEY', 'VERCEL', 'REPLICATE_IMAGE_MODEL', 'GEMINI_IMAGE_MODEL', 'NANO_BANANA_MODEL', 'OPENAI_IMAGE_MODEL']

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const replicateStart = () =>
  jsonResponse({ id: 'pred_1', urls: { get: 'https://api.replicate.com/v1/predictions/pred_1' } })
const replicateSucceeded = () => jsonResponse({ status: 'succeeded', output: ['https://cdn.example/img.webp'] })

const geminiFile = () => ({
  files: [{ mediaType: 'image/png', uint8Array: new Uint8Array([1, 2, 3]) }],
})

beforeEach(() => {
  vi.clearAllMocks()
  for (const v of ENV_VARS) delete process.env[v]
})

afterEach(() => {
  vi.unstubAllGlobals()
  for (const v of ENV_VARS) delete process.env[v]
})

describe('generateImageSmart — Replicate (first in chain)', () => {
  it('generates via the official-model endpoint with NO version hash', async () => {
    process.env.REPLICATE_API_TOKEN = 'r8_test'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(replicateStart())
      .mockResolvedValueOnce(replicateSucceeded())
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateImageSmart('a dream of oceans')

    expect(result.provider).toBe('replicate')
    expect(result.model).toBe('black-forest-labs/flux-schnell')
    expect(result.url).toBe('https://cdn.example/img.webp')

    const [startUrl, startInit] = fetchMock.mock.calls[0]
    expect(startUrl).toBe('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions')
    const body = JSON.parse(startInit.body as string)
    expect(body).not.toHaveProperty('version') // regression: hardcoded fake hash caused 422s
    expect(body.input.prompt).toBe('a dream of oceans')

    const [pollUrl] = fetchMock.mock.calls[1]
    expect(pollUrl).toBe('https://api.replicate.com/v1/predictions/pred_1')
  })

  it('skips Replicate when REPLICATE_API_TOKEN is not set', async () => {
    process.env.AI_GATEWAY_API_KEY = 'gw_test'
    mockGenerateText.mockResolvedValue(geminiFile())
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateImageSmart('prompt')

    expect(result.provider).toBe('gemini')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('generateImageSmart — Gemini fallback', () => {
  it('falls back to Gemini when Replicate fails, returning base64', async () => {
    process.env.REPLICATE_API_TOKEN = 'r8_test'
    process.env.AI_GATEWAY_API_KEY = 'gw_test'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'boom' }, 422)))
    mockGenerateText.mockResolvedValue(geminiFile())

    const result = await generateImageSmart('prompt')

    expect(result.provider).toBe('gemini')
    expect(result.model).toBe('google/gemini-2.5-flash-image')
    expect(result.base64).toBe(Buffer.from([1, 2, 3]).toString('base64'))
    expect(result.mediaType).toBe('image/png')
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: { kind: 'gateway-model', id: 'google/gemini-2.5-flash-image' },
      prompt: 'prompt',
    })
  })

  it('skips Gemini when no AI Gateway auth is available', async () => {
    process.env.OPENAI_API_KEY = 'sk_test'
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ url: 'https://oai.example/x.png' }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateImageSmart('prompt')

    expect(result.provider).toBe('openai')
    expect(mockGenerateText).not.toHaveBeenCalled()
  })
})

describe('generateImageSmart — OpenAI fallback', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk_test'
  })

  it('sends NO response_format param (regression: gpt-image rejects it) and parses url shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ url: 'https://oai.example/x.png' }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateImageSmart('prompt')

    expect(result.provider).toBe('openai')
    expect(result.url).toBe('https://oai.example/x.png')
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body).not.toHaveProperty('response_format') // regression: caused 400s
    expect(body.model).toBe('gpt-image-1-mini')
  })

  it('parses the b64_json shape (gpt-image models)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ b64_json: 'QUJD' }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateImageSmart('prompt')

    expect(result.base64).toBe('QUJD')
    expect(result.url).toBeUndefined()
  })
})

describe('generateImageSmart — aggregate failure', () => {
  it('throws an error naming every provider that was attempted', async () => {
    process.env.REPLICATE_API_TOKEN = 'r8_test'
    process.env.AI_GATEWAY_API_KEY = 'gw_test'
    process.env.OPENAI_API_KEY = 'sk_test'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'nope' }, 500)))
    mockGenerateText.mockRejectedValue(new Error('gateway down'))

    await expect(generateImageSmart('prompt')).rejects.toThrow(/Replicate: .* \| Gemini: .* \| OpenAI: /)
  })

  it('reports missing-key providers in the aggregate error', async () => {
    await expect(generateImageSmart('prompt')).rejects.toThrow(/REPLICATE_API_TOKEN is not set/)
    await expect(generateImageSmart('prompt')).rejects.toThrow(/OPENAI_API_KEY is not set/)
  })
})
