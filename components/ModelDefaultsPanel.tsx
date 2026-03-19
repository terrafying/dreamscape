'use client'

import { useEffect, useState } from 'react'

type Provider = 'anthropic' | 'openai' | 'openrouter' | 'ollama'

export default function ModelDefaultsPanel() {
  const [provider, setProvider] = useState<Provider>('openrouter')
  const [orModel, setOrModel] = useState('openrouter/free')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = (localStorage.getItem('dreamscape_provider') as Provider) || 'openrouter'
    const orm = localStorage.getItem('dreamscape_or_model') || 'openrouter/free'
    setProvider(p)
    setOrModel(orm)
  }, [])

  const save = () => {
    localStorage.setItem('dreamscape_provider', provider)
    localStorage.setItem('dreamscape_or_model', orModel)
  }

  const usingKeys = (() => {
    if (typeof window === 'undefined') return false
    try { const k = JSON.parse(localStorage.getItem('dreamscape_api_keys') || '{}'); return !!(k.openai || k.openrouter || k.anthropic || k.deepgram) } catch { return false }
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
        <label className="text-xs" style={{ color: 'var(--muted)' }}>Default Provider</label>
        <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)} className="text-xs rounded px-2 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)', width: 'fit-content' }}>
          <option value="openrouter">OpenRouter</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
        {provider === 'openrouter' && (
          <>
            <label className="text-xs" style={{ color: 'var(--muted)' }}>OpenRouter Model</label>
            <input type="text" value={orModel} onChange={(e) => setOrModel(e.target.value)} placeholder="openrouter/free" className="rounded px-3 py-2 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </>
        )}
        <div className="flex justify-end pt-1">
          <button onClick={save} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--violet)', color: '#07070f' }}>Save</button>
        </div>
      </div>
    </div>
  )
}
