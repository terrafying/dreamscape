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
  const [provider, setProvider] = useState<LLMProvider>('anthropic')
  const [model, setModel] = useState('qwen2.5:32b')
  const [expanded, setExpanded] = useState(false)
  const [availableModels, setAvailableModels] = useState<{ name: string; sizeGB: number }[]>([])
  const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'running' | 'offline'>('unknown')
  const [loadingModels, setLoadingModels] = useState(false)

  useEffect(() => {
    const p = (localStorage.getItem('dreamscape_provider') as LLMProvider) || 'anthropic'
    const m = localStorage.getItem('dreamscape_model') || 'qwen2.5:32b'
    setProvider(p)
    setModel(m)
    onChange?.(p, p === 'ollama' ? m : undefined)
  }, [])

  const save = (p: LLMProvider, m: string) => {
    localStorage.setItem('dreamscape_provider', p)
    localStorage.setItem('dreamscape_model', m)
    setProvider(p)
    setModel(m)
    onChange?.(p, p === 'ollama' ? m : undefined)
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
    ? '☁ Claude Opus 4.6'
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
          <div className="flex gap-2">
            {(['anthropic', 'ollama'] as LLMProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => save(p, model)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: provider === p ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${provider === p ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
                  color: provider === p ? 'var(--violet)' : 'var(--muted)',
                }}
              >
                {p === 'anthropic' ? '☁ Anthropic API' : '◉ Local (Ollama)'}
              </button>
            ))}
          </div>

          {/* Anthropic info */}
          {provider === 'anthropic' && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Uses <span style={{ color: 'var(--text)' }}>claude-opus-4-6</span> via your{' '}
              <span style={{ color: 'var(--violet)' }}>ANTHROPIC_API_KEY</span>.
            </p>
          )}

          {/* Ollama config */}
          {provider === 'ollama' && (
            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: ollamaStatus === 'running' ? '#4ade80'
                      : ollamaStatus === 'offline' ? '#f87171'
                      : '#475569',
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {ollamaStatus === 'running' ? 'Ollama running'
                    : ollamaStatus === 'offline' ? 'Ollama not detected'
                    : 'Status unknown'}
                </span>
                <button
                  type="button"
                  onClick={fetchModels}
                  disabled={loadingModels}
                  className="ml-auto text-xs px-2 py-0.5 rounded transition-opacity hover:opacity-70"
                  style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
                >
                  {loadingModels ? '…' : 'Check'}
                </button>
              </div>

              {/* Model input */}
              <div className="space-y-1">
                <label className="text-xs" style={{ color: 'var(--muted)' }}>Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => save('ollama', e.target.value)}
                  placeholder="qwen2.5:32b"
                  className="w-full rounded-lg px-3 py-1.5 text-xs font-mono outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              {/* Available models */}
              {availableModels.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Installed</div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableModels.map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => save('ollama', m.name)}
                        className="text-xs px-2 py-0.5 rounded-full font-mono transition-all"
                        style={{
                          background: model === m.name ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${model === m.name ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
                          color: model === m.name ? 'var(--violet)' : 'var(--muted)',
                        }}
                      >
                        {m.name} <span style={{ opacity: 0.5 }}>{m.sizeGB}GB</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended models */}
              <div className="space-y-1.5">
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  Recommended for 24 GB RAM
                </div>
                {RECOMMENDED.map((r) => (
                  <div key={r.name} className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => save('ollama', r.name)}
                      className="text-xs font-mono transition-opacity hover:opacity-80"
                      style={{ color: model === r.name ? 'var(--violet)' : 'var(--text)' }}
                    >
                      {r.name}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>~{r.sizeGB} GB · {r.note}</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs leading-relaxed pt-1" style={{ color: 'var(--muted)' }}>
                  Install:{' '}
                  <code
                    className="px-1 py-0.5 rounded text-xs"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text)' }}
                  >
                    ollama pull {model}
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
