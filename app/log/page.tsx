'use client'

import { useState, useEffect, useRef } from 'react'
import type { DreamLog, DreamExtraction, BirthData } from '@/lib/types'
import type { LLMProvider } from '@/lib/llm'
import { getDreams, saveDream, getBirthData, saveBirthData, generateId } from '@/lib/store'
import { syncDream } from '@/lib/cloudSync'
import { getSupabase } from '@/lib/supabaseClient'
import { apiFetch } from '@/lib/apiFetch'
import { getNatalPlacements } from '@/lib/astro'
import ExtractionDisplay from '@/components/ExtractionDisplay'
import BirthDataModal from '@/components/BirthDataModal'
import VoiceButton from '@/components/VoiceButton'
import ProviderSettings from '@/components/ProviderSettings'
import ShareableDreamCard from '@/components/ShareableDreamCard'
import ShareSheet from '@/components/ShareSheet'
import HQVoiceButton from '@/components/HQVoiceButton'
import Paywall from '@/components/Paywall'
import { isPaywallEnforced } from '@/lib/entitlements'

type Status = 'idle' | 'loading' | 'done' | 'error'

function computeStreak(dreams: DreamLog[]): number {
  const dates = [...new Set(dreams.map((d) => d.date))].sort().reverse()
  if (!dates.length) return 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = (prev.getTime() - curr.getTime()) / 86400000
    if (Math.round(diff) === 1) streak++
    else break
  }
  return streak
}

