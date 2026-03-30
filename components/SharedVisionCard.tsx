'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SharedVisionWithCounts, VisionInterpretation, VisionLog } from '@/lib/types'
import VisionSigil from '@/components/VisionSigil'

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

export default function SharedVisionCard({
  vision,
  onReact,
  onInterpret,
  signedIn = true,
}: {
  vision: SharedVisionWithCounts
  onReact?: (emoji: string) => void
  onInterpret?: (text: string) => Promise<void>
  signedIn?: boolean
}) {
  const [showInterpretBox, setShowInterpretBox] = useState(false)
  const [interpretText, setInterpretText] = useState('')
  const [posting, setPosting] = useState(false)
  const reactionMap: Record<string, number> = {}
  for (const reaction of vision.reactions) reactionMap[reaction.emoji] = reaction.count
  const data = vision.vision_data as VisionLog
  const extraction = data.extraction
  if (!extraction) return null

  const handleInterpret = async () => {
    if (!onInterpret || !interpretText.trim() || posting) return
    setPosting(true)
    try {
      await onInterpret(interpretText.trim())
      setInterpretText('')
      setShowInterpretBox(false)
    } finally {
      setPosting(false)
    }
  }

  const previews = vision.preview_interpretations || []

  return (
    <div
      className="rounded-[1.75rem] overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, rgba(10,10,18,0.98), rgba(28,18,42,0.88) 46%, rgba(11,13,22,0.98))',
        border: '1px solid rgba(192,132,252,0.18)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
      }}
    >
      <div className="relative p-4 sm:p-5 space-y-4">
        <div
          className="absolute inset-x-0 top-0 h-28 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top left, rgba(244,201,93,0.14), transparent 45%), radial-gradient(circle at top right, rgba(192,132,252,0.16), transparent 42%)' }}
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm" style={{ background: 'rgba(192,132,252,0.14)', border: '1px solid rgba(192,132,252,0.26)', color: '#e9d5ff' }}>
              {vision.share_handle[0].toUpperCase()}
            </div>
            <div>
              <Link href={`/vision/${vision.id}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--text)' }}>
                @{vision.share_handle}
              </Link>
              <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{timeAgo(vision.created_at)}</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: 'rgba(244,201,93,0.08)', border: '1px solid rgba(244,201,93,0.18)', color: '#f4c95d' }}>
            Vision Ritual
          </span>
        </div>

        {vision.board_image_url && (
          <div className="relative rounded-[1.25rem] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <img src={vision.board_image_url} alt={vision.title} className="w-full h-56 object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,8,14,0.1), rgba(8,8,14,0.25) 38%, rgba(8,8,14,0.78) 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <div className="max-w-[80%]">
                <div className="text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(244,201,93,0.88)' }}>
                  Shared Intention
                </div>
                <Link href={`/vision/${vision.id}`} className="block text-2xl leading-tight hover:underline" style={{ color: '#f8fafc', fontFamily: 'Georgia, serif', textShadow: '0 8px 24px rgba(0,0,0,0.45)' }}>
                  {vision.title}
                </Link>
              </div>
            </div>
            <div className="absolute top-4 right-4 rounded-2xl p-2 backdrop-blur-sm" style={{ background: 'rgba(11,13,22,0.62)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <VisionSigil recipe={extraction.sigil_recipe} size={104} className="w-[104px] h-[104px]" />
            </div>
          </div>
        )}

        {!vision.board_image_url && (
          <div className="grid gap-4 sm:grid-cols-[140px_1fr] items-start">
            <div className="rounded-2xl p-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <VisionSigil recipe={extraction.sigil_recipe} size={140} className="w-full h-full" />
            </div>
            <div className="space-y-3">
              <Link href={`/vision/${vision.id}`} className="block text-xl leading-tight hover:underline" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                {vision.title}
              </Link>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--secondary)' }}>
                {vision.distilled_intention}
              </p>
            </div>
          </div>
        )}

        {vision.board_image_url && (
          <p className="text-sm leading-relaxed -mt-1" style={{ color: 'rgba(226,232,240,0.8)' }}>
            {vision.distilled_intention}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {vision.symbols.slice(0, 5).map((symbol) => (
            <span key={symbol} className="px-2.5 py-1 rounded-full text-xs" style={{ background: 'rgba(244,201,93,0.08)', color: '#f4c95d', border: '1px solid rgba(244,201,93,0.16)' }}>
              {symbol}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-full text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {vision.interpretation_count} notes
          </span>
        </div>

        {previews.length > 0 && (
          <div className="space-y-2">
            {previews.map((interpretation: VisionInterpretation) => (
              <div key={interpretation.id} className="rounded-2xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: '#d8b4fe' }}>@{interpretation.handle}</span>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{timeAgo(interpretation.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(226,232,240,0.8)', fontFamily: 'Georgia, serif' }}>
                  {interpretation.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {showInterpretBox && onInterpret && (
          <div className="rounded-2xl p-3 space-y-2" style={{ background: 'rgba(11,13,22,0.7)', border: '1px solid rgba(192,132,252,0.16)' }}>
            <textarea
              value={interpretText}
              onChange={(event) => setInterpretText(event.target.value.slice(0, 500))}
              rows={3}
              placeholder="Add a note, blessing, or witness statement..."
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)', fontFamily: 'Georgia, serif' }}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{interpretText.length}/500</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInterpretBox(false)}
                  className="px-3 py-1.5 rounded-xl text-xs"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInterpret}
                  disabled={!interpretText.trim() || posting}
                  className="px-3 py-1.5 rounded-xl text-xs"
                  style={{
                    background: interpretText.trim() && !posting ? 'rgba(244,201,93,0.14)' : 'rgba(244,201,93,0.06)',
                    border: '1px solid rgba(244,201,93,0.18)',
                    color: interpretText.trim() && !posting ? '#f4c95d' : 'var(--muted)',
                  }}
                >
                  {posting ? 'Posting...' : 'Post Note'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {REACTION_EMOJIS.map((emoji) => {
              const active = vision.my_reactions.includes(emoji)
              return (
                <button
                  key={emoji}
                  onClick={() => onReact?.(emoji)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
                  style={{
                    background: active ? 'rgba(192,132,252,0.16)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(192,132,252,0.32)' : 'rgba(255,255,255,0.06)'}`,
                    color: active ? '#e9d5ff' : 'var(--muted)',
                  }}
                >
                  <span>{emoji}</span>
                  {reactionMap[emoji] ? <span>{reactionMap[emoji]}</span> : null}
                </button>
              )
            })}
          </div>
          <div className="flex-1" />
          {signedIn && onInterpret && (
            <button
              onClick={() => setShowInterpretBox((value) => !value)}
              className="text-xs px-3 py-1.5 rounded-xl"
              style={{ border: '1px solid rgba(244,201,93,0.18)', color: '#f4c95d' }}
            >
              {showInterpretBox ? 'Hide Note' : 'Add Note'}
            </button>
          )}
          <Link href={`/vision/${vision.id}`} className="text-xs px-3 py-1.5 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
            Open Ritual →
          </Link>
        </div>
      </div>
    </div>
  )
}
