export const DEFAULT_OPENROUTER_MODEL = 'google/gemma-4-31b-it:free'

export const FALLBACK_OPENROUTER_MODELS = [
  DEFAULT_OPENROUTER_MODEL,
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-120b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-20b:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'qwen/qwen3-coder:free',
] as const

export const RECOMMENDED_OPENROUTER_MODELS = [
  DEFAULT_OPENROUTER_MODEL,
  'anthropic/claude-opus-4.1',
  'anthropic/claude-sonnet-4',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'openai/gpt-4.1',
  'openai/gpt-4.1-mini',
  'openai/o4-mini',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'deepseek/deepseek-chat-v3.1',
  'deepseek/deepseek-r1',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'qwen/qwen3-coder:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-26b-a4b-it:free',
] as const

type OpenRouterModelRecord = {
  id?: string
  name?: string
  created?: number
  architecture?: {
    input_modalities?: string[]
    output_modalities?: string[]
  }
  pricing?: {
    prompt?: number | string
    completion?: number | string
  }
  price?: {
    prompt?: number | string
    completion?: number | string
  }
}

function asNumber(value: number | string | undefined): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : Number.NaN
  }
  return Number.NaN
}

function supportsText(model: OpenRouterModelRecord): boolean {
  const input = model.architecture?.input_modalities ?? []
  const output = model.architecture?.output_modalities ?? []
  if (!input.length && !output.length) return true
  return input.includes('text') && output.includes('text')
}

function rankModel(model: OpenRouterModelRecord): number {
  const id = model.id ?? model.name ?? ''
  const curatedIndex = RECOMMENDED_OPENROUTER_MODELS.indexOf(id as (typeof RECOMMENDED_OPENROUTER_MODELS)[number])
  const pricing = model.pricing ?? model.price
  const prompt = asNumber(pricing?.prompt)
  const completion = asNumber(pricing?.completion)
  const isFree = id.includes(':free') || (prompt === 0 && completion === 0)

  let score = 0
  if (curatedIndex >= 0) score += 10_000 - curatedIndex * 100
  if (isFree) score += 1_000
  if (id === 'openrouter/free') score -= 2_000
  if (typeof model.created === 'number') score += Math.min(model.created, 9_999_999_999) / 10_000_000
  return score
}

export function normalizeOpenRouterModels(payload: unknown, limit = 10): string[] {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] } | null)?.data)
    ? (payload as { data: unknown[] }).data
    : []

  const ids = raw
    .filter((model): model is OpenRouterModelRecord => typeof model === 'object' && model !== null)
    .filter(supportsText)
    .sort((a, b) => rankModel(b) - rankModel(a))
    .map((model) => model.id ?? model.name ?? '')
    .filter(Boolean)

  return Array.from(new Set([DEFAULT_OPENROUTER_MODEL, ...ids, ...RECOMMENDED_OPENROUTER_MODELS])).slice(0, limit)
}

export function shortOpenRouterModelName(model: string): string {
  const tail = model.split('/').pop() ?? model
  return tail.replace(':free', ' free')
}
