import type { LLMProvider } from '@/lib/llm'
import { DEFAULT_OPENROUTER_MODEL, OPENROUTER_AUTO } from '@/lib/openrouterModels'
import { DEFAULT_TEXT_MODELS } from '@/lib/models'

export const DEFAULT_PROVIDER: LLMProvider = 'openrouter'

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  groq: 'Groq',
}

export const PROVIDER_DEFAULT_MODELS: Record<LLMProvider, string> = {
  openrouter: OPENROUTER_AUTO,
  openai: DEFAULT_TEXT_MODELS.openai,
  anthropic: DEFAULT_TEXT_MODELS.anthropic,
  groq: DEFAULT_TEXT_MODELS.groq,
}

export function getDefaultModelForProvider(provider: LLMProvider): string {
  return PROVIDER_DEFAULT_MODELS[provider]
}

export function isAutoModel(model: string | undefined | null): boolean {
  return !model?.trim() || model.trim() === OPENROUTER_AUTO
}

export function getStoredModelPreference(): { provider: LLMProvider; model: string } {
  if (typeof window === 'undefined') {
    return { provider: DEFAULT_PROVIDER, model: getDefaultModelForProvider(DEFAULT_PROVIDER) }
  }

  const stored = localStorage.getItem('dreamscape_provider') as LLMProvider | null
  const provider = stored && stored in PROVIDER_LABELS ? stored : DEFAULT_PROVIDER
  const model = provider === 'openrouter'
    ? localStorage.getItem('dreamscape_or_model') || getDefaultModelForProvider(provider)
    : getDefaultModelForProvider(provider)

  return { provider, model }
}

export function saveModelPreference(provider: LLMProvider, model?: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('dreamscape_provider', provider)
  if (provider === 'openrouter') {
    // Persist the literal 'auto' sentinel (or clear a stale entry) — resolution
    // happens server-side against the live catalog.
    const next = model?.trim()
    if (next) localStorage.setItem('dreamscape_or_model', next)
    else localStorage.removeItem('dreamscape_or_model')
  }
}
