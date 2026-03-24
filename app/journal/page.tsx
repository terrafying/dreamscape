'use client'

import { useEffect, useRef, useState } from 'react'
import type { JournalExtraction, JournalLog, BirthData } from '@/lib/types'
import type { LLMProvider } from '@/lib/llm'
import { apiFetch } from '@/lib/apiFetch'
import { generateId, getBirthData, getJournals, saveJournal } from '@/lib/store'
import VoiceButton from '@/components/VoiceButton'
import ProviderSettings from '@/components/ProviderSettings'
import HQVoiceButton from '@/components/HQVoiceButton'

type Status = 'idle' | 'loading' | 'done' | 'error'
type EntryType = 'evening' | 'morning'

function detectEntryType(): EntryType {
  const hour = new Date().getHours()
  if (hour >= 18) return 'evening'
  if (hour < 12) return 'morning'
  // Afternoon defaults to morning mode until evening.
  return 'morning'
}

export default function JournalPage() {
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [extraction, setExtraction] = useState<JournalExtraction | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [sourceProvider, setSourceProvider] = useState<string | null>(null)
  const [journals, setJournals] = useState<JournalLog[]>([])
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [provider, setProvider] = useState<LLMProvider>('anthropic')
  const [model, setModel] = useState<string | undefined>(undefined)
  const [entryType, setEntryType] = useState<EntryType>('morning')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setEntryType(detectEntryType())
    getBirthData().then(setBirthData)
    getJournals().then(setJournals)
  }, [])

  const isEvening = entryType === 'evening'

  const accent = isEvening ? '#f59e0b' : '#f4c95d'
  const cardBg = isEvening ? 'rgba(35,24,10,0.52)' : 'rgba(42,36,16,0.45)'
  const borderColor = isEvening ? 'rgba(245,158,11,0.28)' : 'rgba(244,201,93,0.28)'

  const handleProviderChange = (p: LLMProvider, m: string | undefined) => {
    setProvider(p)
    setModel(m)
  }

  const appendVoice = (text: string) => {
    setTranscript((prev) => {
      if (!prev.trim()) return text.trim()
      const sep = /[.!?]$/.test(prev.trim()) ? ' ' : ''
      return prev + sep + text
    })
  }

  const handleSubmit = async () => {
    if (!transcript.trim() || status === 'loading') return

    setStatus('loading')
    setExtraction(null)
    setSavedId(null)
    abortRef.current = new AbortController()

    const date = new Date().toISOString().split('T')[0]
    const timeoutId = setTimeout(() => abortRef.current?.abort(), 90_000)

    try {
      const res = await apiFetch('/api/journal-extract', {
        method: 'POST',
        body: JSON.stringify({ transcript, date, birthData, entryType, provider, model }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error('API error')
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

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
          const data = JSON.parse(dataLine)

          if (eventType === 'status') {
            setStatusMessage(data.message)
          } else if (eventType === 'source') {
            setSourceProvider(data.provider)
          } else if (eventType === 'extraction') {
            const ext = data.data as JournalExtraction
            setExtraction(ext)
            setStatus('done')
            const id = generateId()
            const log: JournalLog = { id, date, transcript, extraction: ext, createdAt: Date.now(), entryType }
            await saveJournal(log)
            setSavedId(id)
            const updated = await getJournals()
            setJournals(updated)
          } else if (eventType === 'error') {
            setStatus('error')
            setStatusMessage(data.message)
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setStatus('error')
        setStatusMessage('Something went wrong. Please try again.')
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const handleNew = () => {
    setTranscript('')
    setExtraction(null)
    setStatus('idle')
    setStatusMessage('')
    setSavedId(null)
    setEntryType(detectEntryType())
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-4 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            {isEvening ? 'Evening Ritual' : 'Morning Reflection'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {birthData && <span style={{ color: accent }}>{' · '}✦ {birthData.location}</span>}
          </p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full font-mono uppercase tracking-wider"
          style={{ color: accent, border: `1px solid ${borderColor}`, background: `${accent}1A` }}
        >
          {isEvening ? 'Evening · Close The Loop' : 'Morning · Open The Day'}
        </div>
      </div>

      {status === 'idle' || status === 'loading' ? (
        <div className="space-y-3">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={
              isEvening
                ? 'Last 10 minutes: close the loop. What are you releasing, what are you grateful for, and what intention do you carry into sleep?'
                : 'First 10 minutes: how do you feel waking up, and what intention will guide this day?'
            }
            disabled={status === 'loading'}
            className="w-full rounded-2xl px-4 py-4 text-sm leading-relaxed outline-none resize-none transition-all"
            style={{
              background: cardBg,
              border: `1px solid ${status === 'loading' ? borderColor : 'var(--border)'}`,
              color: 'var(--text)',
              minHeight: '160px',
            }}
            rows={7}
          />

          <div className="flex items-center justify-between">
            <div>
              {status === 'loading' && (
                <div className="flex items-center gap-3">
                  <SpinnerDots color={accent} />
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{statusMessage}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <VoiceButton onAppend={appendVoice} disabled={status === 'loading'} pulseHint />
              <HQVoiceButton onAppend={appendVoice} disabled={status === 'loading'} />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!transcript.trim() || status === 'loading'}
            className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all duration-200"
            style={{
              background: transcript.trim() && status !== 'loading' ? accent : `${accent}33`,
              color: transcript.trim() && status !== 'loading' ? '#07070f' : `${accent}66`,
              cursor: !transcript.trim() || status === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Reflecting...' : isEvening ? 'Close The Loop ✦' : 'Open The Day ✦'}
          </button>

          <ProviderSettings onChange={handleProviderChange} />
        </div>
      ) : status === 'error' ? (
        <div className="space-y-4">
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
          >
            {statusMessage || 'Something went wrong.'}
          </div>
          <button
            onClick={() => setStatus('idle')}
            className="w-full py-3 rounded-2xl text-sm"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            Try Again
          </button>
        </div>
      ) : null}

      {extraction && status === 'done' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: accent }}>
                Journal Insight
              </span>
              {sourceProvider && (
                <span className="text-[10px] px-1.5 rounded ml-2" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}>
                  {sourceProvider}
                </span>
              )}
              {savedId && <span className="text-xs" style={{ color: 'var(--muted)' }}>· saved</span>}
            </div>
            <button
              onClick={handleNew}
              className="text-xs px-3 py-1 rounded-full transition-opacity hover:opacity-70"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              New Entry
            </button>
          </div>

          <div className="rounded-xl p-4 space-y-4" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
            <JournalList title="Mood / Emotions" items={extraction.mood_emotions} />
            <JournalList title="Intentions" items={extraction.intentions} />
            <JournalList title="Gratitude Moments" items={extraction.gratitude_moments} />
            <JournalList title="Themes" items={extraction.themes} />
            <div className="space-y-1.5">
              <div className="text-xs font-mono uppercase tracking-wider" style={{ color: accent }}>Reflection</div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{extraction.reflection}</p>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-mono uppercase tracking-wider" style={{ color: accent }}>Astro Context</div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {extraction.astro_context.moon_phase} Moon in {extraction.astro_context.moon_sign}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{extraction.astro_context.transit_note}</p>
            </div>
          </div>
        </div>
      )}

      {status === 'idle' && journals.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
            Recent
          </div>
          {journals.slice(0, 5).map((journal) => (
            <button
              key={journal.id}
              onClick={() => {
                setTranscript(journal.transcript)
                setEntryType(journal.entryType)
                setExtraction(journal.extraction || null)
                setStatus(journal.extraction ? 'done' : 'idle')
              }}
              className="w-full text-left rounded-xl p-3 transition-all hover:border-opacity-50"
              style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{journal.date}</span>
                    <span
                      className="text-[10px] px-1.5 rounded uppercase tracking-wider"
                      style={{ background: `${journal.entryType === 'evening' ? '#f59e0b' : '#f4c95d'}1A`, color: journal.entryType === 'evening' ? '#f59e0b' : '#f4c95d' }}
                    >
                      {journal.entryType}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: 'var(--text)' }}>{journal.transcript.slice(0, 90)}...</p>
                  {journal.extraction?.themes?.[0] && (
                    <p className="text-xs mt-0.5" style={{ color: accent }}>{journal.extraction.themes[0]}</p>
                  )}
                </div>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>›</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function JournalList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{title}</div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}

function SpinnerDots({ color }: { color: string }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: color, animation: `bounce 1.2s infinite ${i * 0.2}s` }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
