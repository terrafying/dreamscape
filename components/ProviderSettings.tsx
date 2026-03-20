'use client'

import { useState, useEffect } from 'react'
import type { LLMProvider } from '@/lib/llm'

interface ProviderSettingsProps {
  onChange?: (provider: LLMProvider, model: string | undefined) => void
}

const RECOMMENDED: { name: string; sizeGB: number; note: string }[] = [
  { name: 'qwen2.5:32b',         sizeGB: 19, note: 'best quality' },
  { name: 'gemma3:27b',          sizeGB: 17, note: 'good quality' },
  { name: 'mistral-small3.1:24b',sizeGB: 14, note: 'faster' },
  { name: 'qwen2.5:14b',         sizeGB:  9, note: 'lightweight' },
]

export default function ProviderSettings({ onChange }: ProviderSettingsProps) {
  const [provider, setProvider] = useState<LLMProvider>('openrouter')
  const [model, setModel] = useState('qwen2.5:32b')
  const [orModel, setOrModel] = useState('openrouter/free')
  const [expanded, setExpanded] = useState(false)
  const [availableModels, setAvailableModels] = useState<{ name: string; sizeGB: number }[]>([])
  const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'running' | 'offline'>('unknown')
  const [loadingModels, setLoadingModels] = useState(false)

  useEffect(() => {
    const p = (localStorage.getItem('dreamscape_provider') as LLMProvider) || 'openrouter'
    const m = localStorage.getItem('dreamscape_model') || 'qwen2.5:32b'
    const orm = localStorage.getItem('dreamscape_or_model') || 'openrouter/free'
    setProvider(p)
    setModel(m)
    setOrModel(orm)
    onChange?.(p, p === 'ollama' ? m : p === 'openrouter' ? orm : undefined)
  }, [])

  const save = (p: LLMProvider, m: string) => {
    localStorage.setItem('dreamscape_provider', p)
    if (p === 'ollama') localStorage.setItem('dreamscape_model', m)
    if (p === 'openrouter') localStorage.setItem('dreamscape_or_model', m)
    setProvider(p)
    if (p === 'ollama') setModel(m)
    if (p === 'openrouter') setOrModel(m)
    onChange?.(p, p === 'ollama' ? m : p === 'openrouter' ? m : undefined)
  }

  const fetchModels = async () => {
    setLoadingModels(true)
    try {
      const res = await fetch('/api/models')
      const data = await res.json() as { models: { name: string; sizeGB: number }[]; running: boolean }
      setAvailableModels(data.models)
      setOllamaStatus(data.running ? 'running' : 'offline')
    } catch {
      setOllamaStatus('offline')
    } finally {
      setLoadingModels(false)
    }
  }

  const label = provider === 'anthropic'
    ? '☁ Anthropic (auto)'
    : provider === 'openai'
    ? '☁ OpenAI (auto)'
    : provider === 'openrouter'
    ? `☁ OpenRouter (${orModel})`
    : `◉ ${model}`

  return (
    <div className="space-y-2">
      {/* Collapsed summary */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-xs transition-opacity hover:opacity-80"
        style={{ color: 'var(--muted)' }}
      >
        <span>{label}</span>
        <span style={{ fontSize: '9px' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="rounded-xl p-4 space-y-4"
          style={{ background: 'rgba(15,15,26,0.8)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            AI Model
          </div>

          {/* Provider toggle */}
          <div className="flex gap-2 flex-wrap">
            {(['anthropic', 'openai', 'openrouter'] as LLMProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => save(p, p === 'openrouter' ? orModel : p === 'ollama' ? model : p === 'openai' ? 'gpt-4o-mini' : 'claude-3-haiku-20240307')}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: provider === p ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${provider === p ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
                  color: provider === p ? 'var(--violet)' : 'var(--muted)',
                }}
              >
                {p === 'anthropic' ? '☁ Anthropic API' : p === 'openai' ? '☁ OpenAI' : '☁ OpenRouter'}
              </button>
            ))}
          </div>

          {/* Anthropic info */}
          {provider === 'anthropic' && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Uses Anthropic via your <span style={{ color: 'var(--violet)' }}>ANTHROPIC_API_KEY</span> with in-app fallbacks if rate-limited.
            </p>
          )}

          {/* OpenAI info */}
          {provider === 'openai' && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Uses OpenAI via your <span style={{ color: 'var(--violet)' }}>OPENAI_API_KEY</span>. Model defaults to <span style={{ color: 'var(--text)' }}>gpt-4o-mini</span>.
            </p>
          )}

          {/* OpenRouter config */}
          {provider === 'openrouter' && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Uses OpenRouter via your <span style={{ color: 'var(--violet)' }}>OPENROUTER_API_KEY</span>. Auto-rotates free models with cool-down on failures.
              </p>
              <div className="space-y-1">
                <label className="text-xs" style={{ color: 'var(--muted)' }}>Model override</label>
                <input
                  type="text"
                  value={orModel}
                  onChange={(e) => save('openrouter', e.target.value)}
                  placeholder="openrouter/free"
                  className="w-full rounded-lg px-3 py-1.5 text-xs font-mono outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>
          )}

          {/* Ollama section removed for mobile-first simplicity */}
        </div>
      )}
    </div>
  )
}
