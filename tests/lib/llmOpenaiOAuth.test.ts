import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGenerateText = vi.hoisted(() => vi.fn())
vi.mock('ai', () => ({ generateText: mockGenerateText }))

const mockCreateOpenAIOAuth = vi.hoisted(() => vi.fn())
vi.mock('@openai-oauth/ai-sdk', () => ({ createOpenAIOAuth: mockCreateOpenAIOAuth }))

import { callLLMWithSource } from '@/lib/llm'

const SESSION = { accessToken: 'at', accountId: 'acct-1', refreshToken: 'rt' }

beforeEach(() => {
  mockGenerateText.mockReset()
  mockCreateOpenAIOAuth.mockReset()
  mockCreateOpenAIOAuth.mockReturnValue((modelId: string) => ({ modelId, provider: 'openai-oauth' }))
  mockGenerateText.mockResolvedValue({ text: 'hello' })
  delete process.env.OPENAI_API_KEY
  delete process.env.GROQ_API_KEY
  delete process.env.OPENAI_OAUTH_AUTH_JSON
})

describe('callLLMWithSource per-user ChatGPT OAuth', () => {
  it('uses the per-user session with the default Codex model', async () => {
    const { text, source } = await callLLMWithSource('hi', {
      provider: 'openai',
      apiKeys: { openaiOAuth: SESSION },
    })
    expect(text).toBe('hello')
    expect(source).toBe('openai-oauth-user:gpt-5.4-mini')
  })

  it('honors the user-picked Codex model', async () => {
    const { source } = await callLLMWithSource('hi', {
      provider: 'openai',
      model: 'gpt-5.6-terra',
      apiKeys: { openaiOAuth: SESSION },
    })
    expect(source).toBe('openai-oauth-user:gpt-5.6-terra')
  })

  it('prefers a BYO API key over the OAuth session', async () => {
    const { source } = await callLLMWithSource('hi', {
      provider: 'openai',
      apiKeys: { openai: 'sk-test', openaiOAuth: SESSION },
    })
    expect(source).toBe('openai:gpt-4.1-mini')
    expect(mockCreateOpenAIOAuth).not.toHaveBeenCalled()
  })

  it('falls back to groq default model when the OAuth call fails (no model leakage across providers)', async () => {
    process.env.GROQ_API_KEY = 'gsk-test'
    mockGenerateText
      .mockRejectedValueOnce(new Error('codex backend down'))
      .mockResolvedValueOnce({ text: 'groq reply' })

    const { text, source } = await callLLMWithSource('hi', {
      provider: 'openai',
      model: 'gpt-5.6-terra',
      apiKeys: { openaiOAuth: SESSION },
    })
    expect(text).toBe('groq reply')
    // groq must use ITS default, not the Codex model id
    expect(source).toBe('groq:openai/gpt-oss-120b')
  })
})
