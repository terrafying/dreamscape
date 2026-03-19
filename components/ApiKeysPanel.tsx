'use client'

import { useEffect, useState } from 'react'

export default function ApiKeysPanel() {
  const [open, setOpen] = useState(false)
  const [keys, setKeys] = useState({ openai: '', openrouter: '', anthropic: '', deepgram: '' })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('dreamscape_api_keys')
    if (raw) setKeys(JSON.parse(raw))
  }, [])

  const save = () => {
    localStorage.setItem('dreamscape_api_keys', JSON.stringify(keys))
  }

  const clear = () => {
    setKeys({ openai: '', openrouter: '', anthropic: '', deepgram: '' })
    localStorage.removeItem('dreamscape_api_keys')
  }

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: 'var(--text)' }}>Bring Your Own API Keys (optional)</div>
        <button onClick={() => setOpen(v => !v)} className="text-xs px-2 py-0.5 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>{open ? 'Hide' : 'Edit'}</button>
      </div>
      {open && (
        <div className="grid gap-2">
          <KeyField label="OpenAI" value={keys.openai} onChange={(v) => setKeys(k => ({ ...k, openai: v }))} placeholder="sk-..." />
          <KeyField label="OpenRouter" value={keys.openrouter} onChange={(v) => setKeys(k => ({ ...k, openrouter: v }))} placeholder="sk-or-..." />
          <KeyField label="Anthropic" value={keys.anthropic} onChange={(v) => setKeys(k => ({ ...k, anthropic: v }))} placeholder="sk-ant-..." />
          <KeyField label="Deepgram" value={keys.deepgram} onChange={(v) => setKeys(k => ({ ...k, deepgram: v }))} placeholder="dg_..." />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={clear} className="text-xs px-2 py-1 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>Clear</button>
            <button onClick={save} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--violet)', color: '#07070f' }}>Save</button>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Keys are stored locally in your browser and sent only to your own API routes when needed as request headers.</p>
        </div>
      )}
    </div>
  )
}

function KeyField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false)
  return (
    <label className="grid" style={{ color: 'var(--muted)' }}>
      <span className="text-xs mb-1">{label}</span>
      <div className="flex gap-2">
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 rounded px-3 py-2 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        <button type="button" onClick={() => setShow(v => !v)} className="text-xs px-2 py-0.5 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>{show ? 'Hide' : 'Show'}</button>
      </div>
    </label>
  )
}
