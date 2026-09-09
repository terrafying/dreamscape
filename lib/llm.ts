import Anthropic from '@anthropic-ai/sdk'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pickOpenRouterModel, markOpenRouterFailure, markOpenRouterSuccess } from '@/lib/openrouter'
import { textModel } from '@/lib/models'
import { isAutoModel } from '@/lib/modelPreferences'
import type { OpenAIOAuthSessionData } from '@/lib/openaiOAuthShared'
import { trackGeneration, captureError } from '@/lib/observability'

export type LLMProvider = 'anthropic' | 'openai' | 'groq' | 'openrouter'

export interface LLMOptions {
  provider?: LLMProvider
  model?: string
  maxTokens?: number
  json?: boolean
  apiKeys?: { openai?: string; anthropic?: string; openrouter?: string; groq?: string; openaiOAuth?: OpenAIOAuthSessionData }
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

// Default model for the ChatGPT OAuth path. The Codex backend only serves its
// own model set (gpt-5.x family), so this is intentionally separate from the
// API-key default and ignores any user-supplied model preference.
// Registry: lib/models.ts (OPENAI_OAUTH_MODEL env override).
const OPENAI_OAUTH_DEFAULT_MODEL = textModel.openaiOauth()

function codexAuthFileCandidates(): string[] {
  const candidates: string[] = []
  if (process.env.CODEX_HOME) candidates.push(path.join(process.env.CODEX_HOME, 'auth.json'))
  candidates.push(path.join(os.homedir(), '.codex', 'auth.json'))
  return candidates
}

// Fast, synchronous check so fallback chains can skip OpenAI without paying
// for dynamic imports when no credentials exist at all.
function hasOpenAIOAuthCredentials(): boolean {
  if (process.env.OPENAI_OAUTH_AUTH_JSON) return true
  return codexAuthFileCandidates().some((p) => fs.existsSync(p))
}

async function getOpenAIOAuthProvider() {
  const [{ createOpenAIOAuth }, { openaiCredentials }] = await Promise.all([
    import('@openai-oauth/ai-sdk'),
    import('@openai-oauth/local'),
  ])
  // Serverless hosts (Vercel) can't run `npx openai-oauth login`, so the auth
  // JSON can be supplied via env and materialized to a tmp file. Note: OAuth
  // refresh tokens rotate, so on serverless the env value needs occasional
  // re-copying from ~/.codex/auth.json; persistent hosts self-maintain.
  const authJson = process.env.OPENAI_OAUTH_AUTH_JSON
  if (authJson) {
    const tmp = path.join(os.tmpdir(), 'dreamscape-openai-oauth.json')
    try {
      if (!fs.existsSync(tmp) || fs.readFileSync(tmp, 'utf8') !== authJson) {
        fs.writeFileSync(tmp, authJson, { mode: 0o600 })
      }
    } catch { /* read-only fs — try anyway with a fresh write */ fs.writeFileSync(tmp, authJson) }
    return createOpenAIOAuth(openaiCredentials({ authFilePath: tmp }))
  }
  return createOpenAIOAuth(openaiCredentials())
}

async function tryCall(provider: LLMProvider, prompt: string, model: string | undefined, maxTokens: number, keys?: LLMOptions['apiKeys']): Promise<{ text: string; source: string } | null> {
  try {
    if (provider === 'openai') {
      const key = keys?.openai || process.env.OPENAI_API_KEY
      if (key) {
        const m = model || textModel.openai()
        const openaiProvider = createOpenAI({ apiKey: key })
        const result = await generateText({
          model: openaiProvider(m),
          prompt,
          maxOutputTokens: maxTokens,
        })
        return { text: result.text, source: `openai:${m}` }
      }
      // Per-user ChatGPT OAuth (BYO session, sent as x-openai-oauth header).
      // Requested models are only honored because the client resolves them
      // against the Codex catalog (lib/openaiOAuth.resolveOpenAIModel).
      if (keys?.openaiOAuth) {
        const m = model || OPENAI_OAUTH_DEFAULT_MODEL
        const { createOpenAIOAuth } = await import('@openai-oauth/ai-sdk')
        const session = keys.openaiOAuth
        const oauthProvider = createOpenAIOAuth({ kind: 'openai-oauth', getSession: async () => session })
        const result = await generateText({
          model: oauthProvider(m),
          prompt,
          maxOutputTokens: maxTokens,
        })
        return { text: result.text, source: `openai-oauth-user:${m}` }
      }
      // No API key — fall back to ChatGPT OAuth (free via the operator's
      // ChatGPT account through Codex credentials). Requested models are
      // ignored: the Codex backend only serves its own model set.
      if (!hasOpenAIOAuthCredentials()) throw new Error('Missing OPENAI_API_KEY and no ChatGPT OAuth credentials')
      const m = OPENAI_OAUTH_DEFAULT_MODEL
      const oauthProvider = await getOpenAIOAuthProvider()
      const result = await generateText({
        model: oauthProvider(m),
        prompt,
        maxOutputTokens: maxTokens,
      })
      return { text: result.text, source: `openai-oauth:${m}` }
    }
    if (provider === 'groq') {
      const m = model || textModel.groq()
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
    const m = model || textModel.anthropic()
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
  const { provider = 'openrouter', model, maxTokens = 2000 } = opts
  const startedAt = Date.now()

  // OpenAI rejoins chains: with ChatGPT OAuth configured it's a free
  // high-quality fallback; without credentials it fails fast and is skipped.
  const chain: LLMProvider[] = provider === 'anthropic'
    ? ['anthropic', 'groq', 'openrouter', 'openai']
    : provider === 'openai'
    ? ['openai', 'groq', 'openrouter', 'anthropic']
    : provider === 'groq'
    ? ['groq', 'openrouter', 'openai', 'anthropic']
    : ['openrouter', 'groq', 'openai', 'anthropic']

  const tried = new Set<LLMProvider>()
  for (const p of chain) {
    if (tried.has(p)) continue
    tried.add(p)
    // Only the requested provider honors the explicit model — provider-specific
    // ids (e.g. Codex gpt-5.x or openrouter slugs) would 404 on other backends,
    // so fallback steps use their own defaults instead. 'auto' / empty resolves
    // through each provider's own default path (pickOpenRouterModel's live
    // catalog ranking for OpenRouter).
    const requested = p === provider ? (isAutoModel(model) ? undefined : model) : undefined
    const result = await tryCall(p, prompt, requested, maxTokens, opts.apiKeys)
    if (result) {
      trackGeneration({ kind: 'text', provider: p, model: result.source.split(':').slice(1).join(':'), outcome: 'success', durationMs: Date.now() - startedAt })
      return result
    }
  }

  trackGeneration({ kind: 'text', provider, model, outcome: 'error', durationMs: Date.now() - startedAt })
  await captureError('llm.chain', new Error('All LLM providers failed'), { requestedProvider: provider, requestedModel: model })
  throw new Error('All LLM providers failed')
}

export async function callLLM(prompt: string, opts: LLMOptions = {}): Promise<string> {
  const { text } = await callLLMWithSource(prompt, opts)
  return text
}
