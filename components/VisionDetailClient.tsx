'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiFetch'
import { getSupabase } from '@/lib/supabaseClient'
import type { SharedVisionWithCounts, VisionInterpretation } from '@/lib/types'
import SigilWorkbench from '@/components/SigilWorkbench'
import VisionBoardCard from '@/components/VisionBoardCard'
import ShareableVisionCard from '@/components/ShareableVisionCard'

const REACTION_EMOJIS = ['🜂', '✨', '🜁']

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

export default function VisionDetailClient({ visionId }: { visionId: string }) {
  const [vision, setVision] = useState<SharedVisionWithCounts | null>(null)
  const [interpretations, setInterpretations] = useState<VisionInterpretation[]>([])
  const [interpretText, setInterpretText] = useState('')
  const [interpreting, setInterpreting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
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
        const res = await apiFetch(`/api/visions/${visionId}`)
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'Failed to load vision')
          return
        }
        setVision(json.vision)
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [visionId])

  useEffect(() => {
    if (!vision) return
    const loadInterpretations = async () => {
      const client = getSupabase()
      if (!client) return
      const { data } = await client
        .from('vision_interpretations')
        .select('*')
        .eq('vision_id', visionId)
        .order('created_at', { ascending: true })
      setInterpretations((data ?? []) as VisionInterpretation[])
    }
    loadInterpretations()
  }, [vision, visionId])

  const handleReact = async (emoji: string) => {
    if (!signedIn || !vision) return
    const res = await apiFetch(`/api/visions/${visionId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    })
    const json = await res.json()
    if (!res.ok) return
    setVision((prev) => {
      if (!prev) return prev
      const reactions = [...prev.reactions]
      const idx = reactions.findIndex((item) => item.emoji === emoji)
      if (json.reacted) {
        if (idx >= 0) reactions[idx].count++
        else reactions.push({ emoji, count: 1 })
      } else if (idx >= 0) {
        reactions[idx].count--
        if (reactions[idx].count <= 0) reactions.splice(idx, 1)
      }
      const myReactions = json.reacted
        ? [...prev.my_reactions, emoji]
        : prev.my_reactions.filter((item) => item !== emoji)
      return { ...prev, reactions, my_reactions: myReactions }
    })
  }

  const handleInterpret = async () => {
    if (!signedIn || !interpretText.trim()) return
    setInterpreting(true)
    try {
      const res = await apiFetch(`/api/visions/${visionId}/interpret`, {
        method: 'POST',
        body: JSON.stringify({ text: interpretText.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error || 'Failed to post note')
        return
      }
      setInterpretations((prev) => [...prev, json.interpretation])
      setVision((prev) => prev ? { ...prev, interpretation_count: (prev.interpretation_count || 0) + 1 } : prev)
      setInterpretText('')
      interpretRef.current?.focus()
    } finally {
      setInterpreting(false)
    }
  }

  if (loading) {
    return <div className="max-w-xl mx-auto px-4 pt-8 pb-8 text-sm" style={{ color: 'var(--muted)' }}>Loading ritual...</div>
  }

  if (error || !vision?.vision_data.extraction) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-8 pb-8 space-y-3">
        <p className="text-sm" style={{ color: '#fca5a5' }}>{error || 'Vision not found'}</p>
        <Link href="/shared" className="text-sm" style={{ color: 'var(--violet)' }}>← Back to community</Link>
      </div>
    )
  }

  const extraction = vision.vision_data.extraction
  const reactionMap: Record<string, number> = {}
  for (const reaction of vision.reactions) reactionMap[reaction.emoji] = reaction.count

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-8 space-y-5">
      <Link href="/shared" className="text-xs" style={{ color: 'var(--muted)' }}>← Community</Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.14)', border: '1px solid rgba(192,132,252,0.26)', color: '#e9d5ff' }}>
          {vision.share_handle[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>@{vision.share_handle}</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(vision.created_at)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl leading-tight" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{vision.title}</h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--secondary)' }}>{vision.distilled_intention}</p>
      </div>

      <SigilWorkbench extraction={extraction} />
      <VisionBoardCard extraction={extraction} imageUrl={vision.board_image_url} />
      <ShareableVisionCard
        extraction={extraction}
        imageUrl={vision.board_image_url}
        shareHandle={vision.share_handle}
        sharePath={`/vision/${vision.id}`}
      />

      {extraction.blockers.length > 0 && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(15,15,26,0.72)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>Thresholds To Cross</div>
          {extraction.blockers.map((blocker) => (
            <div key={blocker.name} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-sm" style={{ color: 'var(--text)' }}>{blocker.name}</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{blocker.reframing}</div>
              <div className="mt-2 text-xs" style={{ color: '#f4c95d' }}>{blocker.action}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {REACTION_EMOJIS.map((emoji) => {
          const active = vision.my_reactions.includes(emoji)
          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              disabled={!signedIn}
              className="px-3 py-1.5 rounded-xl text-xs"
              style={{
                background: active ? 'rgba(192,132,252,0.16)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? 'rgba(192,132,252,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: active ? '#e9d5ff' : 'var(--muted)',
                opacity: signedIn ? 1 : 0.5,
              }}
            >
              {emoji} {reactionMap[emoji] || ''}
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
          Community Notes {interpretations.length > 0 && `(${interpretations.length})`}
        </h3>

        {interpretations.map((interpretation) => (
          <div key={interpretation.id} className="rounded-2xl p-3.5" style={{ background: 'rgba(15,15,26,0.66)', border: '1px solid rgba(192,132,252,0.12)' }}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-xs font-medium" style={{ color: '#d8b4fe' }}>@{interpretation.handle}</span>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{timeAgo(interpretation.created_at)}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(226,232,240,0.78)', fontFamily: 'Georgia, serif' }}>
              {interpretation.text}
            </p>
          </div>
        ))}

        {signedIn ? (
          <div className="space-y-2">
            <textarea
              ref={interpretRef}
              value={interpretText}
              onChange={(event) => setInterpretText(event.target.value.slice(0, 500))}
              placeholder="Add a note, blessing, or witness statement..."
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Georgia, serif' }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{interpretText.length}/500</span>
              <button
                onClick={handleInterpret}
                disabled={!interpretText.trim() || interpreting}
                className="px-3 py-1.5 rounded-xl text-xs"
                style={{
                  background: interpretText.trim() && !interpreting ? 'rgba(244,201,93,0.14)' : 'rgba(244,201,93,0.06)',
                  border: '1px solid rgba(244,201,93,0.18)',
                  color: interpretText.trim() && !interpreting ? '#f4c95d' : 'var(--muted)',
                }}
              >
                {interpreting ? 'Posting...' : 'Post Note'}
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/account"
            className="block text-center text-xs py-3 rounded-xl"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            Sign in to add a note
          </Link>
        )}
      </div>
    </div>
  )
}
