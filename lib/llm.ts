import Anthropic from '@anthropic-ai/sdk'

export type LLMProvider = 'anthropic' | 'ollama' | 'openai' | 'openrouter'

export interface LLMOptions {
  provider?: LLMProvider
  model?: string
  maxTokens?: number
  json?: boolean // request JSON-mode output (Ollama format:'json', Anthropic via prompt)
  apiKeys?: { openai?: string; anthropic?: string; openrouter?: string }
}

// Lazy singleton so tests can mock the module before instantiation
let _client: Anthropic | null = null
function anthropicClient() {
  if (!_client) _client = new Anthropic()
  return _client
}

export async function callLLMWithSource(prompt: string, opts: LLMOptions = {}): Promise<{ text: string; source: string }> {
  const { provider = 'anthropic', model, maxTokens = 2000, json = false } = opts

  try {
    if (provider === 'ollama') {
      const m = model || process.env.OLLAMA_MODEL || 'qwen2.5:32b'
      return { text: await callOllama(prompt, m, maxTokens, json), source: `ollama:${m}` }
    }
    if (provider === 'openai') {
      const m = model || process.env.OPENAI_MODEL || 'gpt-4o-mini'
      return { text: await callOpenAI(prompt, m, maxTokens, opts.apiKeys?.openai), source: `openai:${m}` }
    }
    if (provider === 'openrouter') {
      const m = model || process.env.OPENROUTER_MODEL || 'openrouter/free'
      const text = await callOpenRouter(prompt, m, maxTokens, opts.apiKeys?.openrouter)
      return { text, source: `openrouter:${m}` }
    }

    // Anthropic default
    const m = model || 'claude-3-haiku-20240307'
    const client = opts.apiKeys?.anthropic ? new (Anthropic as any)({ apiKey: opts.apiKeys.anthropic }) : anthropicClient()
    const response = await client.messages.create({
      model: m,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return { text, source: `anthropic:${m}` }
  } catch (err: any) {
    const msg = String(err?.message || err)
    // Fallbacks on quota/unauthorized
    if (/Rate limit|insufficient|quota|Unauthorized|401|429/i.test(msg)) {
      if (process.env.OPENAI_API_KEY) {
        try { const m = model || 'gpt-4o-mini'; return { text: await callOpenAI(prompt, m, maxTokens), source: `openai:${m}` } } catch {}
      }
      if (process.env.OPENROUTER_API_KEY) {
        try { const m = model || 'openrouter/free'; return { text: await callOpenRouter(prompt, m, maxTokens), source: `openrouter:${m}` } } catch {}
      }
      if (process.env.OLLAMA_BASE_URL) {
        try { const m = process.env.OLLAMA_MODEL || 'qwen2.5:32b'; return { text: await callOllama(prompt, m, maxTokens, json), source: `ollama:${m}` } } catch {}
      }
    }
    throw err
  }
}

// Backward-compat shim
export async function callLLM(prompt: string, opts: LLMOptions = {}): Promise<string> {
  const { text } = await callLLMWithSource(prompt, opts)
  return text
}

async function callOllama(
  prompt: string,
  model: string,
  maxTokens: number,
  json: boolean
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
    options: { num_predict: maxTokens },
  }
  if (json) body.format = 'json'

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000), // 3 min — large models are slow on first run
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Ollama error (${res.status}): ${err || 'is Ollama running? brew install ollama && ollama serve'}`)
  }

  const data = (await res.json()) as { message?: { content?: string } }
  return data.message?.content ?? ''
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
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}

import { pickOpenRouterModel, markOpenRouterFailure, markOpenRouterSuccess } from '@/lib/openrouter'

async function callOpenRouter(prompt: string, model: string, maxTokens: number, overrideKey?: string): Promise<string> {
  const key = overrideKey || process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('Missing OPENROUTER_API_KEY')
  const chosen = model === 'openrouter/free' || !model ? pickOpenRouterModel() : model
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dreamscape.quest',
      'X-Title': 'Dreamscape',
    },
    body: JSON.stringify({
      model: chosen,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) {
    markOpenRouterFailure(chosen)
    throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`)
  }
  markOpenRouterSuccess(chosen)
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}
