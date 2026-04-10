'use client'

import { useEffect, useState } from 'react'
import type { LLMProvider } from '@/lib/llm'
import OpenRouterModelField from '@/components/OpenRouterModelField'
import { DEFAULT_OPENROUTER_MODEL, shortOpenRouterModelName } from '@/lib/openrouterModels'
import {
  DEFAULT_PROVIDER,
  getDefaultModelForProvider,
  getStoredModelPreference,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_LABELS,
  saveModelPreference,
} from '@/lib/modelPreferences'

interface ProviderSettingsProps {
  onChange?: (provider: LLMProvider, model: string | undefined) => void
}

export default function ProviderSettings({ onChange }: ProviderSettingsProps) {
  const [provider, setProvider] = useState<LLMProvider>(DEFAULT_PROVIDER)
  const [orModel, setOrModel] = useState(DEFAULT_OPENROUTER_MODEL)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = getStoredModelPreference()
    setProvider(stored.provider)
    setOrModel(localStorage.getItem('dreamscape_or_model') || DEFAULT_OPENROUTER_MODEL)
    onChange?.(stored.provider, stored.model)
  }, [onChange])

  const saveProvider = (nextProvider: LLMProvider) => {
    const nextModel = nextProvider === 'openrouter' ? orModel : getDefaultModelForProvider(nextProvider)
    setProvider(nextProvider)
    saveModelPreference(nextProvider, nextModel)
    onChange?.(nextProvider, nextModel)
  }

  const saveOpenRouterModel = (nextModel: string) => {
    const value = nextModel.trim() || DEFAULT_OPENROUTER_MODEL
    setOrModel(value)
    saveModelPreference('openrouter', value)
    onChange?.('openrouter', value)
  }

  const label = provider === 'openrouter'
    ? `OpenRouter · ${shortOpenRouterModelName(orModel)}`
    : `${PROVIDER_LABELS[provider]} · ${PROVIDER_DEFAULT_MODELS[provider]}`

  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-label="Model provider settings"
        onClick={() => setExpanded((current) => !current)}
        className="flex items-center gap-2 text-xs transition-opacity hover:opacity-80"
        style={{ color: 'var(--muted)' }}
      >
        <span>{label}</span>
        <span style={{ fontSize: '9px' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div
          className="rounded-xl p-4 space-y-4"
          style={{ background: 'rgba(15,15,26,0.8)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            AI Model
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['openrouter', 'openai', 'anthropic', 'groq'] as LLMProvider[]).map((item) => {
              const active = item === provider
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => saveProvider(item)}
                  className="rounded-lg px-3 py-2 text-xs text-left transition-opacity hover:opacity-90"
                  style={{
                    background: active ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(167,139,250,0.35)' : 'var(--border)'}`,
                    color: active ? 'var(--text)' : 'var(--muted)',
                  }}
                >
                  {PROVIDER_LABELS[item]}
                </button>
              )
            })}
          </div>
          {provider === 'openrouter' ? (
            <>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                OpenRouter covers the broadest model set. Pick from the current top recommendations or enter a custom id.
              </p>
              <OpenRouterModelField value={orModel} onChange={saveOpenRouterModel} />
            </>
          ) : (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              Uses your <span style={{ color: 'var(--text)' }}>{PROVIDER_LABELS[provider]}</span> key with the default model <span style={{ color: 'var(--text)' }}>{PROVIDER_DEFAULT_MODELS[provider]}</span>.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
