import type { LLMProvider } from '@/lib/llm'
import { DEFAULT_OPENROUTER_MODEL } from '@/lib/openrouterModels'

export const DEFAULT_PROVIDER: LLMProvider = 'openrouter'

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  groq: 'Groq',
}

export const PROVIDER_DEFAULT_MODELS: Record<LLMProvider, string> = {
  openrouter: DEFAULT_OPENROUTER_MODEL,
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  groq: 'llama-3.3-70b-versatile',
}

export function getDefaultModelForProvider(provider: LLMProvider): string {
  return PROVIDER_DEFAULT_MODELS[provider]
}

export function getStoredModelPreference(): { provider: LLMProvider; model: string } {
  if (typeof window === 'undefined') {
    return { provider: DEFAULT_PROVIDER, model: getDefaultModelForProvider(DEFAULT_PROVIDER) }
  }

  const stored = localStorage.getItem('dreamscape_provider') as LLMProvider | null
  const provider = stored && stored in PROVIDER_LABELS ? stored : DEFAULT_PROVIDER
  const model = provider === 'openrouter'
    ? localStorage.getItem('dreamscape_or_model') || DEFAULT_OPENROUTER_MODEL
    : getDefaultModelForProvider(provider)

  return { provider, model }
}

export function saveModelPreference(provider: LLMProvider, model?: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('dreamscape_provider', provider)
  if (provider === 'openrouter') {
    localStorage.setItem('dreamscape_or_model', model?.trim() || DEFAULT_OPENROUTER_MODEL)
  }
}