export default function LogPage() {
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [extraction, setExtraction] = useState<DreamExtraction | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [sourceProvider, setSourceProvider] = useState<string | null>(null)
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [showBirthModal, setShowBirthModal] = useState(false)
  const [dreams, setDreams] = useState<DreamLog[]>([])
  const [provider, setProvider] = useState<LLMProvider>('anthropic')
  const [model, setModel] = useState<string | undefined>(undefined)
  const [streak, setStreak] = useState(0)
  const [shareDream, setShareDream] = useState<DreamLog | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    getBirthData().then((bd) => {
      setBirthData(bd)
      const dismissed = localStorage.getItem('dreamscape_birth_dismissed')
      if (!bd && !dismissed) setShowBirthModal(true)
    })
    getDreams().then((d) => {
      setDreams(d)
      setStreak(computeStreak(d))
    })
  }, [])

  const natal = birthData ? getNatalPlacements(birthData) : null
  const paywallLocked = isPaywallEnforced(dreams)

  const handleProviderChange = (p: LLMProvider, m: string | undefined) => {
    setProvider(p)
    setModel(m)
  }

  const appendVoice = (text: string) => {
    setTranscript((prev) => {
      if (!prev.trim()) return text.trim()
      // If prev ends with sentence-ending punctuation, separate with space
      const sep = /[.!?]$/.test(prev.trim()) ? ' ' : ''
      return prev + sep + text
    })
  }

  const handleSubmit = async () => {
    if (!transcript.trim() || status === 'loading') return
    if (paywallLocked) {
      setStatus('error')
      setStatusMessage('Free tier limit reached. Upgrade to continue interpreting new dreams.')
      return
    }

    setStatus('loading')
    setExtraction(null)
    setSavedId(null)

    const today = new Date().toISOString().split('T')[0]
    abortRef.current = new AbortController()
    const timeoutId = setTimeout(() => abortRef.current?.abort(), 90_000)

    try {
      const res = await apiFetch('/api/extract', {
        method: 'POST',
        body: JSON.stringify({ transcript, date: today, birthData, provider, model }),
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
            const ext = data.data as DreamExtraction
            setExtraction(ext)
            setStatus('done')
            const id = generateId()
            const log: DreamLog = { id, date: today, transcript, extraction: ext, createdAt: Date.now() }
            await saveDream(log)
            const supabase = getSupabase()
            const session = supabase ? await supabase.auth.getSession() : null
            if (session?.data?.session?.user) { try { await syncDream(session.data.session.user.id, log) } catch {} }
            setSavedId(id)
            const updated = await getDreams()
            setDreams(updated)
            setStreak(computeStreak(updated))
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
  }

  return (
    <>
      {showBirthModal && (
        <BirthDataModal
          onSave={(data: BirthData) => { saveBirthData(data); setBirthData(data); setShowBirthModal(false) }}
          onDismiss={() => { localStorage.setItem('dreamscape_birth_dismissed', '1'); setShowBirthModal(false) }}
        />
      )}

      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-medium tracking-tight" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
              Morning Ritual
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {birthData && <span style={{ color: 'var(--violet)' }}>{' · '}✦ {birthData.location}</span>}
            </p>
          </div>
          {streak > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm flex-shrink-0"
              style={{
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.3)',
                color: 'var(--violet)',
                fontFamily: 'monospace',
              }}
            >
              ◈ {streak} day{streak !== 1 ? 's' : ''} streak
            </div>
          )}
        </div>

        {/* Input or result */}
        {status === 'idle' || status === 'loading' ? (
          <div className="space-y-3">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="First 10 minutes: capture the dream before it dissolves — images, feelings, characters, and what the morning body remembers."
              disabled={status === 'loading'}
              className="w-full rounded-2xl px-4 py-4 text-sm leading-relaxed outline-none resize-none transition-all"
              style={{
                background: 'rgba(15,15,26,0.8)',
                border: `1px solid ${status === 'loading' ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
                color: 'var(--text)',
                minHeight: '160px',
                opacity: paywallLocked ? 0.65 : 1,
              }}
              rows={7}
            />

            {/* Voice + status row */}
            <div className="flex items-center justify-between">
              <div>
                {status === 'loading' && (
                  <div className="flex items-center gap-3">
                    <SpinnerDots />
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>{statusMessage}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <VoiceButton onAppend={appendVoice} disabled={status === 'loading' || paywallLocked} autoStart pulseHint />
                <HQVoiceButton onAppend={appendVoice} disabled={status === 'loading' || paywallLocked} />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!transcript.trim() || status === 'loading' || paywallLocked}
              className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all duration-200"
              style={{
                background: transcript.trim() && status !== 'loading' && !paywallLocked ? 'var(--violet)' : 'rgba(167,139,250,0.15)',
                color: transcript.trim() && status !== 'loading' && !paywallLocked ? '#07070f' : 'rgba(167,139,250,0.4)',
                cursor: !transcript.trim() || status === 'loading' || paywallLocked ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'loading' ? 'Interpreting...' : paywallLocked ? 'Premium Required' : 'Capture + Interpret ✦'}
            </button>

            {paywallLocked && (
              <Paywall title="Free limit reached" message="Upgrade to keep interpreting and saving new dreams beyond the free cap." cta="Unlock Unlimited" />
            )}

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

        {/* Extraction result */}
        {extraction && status === 'done' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--violet)' }} />
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--violet)' }}>
                  Dream Analysis
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
                New Dream
              </button>
            </div>

            <div
              className="rounded-xl p-4 text-sm leading-relaxed"
              style={{
                background: 'rgba(15,15,26,0.5)',
                border: '1px solid var(--border)',
                color: 'rgba(226,232,240,0.6)',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              {transcript.length > 200 ? transcript.slice(0, 200) + '...' : transcript}
            </div>

            <ExtractionDisplay extraction={extraction} natal={natal} />
            <ShareableDreamCard dream={{ id: savedId || 'temp', date: new Date().toISOString().split('T')[0], transcript, extraction: extraction || undefined, createdAt: Date.now() }} />
          </div>
        )}

        {/* Paywall banner for free tier after limits */}
        {status === 'idle' && dreams.length > 0 && (
          <>
            {paywallLocked ? (
              <div className="pt-2">
                <Paywall title="Keep your archive growing" message="Free tier includes up to 5 dreams and 3 weeks of history. Upgrade to unlock deeper analysis and unlimited logging." />
              </div>
            ) : null}

            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
                Recent
              </div>
              {dreams.slice(0, 5).map((dream) => (
                <DreamEntry
                  key={dream.id}
                  dream={dream}
                  onSelect={() => {
                    setTranscript(dream.transcript)
                    setExtraction(dream.extraction || null)
                    setStatus(dream.extraction ? 'done' : 'idle')
                  }}
                  onShare={dream.extraction ? () => setShareDream(dream) : undefined}
                />
              ))}
            </div>
          </>
        )}

        {/* Birth data prompt */}
        {!birthData && !showBirthModal && (
          <button
            onClick={() => setShowBirthModal(true)}
            className="w-full py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
            style={{ border: '1px dashed rgba(167,139,250,0.3)', color: 'var(--muted)' }}
          >
            ✦ Add birth chart for deeper astrological context
          </button>
        )}

        {shareDream && (
          <ShareSheet
            dream={shareDream}
            onClose={() => setShareDream(null)}
            onShared={() => setShareDream(null)}
          />
        )}
      </div>
    </>
  )
}

function DreamEntry({ dream, onSelect, onShare }: { dream: DreamLog; onSelect: () => void; onShare?: () => void }) {
  const ext = dream.extraction
  const topEmotion = ext?.emotions?.[0]
  const dominantTheme = ext?.themes?.[0]

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl p-3 transition-all hover:border-opacity-50"
      style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{dream.date}</span>
            {dream.isExample && (
              <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--violet)' }}>
                example
              </span>
            )}
            {topEmotion && (
              <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(15,15,26,0.8)', color: 'var(--muted)' }}>
                {topEmotion.name}
              </span>
            )}
          </div>
          <p className="text-sm truncate" style={{ color: 'var(--text)' }}>{dream.transcript.slice(0, 80)}...</p>
          {dominantTheme && <p className="text-xs mt-0.5" style={{ color: 'var(--violet)' }}>{dominantTheme.name}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onShare && (
            <button
              onClick={(e) => { e.stopPropagation(); onShare() }}
              className="p-1 rounded text-xs"
              style={{ color: 'rgba(167,139,250,0.5)' }}
              title="Share to community"
            >
              ◇
            </button>
          )}
          <span className="text-sm" style={{ color: 'var(--muted)' }}>›</span>
        </div>
      </div>
    </button>
  )
}

function SpinnerDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--violet)', animation: `bounce 1.2s infinite ${i * 0.2}s` }}
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
