'use client'

import { useState, useEffect, useRef } from 'react'
import BinauralPlayer from '@/components/BinauralPlayer'
import BreathworkPlayer from '@/components/BreathworkPlayer'
import { getDreams } from '@/lib/store'
import type { DreamLog } from '@/lib/types'
import { apiFetch } from '@/lib/apiFetch'

const TABS = [
  { id: 'breathwork', label: 'Breathwork', icon: '◎' },
  { id: 'binaural',   label: 'Binaural',   icon: '◈' },
  { id: 'stories',    label: 'Stories',    icon: '◇' },
] as const
type Tab = typeof TABS[number]['id']

// ─── Story tab ────────────────────────────────────────────────────────────────

function StoryTab() {
  const [dreams, setDreams] = useState<DreamLog[]>([])
  const [storyText, setStoryText] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { getDreams().then(setDreams) }, [])

  const generate = async () => {
    if (loading) { abortRef.current?.abort(); return }
    setLoading(true)
    setStoryText('')
    setStatus('')
    abortRef.current = new AbortController()

    try {
      const birth = typeof window !== 'undefined' ? localStorage.getItem('dreamscape_birth') : null
      const res = await apiFetch('/api/story', {
        method: 'POST',
        body: JSON.stringify({
          dreams,
          birthData: birth ? JSON.parse(birth) : null,
          date: new Date().toISOString().split('T')[0],
        }),
        signal: abortRef.current.signal,
      })

      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })

        const events = buf.split('\n\n')
        buf = events.pop() ?? ''

        for (const event of events) {
          if (!event.trim()) continue
          const lines = event.split('\n')
          let eventType = ''
          let dataLine = ''
          for (const line of lines) {
            if (line.startsWith('event:')) eventType = line.slice(6).trim()
            if (line.startsWith('data:')) dataLine = line.slice(5).trim()
          }
          if (!dataLine) continue
          try {
            const payload = JSON.parse(dataLine)
            if (eventType === 'status' && payload.message) setStatus(payload.message)
            if (eventType === 'story' && payload.text) setStoryText(payload.text)
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') setStatus('Generation failed')
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  const hasDreams = dreams.length > 0

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl p-4 text-sm leading-relaxed"
        style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid var(--border)', color: 'var(--muted)' }}
      >
        <span className="font-medium" style={{ color: 'var(--text)' }}>Generative Sleep Stories — </span>
        Each story is woven from your own dream symbols, recurring themes, and emotional landscape.
        Written to carry you gently from waking into sleep.
      </div>

      {!hasDreams && (
        <div
          className="rounded-xl p-4 text-xs text-center"
          style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--muted)' }}
        >
          Log a dream first — your story will draw from your own symbols and themes.
        </div>
      )}

      <button
        onClick={generate}
        disabled={!hasDreams && !loading}
        className="w-full py-4 rounded-2xl text-sm font-medium transition-all duration-300"
        style={{
          background: loading ? 'rgba(167,139,250,0.12)' : hasDreams ? 'var(--violet)' : 'rgba(167,139,250,0.08)',
          border: `1px solid ${loading ? 'rgba(167,139,250,0.4)' : hasDreams ? 'transparent' : 'rgba(167,139,250,0.2)'}`,
          color: loading ? 'var(--violet)' : hasDreams ? '#07070f' : 'var(--muted)',
          cursor: !hasDreams && !loading ? 'default' : 'pointer',
        }}
      >
        {loading ? `◼  Stop · ${status || 'generating...'}` : '◇  Weave a Sleep Story'}
      </button>

      {storyText && (
        <div
          className="rounded-xl p-5 leading-loose"
          style={{
            background: 'rgba(15,15,26,0.7)',
            border: '1px solid var(--border)',
            fontFamily: 'Georgia, serif',
            fontSize: '15px',
            color: 'var(--text)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {storyText}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DreamscapePage() {
  const [tab, setTab] = useState<Tab>('breathwork')
  const [breathPlaying, setBreathPlaying] = useState(false)
  const [binauralPlaying, setBinauralPlaying] = useState(false)

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-4 space-y-5">
      <div className="space-y-1">
        <h1
          className="text-2xl font-medium tracking-tight"
          style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
        >
          Sleep
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Breathwork, binaural beats & healing frequencies for nervous system regulation and deep sleep.
        </p>
      </div>

      {/* Mini banners for active audio on hidden tab */}
      {tab !== 'breathwork' && breathPlaying && (
        <button
          onClick={() => setTab('breathwork')}
          className="w-full rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm transition-all"
          style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)' }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--violet)', animation: 'pulse-banner 1.5s infinite' }} />
          <span style={{ color: 'var(--violet)' }}>Breathwork active</span>
          <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>tap to control →</span>
        </button>
      )}
      {tab !== 'binaural' && binauralPlaying && (
        <button
          onClick={() => setTab('binaural')}
          className="w-full rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm transition-all"
          style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.3)' }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#60a5fa', animation: 'pulse-banner 1.5s infinite' }} />
          <span style={{ color: '#60a5fa' }}>Binaural beats active</span>
          <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>tap to control →</span>
        </button>
      )}

      {/* Tab bar */}
      <div
        className="flex rounded-xl p-0.5 gap-0.5"
        style={{ background: 'rgba(15,15,26,0.8)', border: '1px solid var(--border)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
            style={{
              background: tab === t.id ? 'rgba(167,139,250,0.15)' : 'transparent',
              color: tab === t.id ? 'var(--violet)' : 'var(--muted)',
              border: tab === t.id ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{t.icon}</span>
            {t.label}
            {t.id === 'breathwork' && breathPlaying && tab !== 'breathwork' && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--violet)' }} />
            )}
            {t.id === 'binaural' && binauralPlaying && tab !== 'binaural' && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#60a5fa' }} />
            )}
          </button>
        ))}
      </div>

      {/* Always mount audio players — hide inactive to preserve audio state */}
      <div style={{ display: tab === 'breathwork' ? 'block' : 'none' }}>
        <BreathworkPlayer onPlayingChange={setBreathPlaying} />
      </div>
      <div style={{ display: tab === 'binaural' ? 'block' : 'none' }}>
        <BinauralPlayer onPlayingChange={setBinauralPlaying} />
      </div>
      {tab === 'stories' && <StoryTab />}

      <style>{`
        @keyframes pulse-banner {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
      `}</style>
    </div>
  )
}
