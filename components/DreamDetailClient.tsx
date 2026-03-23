'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiFetch'
import { getSupabase } from '@/lib/supabaseClient'
import type { SharedDreamWithCounts, DreamInterpretation } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const REACTION_EMOJIS = ['💭', '🔮', '💜']

export function DreamDetailClient({ dreamId }: { dreamId: string }) {
  const [dream, setDream] = useState<SharedDreamWithCounts | null>(null)
  const [similar, setSimilar] = useState<(SharedDreamWithCounts & { similarity: number })[]>([])
  const [interpretations, setInterpretations] = useState<DreamInterpretation[]>([])
  const [interpretText, setInterpretText] = useState('')
  const [interpreting, setInterpreting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [followed, setFollowed] = useState(false)
  const interpretRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) { setSignedIn(false); return }
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user))
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiFetch(`/api/similar/${dreamId}?limit=5`)
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Failed to load'); return }
        setSimilar(json.dreams ?? [])
        if (json.dreams?.[0]) setDream({ ...json.dreams[0], reactions: [], interpretation_count: 0, my_reactions: [] })
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dreamId])

  useEffect(() => {
    if (!dream) return
    const loadInterpretations = async () => {
      const { getSupabase } = await import('@/lib/supabaseClient')
      const client = getSupabase()
      if (!client) return
      const { data } = await client
        .from('dream_interpretations')
        .select('*')
        .eq('dream_id', dreamId)
        .order('created_at', { ascending: true })
      setInterpretations((data ?? []) as DreamInterpretation[])
    }
    loadInterpretations()
  }, [dream, dreamId])

  const handleReact = async (emoji: string) => {
    if (!signedIn || !dream) return
    try {
      const res = await apiFetch(`/api/dreams/${dreamId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      })
      const json = await res.json()
      if (!res.ok) return
      setDream(prev => {
        if (!prev) return prev
        const reactions = [...prev.reactions]
        const idx = reactions.findIndex(r => r.emoji === emoji)
        if (json.reacted) {
          if (idx >= 0) reactions[idx].count++
          else reactions.push({ emoji, count: 1 })
        } else {
          if (idx >= 0) {
            reactions[idx].count--
            if (reactions[idx].count <= 0) reactions.splice(idx, 1)
          }
        }
        const myReactions = json.reacted
          ? [...prev.my_reactions, emoji]
          : prev.my_reactions.filter((e: string) => e !== emoji)
        return { ...prev, reactions, my_reactions: myReactions }
      })
    } catch {}
  }

  const handleInterpret = async () => {
    if (!signedIn || !interpretText.trim()) return
    setInterpreting(true)
    try {
      const res = await apiFetch(`/api/dreams/${dreamId}/interpret`, {
        method: 'POST',
        body: JSON.stringify({ text: interpretText.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { alert(json.error); return }
      setInterpretations(prev => [...prev, json.interpretation])
      setInterpretText('')
    } catch {} finally {
      setInterpreting(false)
    }
  }

  const handleFollow = async () => {
    if (!signedIn || !dream) return
    const res = await apiFetch(`/api/profile/follow/${dream.share_handle}`, { method: 'POST' })
    const json = await res.json()
    if (res.ok) setFollowed(json.following)
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 flex justify-center py-20">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--violet)', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !dream) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4">
        <p className="text-sm" style={{ color: '#fca5a5' }}>{error || 'Dream not found'}</p>
        <Link href="/shared" className="text-sm mt-2 inline-block" style={{ color: 'var(--violet)' }}>← Back</Link>
      </div>
    )
  }

  const dreamData = dream.dream_data as { transcript?: string; extraction?: { symbols?: { name: string; salience: number; category: string; meaning: string }[]; emotions?: { name: string; intensity: number; valence: number }[]; narrative_arc?: string; lucidity?: number; interpretation?: string } }
  const symbols = dreamData?.extraction?.symbols ?? []
  const emotions = dreamData?.extraction?.emotions ?? []
  const reactionMap: Record<string, number> = {}
  for (const r of dream.reactions) reactionMap[r.emoji] = r.count

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8 space-y-6">
      <Link href="/shared" className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
        ← Community Dreams
      </Link>

      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
          style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)' }}
        >
          {dream.share_handle[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>@{dream.share_handle}</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(dream.created_at)}</p>
        </div>
        {signedIn && (
          <button
            onClick={handleFollow}
            className="ml-auto px-3 py-1.5 rounded-full text-xs"
            style={{
              background: followed ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.08)',
              border: `1px solid ${followed ? 'rgba(167,139,250,0.4)' : 'rgba(167,139,250,0.2)'}`,
              color: followed ? 'var(--violet)' : 'var(--muted)',
            }}
          >
            {followed ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {dreamData?.extraction?.narrative_arc && (
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: 'rgba(167,139,250,0.7)' }}>
            {dreamData.extraction.narrative_arc}
          </span>
          {dreamData.extraction.lucidity !== undefined && dreamData.extraction.lucidity > 0 && (
            <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: 'rgba(251,191,36,0.7)' }}>
              Lucid ×{dreamData.extraction.lucidity}
            </span>
          )}
        </div>
      )}

      {dreamData?.transcript && (
        <div
          className="rounded-2xl p-5 leading-relaxed"
          style={{
            background: 'rgba(12,10,28,0.95)',
            border: '1px solid rgba(167,139,250,0.2)',
            fontFamily: 'Georgia, serif',
            color: 'rgba(226,232,240,0.9)',
            fontSize: '15px',
            lineHeight: '1.8',
          }}
        >
          {dreamData.transcript}
        </div>
      )}

      {dreamData?.extraction?.interpretation && (
        <div
          className="rounded-xl px-4 py-3 text-sm italic"
          style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.15)', color: 'rgba(226,232,240,0.6)', fontFamily: 'Georgia, serif' }}
        >
          {dreamData.extraction.interpretation}
        </div>
      )}

      {symbols.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Symbols</h3>
          <div className="grid grid-cols-2 gap-2">
            {symbols.slice(0, 8).map((s: { name: string; salience: number; category: string; meaning: string }) => (
              <div key={s.name} className="rounded-xl p-3" style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'rgba(251,191,36,0.9)' }}>{s.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: 'rgba(251,191,36,0.5)' }}>
                    {s.category}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(251,191,36,0.1)' }}>
                  <div className="h-full rounded-full" style={{ width: `${s.salience * 100}%`, background: 'rgba(251,191,36,0.5)' }} />
                </div>
                {s.meaning && <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>{s.meaning}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {emotions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Emotions</h3>
          <div className="flex flex-wrap gap-2">
            {emotions.map((e: { name: string; intensity: number; valence: number }) => (
              <div key={e.name} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(96,165,250,0.15)' }}>
                <span className="text-xs" style={{ color: 'rgba(96,165,250,0.8)' }}>{e.name}</span>
                <span className="text-[10px]" style={{ color: e.valence > 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)' }}>
                  {e.valence > 0 ? '+' : ''}{e.valence}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Reactions
        </h3>
        <div className="flex gap-2">
          {REACTION_EMOJIS.map(emoji => {
            const count = reactionMap[emoji] ?? 0
            const active = dream.my_reactions?.includes(emoji)
            return (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                disabled={!signedIn}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(167,139,250,0.35)' : 'var(--border)'}`,
                  color: active ? 'var(--violet)' : 'var(--muted)',
                  opacity: signedIn ? 1 : 0.5,
                }}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="text-xs">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Interpretations {interpretations.length > 0 && `(${interpretations.length})`}
        </h3>

        {interpretations.map((interp: DreamInterpretation) => (
          <div key={interp.id} className="rounded-xl p-3" style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(167,139,250,0.12)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--violet)' }}>@{interp.handle}</span>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{timeAgo(interp.created_at)}</span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(226,232,240,0.7)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {interp.text}
            </p>
          </div>
        ))}

        {signedIn ? (
          <div className="space-y-2">
            <textarea
              ref={interpretRef}
              value={interpretText}
              onChange={e => setInterpretText(e.target.value.slice(0, 500))}
              placeholder="Add your interpretation..."
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{interpretText.length}/500</span>
              <button
                onClick={handleInterpret}
                disabled={!interpretText.trim() || interpreting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: interpretText.trim() && !interpreting ? 'var(--violet)' : 'rgba(167,139,250,0.08)',
                  color: interpretText.trim() && !interpreting ? '#07070f' : 'var(--muted)',
                  opacity: interpreting ? 0.6 : 1,
                }}
              >
                {interpreting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/account"
            className="block text-center text-xs py-3 rounded-xl"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            Sign in to add an interpretation
          </Link>
        )}
      </div>

      {similar.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Similar Dreams
          </h3>
          {similar.map((s: SharedDreamWithCounts & { similarity: number }) => {
            const simData = s.dream_data as { transcript?: string }
            const simSymbols = new Set(s.symbols.map(x => x.toLowerCase()))
            const myShared = new Set(dream.symbols.map(x => x.toLowerCase()))
            const overlap = [...simSymbols].filter((x: string) => myShared.has(x))
            return (
              <Link
                key={s.id}
                href={`/dream/${s.id}`}
                className="block rounded-xl p-3 transition-all hover:opacity-80"
                style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(167,139,250,0.12)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--violet)' }}>@{s.share_handle}</span>
                  <div className="flex items-center gap-2">
                    {overlap.slice(0, 3).map(sym => (
                      <span key={sym} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.08)', color: 'rgba(251,191,36,0.6)' }}>
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {simData?.transcript?.slice(0, 80) ?? ''}...
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
