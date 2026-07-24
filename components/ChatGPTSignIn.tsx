'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'
import {
  cancelOpenAISignIn,
  clearOpenAIOAuthSession,
  completeOpenAISignIn,
  getOpenAIOAuthModel,
  getOpenAIOAuthSession,
  setOpenAIOAuthModel,
  startOpenAISignIn,
} from '@/lib/openaiOAuth'
import type { OpenAIOAuthSessionData } from '@/lib/openaiOAuthShared'

type Phase =
  | { name: 'idle' }
  | { name: 'pending' }
  | { name: 'signed-in'; session: OpenAIOAuthSessionData }

interface ChatGPTSignInProps {
  onSessionChange?: (session: OpenAIOAuthSessionData | null) => void
}

export default function ChatGPTSignIn({ onSessionChange }: ChatGPTSignInProps) {
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const [pasted, setPasted] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [models, setModels] = useState<string[] | null>(null)
  const [model, setModel] = useState(getOpenAIOAuthModel())

  useEffect(() => {
    const session = getOpenAIOAuthSession()
    if (session) setPhase({ name: 'signed-in', session })
  }, [])

  // Lazy-load the models available to this account once signed in
  useEffect(() => {
    if (phase.name !== 'signed-in' || models !== null) return
    apiFetch('/api/openai/oauth-models')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('fetch failed'))))
      .then((data) => {
        const slugs = (data.models || []).map((m: { slug: string }) => m.slug)
        if (slugs.length) setModels(slugs)
      })
      .catch(() => setModels([]))
  }, [phase, models])

  const notify = (session: OpenAIOAuthSessionData | null) => onSessionChange?.(session)

  const start = async () => {
    setBusy(true)
    setError(null)
    const result = await startOpenAISignIn()
    setBusy(false)
    if (result.ok) {
      setPhase({ name: 'pending' })
    } else {
      setError(result.error)
    }
  }

  const complete = async () => {
    setBusy(true)
    setError(null)
    const result = await completeOpenAISignIn(pasted)
    setBusy(false)
    if (result.ok) {
      setPasted('')
      setPhase({ name: 'signed-in', session: result.session })
      setModels(null)
      notify(result.session)
    } else {
      setError(result.error)
    }
  }

  const cancel = () => {
    cancelOpenAISignIn()
    setPasted('')
    setError(null)
    setPhase({ name: 'idle' })
  }

  const disconnect = () => {
    clearOpenAIOAuthSession()
    setModels(null)
    setPhase({ name: 'idle' })
    notify(null)
  }

  if (phase.name === 'signed-in') {
    return (
      <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)' }}>
        <div className="flex items-center justify-between">
          <div className="text-xs" style={{ color: 'var(--text)' }}>
            Signed in with ChatGPT
          </div>
          <button onClick={disconnect} className="text-xs px-2 py-0.5 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
            Disconnect
          </button>
        </div>
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
          Account <span style={{ color: 'var(--text)' }}>{phase.session.accountId}</span> — OpenAI requests use your ChatGPT subscription.
        </p>
        <label className="grid" style={{ color: 'var(--muted)' }}>
          <span className="text-xs mb-1">ChatGPT model</span>
          {models === null ? (
            <span className="text-[11px]">Loading available models…</span>
          ) : models.length === 0 ? (
            <input
              type="text"
              value={model}
              onChange={(e) => { setModel(e.target.value); setOpenAIOAuthModel(e.target.value) }}
              className="rounded px-3 py-2 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          ) : (
            <select
              value={model}
              onChange={(e) => { setModel(e.target.value); setOpenAIOAuthModel(e.target.value) }}
              aria-label="ChatGPT model"
              className="rounded px-3 py-2 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {models.includes(model) ? null : <option value={model}>{model}</option>}
              {models.map((slug) => (
                <option key={slug} value={slug}>{slug}</option>
              ))}
            </select>
          )}
        </label>
      </div>
    )
  }

  if (phase.name === 'pending') {
    return (
      <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Finish signing in in the browser window that just opened. At the end the page will fail to load
          (it points at <span style={{ color: 'var(--text)' }}>localhost</span> — that is expected).
          Copy the full URL from the address bar and paste it here.
        </p>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="http://localhost:1455/auth/callback?code=…&state=…"
          rows={2}
          aria-label="Paste the sign-in redirect URL"
          className="w-full rounded px-3 py-2 text-sm outline-none resize-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        {error && <p className="text-[11px]" style={{ color: '#fca5a5' }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={cancel} className="text-xs px-2 py-1 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
            Cancel
          </button>
          <button
            onClick={complete}
            disabled={busy || !pasted.trim()}
            className="text-xs px-2 py-1 rounded disabled:opacity-50"
            style={{ background: 'var(--violet)', color: '#07070f' }}
          >
            {busy ? 'Completing…' : 'Complete sign-in'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={start}
        disabled={busy}
        className="w-full rounded-lg px-3 py-2 text-xs transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        {busy ? 'Opening browser…' : 'Sign in with ChatGPT'}
      </button>
      {error && <p className="text-[11px]" style={{ color: '#fca5a5' }}>{error}</p>}
    </div>
  )
}
