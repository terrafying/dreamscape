'use client'

import { useEffect, useState } from 'react'
import OpenRouterModelField from '@/components/OpenRouterModelField'
import { DEFAULT_OPENROUTER_MODEL } from '@/lib/openrouterModels'
import {
  DEFAULT_PROVIDER,
  getDefaultModelForProvider,
  getStoredModelPreference,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_LABELS,
  saveModelPreference,
} from '@/lib/modelPreferences'
import type { LLMProvider } from '@/lib/llm'

export default function ModelDefaultsPanel() {
  const providerSelectId = 'model-default-provider'
  const [provider, setProvider] = useState<LLMProvider>(DEFAULT_PROVIDER)
  const [orModel, setOrModel] = useState(DEFAULT_OPENROUTER_MODEL)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = getStoredModelPreference()
    setProvider(stored.provider)
    setOrModel(localStorage.getItem('dreamscape_or_model') || DEFAULT_OPENROUTER_MODEL)
  }, [])

  const save = () => {
    const next = provider === 'openrouter'
      ? orModel.trim() || DEFAULT_OPENROUTER_MODEL
      : getDefaultModelForProvider(provider)
    saveModelPreference(provider, next)
    if (provider === 'openrouter') setOrModel(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  const usingKeys = (() => {
    if (typeof window === 'undefined') return false
    try { const k = JSON.parse(localStorage.getItem('dreamscape_api_keys') || '{}'); return !!(k.openai || k.openrouter || k.anthropic || k.groq || k.deepgram) } catch { return false }
  })()

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: 'var(--text)' }}>Model Defaults</div>
        {usingKeys && (
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}>Using your API keys</span>
        )}
      </div>
      <div className="grid gap-2">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
          Choose the default provider Dreamscape should prefer. OpenRouter still gives the widest coverage, but your saved keys can route calls through the others too.
        </p>
        <label htmlFor={providerSelectId} className="text-xs" style={{ color: 'var(--muted)' }}>Default provider</label>
        <select
          id={providerSelectId}
          value={provider}
          onChange={(event) => setProvider(event.target.value as LLMProvider)}
          className="rounded px-3 py-2 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          {(['openrouter', 'openai', 'anthropic', 'groq'] as LLMProvider[]).map((item) => (
            <option key={item} value={item}>{PROVIDER_LABELS[item]}</option>
          ))}
        </select>
        {provider === 'openrouter' ? (
          <OpenRouterModelField
            value={orModel}
            onChange={setOrModel}
            hint="Stored locally as your preferred OpenRouter override."
          />
        ) : (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            Default model for {PROVIDER_LABELS[provider]}: <span style={{ color: 'var(--text)' }}>{PROVIDER_DEFAULT_MODELS[provider]}</span>
          </p>
        )}
        <div className="flex justify-end pt-1">
          <button onClick={save} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--violet)', color: '#07070f' }}>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
