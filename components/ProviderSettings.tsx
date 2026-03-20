'use client'

import { useState, useEffect } from 'react'
import type { LLMProvider } from '@/lib/llm'
import { isPremium } from '@/lib/entitlements'

interface ProviderSettingsProps {
  onChange?: (provider: LLMProvider, model: string | undefined) => void
}

const PREMIUM_PROVIDERS: LLMProvider[] = ['anthropic', 'openai']

export default function ProviderSettings({ onChange }: ProviderSettingsProps) {
  const [provider, setProvider] = useState<LLMProvider>('groq')
  const [orModel, setOrModel] = useState('nvidia/nemotron-3-super-120b-a12b:free')
  const [expanded, setExpanded] = useState(false)
  const [premium, setPremium] = useState(false)

  useEffect(() => {
    setPremium(isPremium())
    const p = (localStorage.getItem('dreamscape_provider') as LLMProvider) || 'groq'
    const orm = localStorage.getItem('dreamscape_or_model') || 'nvidia/nemotron-3-super-120b-a12b:free'
    setProvider(p)
    setOrModel(orm)
    onChange?.(p, p === 'openrouter' ? orm : undefined)
  }, [])

  const switchToGroq = () => {
    localStorage.setItem('dreamscape_provider', 'groq')
    setProvider('groq')
    onChange?.('groq', 'llama-3.3-70b-versatile')
  }

  const save = (p: LLMProvider, m: string) => {
    if (!premium && PREMIUM_PROVIDERS.includes(p)) {
      switchToGroq()
      return
    }
    localStorage.setItem('dreamscape_provider', p)
    if (p === 'openrouter') {
      localStorage.setItem('dreamscape_or_model', m)
      setOrModel(m)
    }
    setProvider(p)
    onChange?.(p, p === 'openrouter' ? m : undefined)
  }

  const label = provider === 'anthropic'
    ? '☁ Anthropic'
    : provider === 'openai'
    ? '☁ OpenAI'
    : provider === 'groq'
    ? '☁ Groq (free)'
    : `☁ OpenRouter (${orModel.split('/').pop()})`

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
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

          <div className="flex gap-2 flex-wrap">
            {(['anthropic', 'openai', 'groq', 'openrouter'] as LLMProvider[]).map((p) => {
              const locked = !premium && PREMIUM_PROVIDERS.includes(p)
              return (
                <button
                  key={p}
                  type="button"
                  disabled={locked}
                  onClick={() => save(p, p === 'openrouter' ? orModel : p === 'openai' ? 'gpt-4o-mini' : p === 'anthropic' ? 'claude-3-haiku-20240307' : 'llama-3.3-70b-versatile')}
                  className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: provider === p ? 'rgba(167,139,250,0.2)' : locked ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${provider === p ? 'rgba(167,139,250,0.4)' : locked ? 'rgba(255,255,255,0.04)' : 'var(--border)'}`,
                    color: locked ? 'rgba(200,200,200,0.25)' : provider === p ? 'var(--violet)' : 'var(--muted)',
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.5 : 1,
                  }}
                  title={locked ? 'Requires premium — switch to Groq (free) or upgrade' : undefined}
                >
                  {p === 'anthropic' ? '☁ Anthropic' : p === 'openai' ? '☁ OpenAI' : p === 'groq' ? '☁ Groq (free)' : '☁ OpenRouter'}
                  {locked && ' 🔒'}
                </button>
              )
            })}
          </div>

          {provider === 'anthropic' && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Uses Anthropic via your <span style={{ color: 'var(--violet)' }}>ANTHROPIC_API_KEY</span> with in-app fallbacks if rate-limited.
            </p>
          )}

          {provider === 'openai' && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Uses OpenAI via your <span style={{ color: 'var(--violet)' }}>OPENAI_API_KEY</span>. Model defaults to <span style={{ color: 'var(--text)' }}>gpt-4o-mini</span>.
            </p>
          )}

          {provider === 'groq' && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Uses Groq via your <span style={{ color: 'var(--violet)' }}>GROQ_API_KEY</span> (14,400 req/day free). Model defaults to <span style={{ color: 'var(--text)' }}>llama-3.3-70b-versatile</span>.
            </p>
          )}

          {provider === 'openrouter' && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Uses OpenRouter via your <span style={{ color: 'var(--violet)' }}>OPENROUTER_API_KEY</span>. Defaults to <span style={{ color: 'var(--text)' }}>nemotron-3-super-120b</span>. Auto-rotates with cool-down on failures.
              </p>
              <div className="space-y-1">
                <label className="text-xs" style={{ color: 'var(--muted)' }}>Model override</label>
                <input
                  type="text"
                  value={orModel}
                  onChange={(e) => save('openrouter', e.target.value)}
                  placeholder="nvidia/nemotron-3-super-120b-a12b:free"
                  className="w-full rounded-lg px-3 py-1.5 text-xs font-mono outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
