import Anthropic from '@anthropic-ai/sdk'
import { pickOpenRouterModel, markOpenRouterFailure, markOpenRouterSuccess } from '@/lib/openrouter'

export type LLMProvider = 'anthropic' | 'openai' | 'groq' | 'openrouter'

export interface LLMOptions {
  provider?: LLMProvider
  model?: string
  maxTokens?: number
  json?: boolean
  apiKeys?: { openai?: string; anthropic?: string; openrouter?: string; groq?: string }
}

// Lazy singleton so tests can mock the module before instantiation
let _client: Anthropic | null = null
function anthropicClient() {
  if (!_client) _client = new Anthropic()
  return _client
}

async function tryCall(provider: LLMProvider, prompt: string, model: string | undefined, maxTokens: number, keys?: LLMOptions['apiKeys']): Promise<{ text: string; source: string } | null> {
  try {
    if (provider === 'openai') {
      const m = model || process.env.OPENAI_MODEL || 'gpt-4o-mini'
      return { text: await callOpenAI(prompt, m, maxTokens, keys?.openai), source: `openai:${m}` }
    }
    if (provider === 'groq') {
      const m = model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
      return { text: await callGroq(prompt, m, maxTokens, keys?.groq), source: `groq:${m}` }
    }
    if (provider === 'openrouter') {
      const m = model || pickOpenRouterModel()
      return { text: await callOpenRouter(prompt, m, maxTokens, keys?.openrouter), source: `openrouter:${m}` }
    }
    const m = model || 'claude-3-haiku-20240307'
    const client = keys?.anthropic ? new (Anthropic as any)({ apiKey: keys.anthropic }) : anthropicClient()
    const response = await client.messages.create({
      model: m,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return { text, source: `anthropic:${m}` }
  } catch {
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

// Backward-compat shim
export async function callLLM(prompt: string, opts: LLMOptions = {}): Promise<string> {
  const { text } = await callLLMWithSource(prompt, opts)
  return text
}

async function callOpenAI(prompt: string, model: string, maxTokens: number, overrideKey?: string): Promise<string> {
  const key = overrideKey || process.env.OPENAI_API_KEY
  if (!key) throw new Error('Missing OPENAI_API_KEY')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}

async function callGroq(prompt: string, model: string, maxTokens: number, overrideKey?: string): Promise<string> {
  const key = overrideKey || process.env.GROQ_API_KEY
  if (!key) throw new Error('Missing GROQ_API_KEY')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}

async function callOpenRouter(prompt: string, model: string, maxTokens: number, overrideKey?: string): Promise<string> {
  const key = overrideKey || process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('Missing OPENROUTER_API_KEY')
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dreamscape.quest',
      'X-Title': 'Dreamscape',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    markOpenRouterFailure(model)
    throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`)
  }
  markOpenRouterSuccess(model)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}
