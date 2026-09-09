export const OPENROUTER_AUTO = 'auto'

export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-oss-20b:free'

export const FALLBACK_OPENROUTER_MODELS = [
  DEFAULT_OPENROUTER_MODEL,
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
] as const

export const RECOMMENDED_OPENROUTER_MODELS = [
  DEFAULT_OPENROUTER_MODEL,
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'anthropic/claude-haiku-4-5',
  'google/gemini-2.5-flash',
  'openai/gpt-4.1-mini',
  'deepseek/deepseek-chat-v3.1',
  'qwen/qwen3-coder:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
] as const

type OpenRouterModelRecord = {
  id?: string
  name?: string
  created?: number
  context_length?: number
  supported_parameters?: string[]
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

export type RankedOpenRouterModel = OpenRouterModelRecord & {
  /** Resolved id (falls back to name) — safe to use after filtering. */
  resolvedId: string
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

/**
 * Budget tiers for "best cheap model right now". Prompt+completion $/M tokens.
 * These are intentionally loose ceilings — the ranking inside a tier is
 * recency-weighted so newer releases win, and the free tier always beats paid.
 */
const FREE_MAX_COST = 0
const CHEAP_MAX_COST = 0.5 // $/M combined — current budget sweet spot

export function isFreeModel(record: OpenRouterModelRecord): boolean {
  const id = record.id ?? record.name ?? ''
  const pricing = record.pricing ?? record.price
  const prompt = asNumber(pricing?.prompt)
  const completion = asNumber(pricing?.completion)
  if (Number.isFinite(prompt) && Number.isFinite(completion)) {
    return prompt === FREE_MAX_COST && completion === FREE_MAX_COST
  }
  return id.includes(':free')
}

/** Budget score: 3 = free, 2 = cheap paid, 1 = other. Higher wins. */
export function budgetScore(record: OpenRouterModelRecord): number {
  if (isFreeModel(record)) return 3
  const pricing = record.pricing ?? record.price
  const prompt = asNumber(pricing?.prompt)
  const completion = asNumber(pricing?.completion)
  if (!Number.isFinite(prompt) || !Number.isFinite(completion)) return 1
  const perMillion = (prompt + completion) * 1_000_000
  if (perMillion <= CHEAP_MAX_COST) return 2
  return 1
}

/**
 * Recency-weighted score for a single model. Shared by the /api/openrouter/models
 * ranking (what the picker shows) and the server-side auto-pick (what actually
 * gets called) so both surfaces agree.
 */
export function rankOpenRouterModel(model: OpenRouterModelRecord): number {
  const id = model.id ?? model.name ?? ''
  const curatedIndex = RECOMMENDED_OPENROUTER_MODELS.indexOf(id as (typeof RECOMMENDED_OPENROUTER_MODELS)[number])
  const budget = budgetScore(model)

  let score = 0
  // Budget dominates: free > cheap > everything else. Within a tier, recency decides.
  if (budget === 3) score += 1_000
  else if (budget === 2) score += 100
  // The old default stays sticky so pickers don't churn on every refresh.
  if (id === DEFAULT_OPENROUTER_MODEL) score += 50
  // Penalize the router meta-model: unpredictable, auto-routes anywhere.
  if (id === 'openrouter/free') score -= 2_000
  if (curatedIndex >= 0) score += 30 - curatedIndex
  if (typeof model.created === 'number') score += Math.min(model.created, 9_999_999_999) / 1_000_000
  return score
}

/**
 * Filter + rank the live catalog, annotated for callers that need more than ids.
 * `limit` caps the returned list; passing a larger limit is cheap.
 */
export function rankOpenRouterCatalog(payload: unknown, limit = 10): RankedOpenRouterModel[] {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] } | null)?.data)
    ? (payload as { data: unknown[] }).data
    : []

  return raw
    .filter((model): model is OpenRouterModelRecord => typeof model === 'object' && model !== null)
    .filter(supportsText)
    .map((model) => ({ ...model, resolvedId: model.id ?? model.name ?? '' }))
    .filter((model) => model.resolvedId !== '')
    .sort((a, b) => rankOpenRouterModel(b) - rankOpenRouterModel(a))
    .slice(0, limit)
}

export function normalizeOpenRouterModels(payload: unknown, limit = 10): string[] {
  const ranked = rankOpenRouterCatalog(payload, limit)
  const ids = ranked.map((m) => m.resolvedId)
  return Array.from(new Set([DEFAULT_OPENROUTER_MODEL, ...ids, ...RECOMMENDED_OPENROUTER_MODELS])).slice(0, limit)
}

export function shortOpenRouterModelName(model: string): string {
  const tail = model.split('/').pop() ?? model
  return tail.replace(':free', ' free')
}
