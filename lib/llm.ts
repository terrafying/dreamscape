import Anthropic from '@anthropic-ai/sdk'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { pickOpenRouterModel, markOpenRouterFailure, markOpenRouterSuccess } from '@/lib/openrouter'

export type LLMProvider = 'anthropic' | 'openai' | 'groq' | 'openrouter'

export interface LLMOptions {
  provider?: LLMProvider
  model?: string
  maxTokens?: number
  json?: boolean
  apiKeys?: { openai?: string; anthropic?: string; openrouter?: string; groq?: string }
}

function getGroqProvider(apiKey: string) {
  return createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey })
}

function getOpenRouterProvider(apiKey: string) {
  return createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dreamscape.quest',
      'X-Title': 'Dreamscape',
    },
  })
}

let _anthropicClient: Anthropic | null = null
function getAnthropicClient(apiKey?: string) {
  if (apiKey) return new Anthropic({ apiKey })
  if (!_anthropicClient) _anthropicClient = new Anthropic()
  return _anthropicClient
}

async function tryCall(provider: LLMProvider, prompt: string, model: string | undefined, maxTokens: number, keys?: LLMOptions['apiKeys']): Promise<{ text: string; source: string } | null> {
  try {
    if (provider === 'openai') {
      const m = model || process.env.OPENAI_MODEL || 'gpt-4o-mini'
      const key = keys?.openai || process.env.OPENAI_API_KEY
      if (!key) throw new Error('Missing OPENAI_API_KEY')
      const openaiProvider = createOpenAI({ apiKey: key })
      const result = await generateText({
        model: openaiProvider(m),
        prompt,
        maxOutputTokens: maxTokens,
      })
      return { text: result.text, source: `openai:${m}` }
    }
    if (provider === 'groq') {
      const m = model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
      const key = keys?.groq || process.env.GROQ_API_KEY
      if (!key) throw new Error('Missing GROQ_API_KEY')
      const result = await generateText({
        model: getGroqProvider(key)(m),
        prompt,
        maxOutputTokens: maxTokens,
      })
      return { text: result.text, source: `groq:${m}` }
    }
    if (provider === 'openrouter') {
      const m = model || pickOpenRouterModel()
      const key = keys?.openrouter || process.env.OPENROUTER_API_KEY
      if (!key) throw new Error('Missing OPENROUTER_API_KEY')
      const result = await generateText({
        model: getOpenRouterProvider(key)(m),
        prompt,
        maxOutputTokens: maxTokens,
      })
      markOpenRouterSuccess(m)
      return { text: result.text, source: `openrouter:${m}` }
    }
    const m = model || 'claude-3-haiku-20240307'
    const client = getAnthropicClient(keys?.anthropic)
    const response = await client.messages.create({
      model: m,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return { text, source: `anthropic:${m}` }
  } catch (err) {
    if (provider === 'openrouter') markOpenRouterFailure(model || pickOpenRouterModel())
    return null
  }
}

export async function callLLMWithSource(prompt: string, opts: LLMOptions = {}): Promise<{ text: string; source: string }> {
  const { provider = 'groq', model, maxTokens = 2000 } = opts

  const chain: LLMProvider[] = provider === 'anthropic'
    ? ['anthropic', 'groq', 'openai', 'openrouter']
    : provider === 'openai'
    ? ['openai', 'groq', 'openrouter', 'anthropic']
    : provider === 'openrouter'
    ? ['openrouter', 'groq', 'openai', 'anthropic']
    : ['groq', 'openai', 'openrouter', 'anthropic']

  const tried = new Set<LLMProvider>()
  for (const p of chain) {
    if (tried.has(p)) continue
    tried.add(p)
    const result = await tryCall(p, prompt, model, maxTokens, opts.apiKeys)
    if (result) return result
  }

  throw new Error('All LLM providers failed')
}

export async function callLLM(prompt: string, opts: LLMOptions = {}): Promise<string> {
  const { text } = await callLLMWithSource(prompt, opts)
  return text
}
