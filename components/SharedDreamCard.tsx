'use client'

import Link from 'next/link'
import type { SharedDreamWithCounts } from '@/lib/types'

const REACTION_EMOJIS = ['💭', '🔮', '💜']

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

function dreamMood(dreamData: { extraction?: { emotions?: { name: string }[]; tone?: string } }): string {
  const emotions = dreamData?.extraction?.emotions ?? []
  if (emotions.length > 0) return emotions[0].name
  return dreamData?.extraction?.tone ?? ''
}

function dreamArc(dreamData: { extraction?: { narrative_arc?: string } }): string {
  return dreamData?.extraction?.narrative_arc ?? ''
}

interface SharedDreamCardProps {
  dream: SharedDreamWithCounts
  onReact?: (emoji: string) => void
  myReactions?: string[]
}

export default function SharedDreamCard({ dream, onReact, myReactions = [] }: SharedDreamCardProps) {
  const transcript = (dream.dream_data as { transcript?: string })?.transcript ?? ''
  const mood = dreamMood(dream.dream_data as { extraction?: { emotions?: { name: string }[]; tone?: string } })
  const arc = dreamArc(dream.dream_data as { extraction?: { narrative_arc?: string } })
  const symbols = dream.symbols.slice(0, 4)
  const truncated = transcript.length > 100 ? transcript.slice(0, 100) + '…' : transcript

  const reactionMap: Record<string, number> = {}
  for (const r of dream.reactions) {
    reactionMap[r.emoji] = r.count
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(167,139,250,0.15)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
            style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)' }}
          >
            {dream.share_handle[0].toUpperCase()}
          </div>
          <div>
            <Link
              href={`/dream/${dream.id}`}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--text)' }}
            >
              @{dream.share_handle}
            </Link>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {timeAgo(dream.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--muted)' }}>
          {arc && (
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              {arc}
            </span>
          )}
          {mood && (
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}
            >
              {mood}
            </span>
          )}
        </div>
      </div>

      <Link href={`/dream/${dream.id}`} className="block">
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'rgba(226,232,240,0.75)', fontFamily: 'Georgia, serif' }}
        >
          {truncated || 'No transcript available'}
        </p>
      </Link>

      {symbols.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {symbols.map(s => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', color: 'rgba(251,191,36,0.7)' }}
            >
              {s}
            </span>
          ))}
          {dream.symbols.length > 4 && (
            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
              +{dream.symbols.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {REACTION_EMOJIS.map(emoji => {
            const count = reactionMap[emoji] ?? 0
            const active = myReactions.includes(emoji)
            return (
              <button
                key={emoji}
                onClick={() => onReact?.(emoji)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(167,139,250,0.35)' : 'var(--border)'}`,
                  color: active ? 'var(--violet)' : 'var(--muted)',
                }}
              >
                <span>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            )
          })}
        </div>

        <div className="flex-1" />

        <Link
          href={`/dream/${dream.id}`}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          View →
        </Link>
      </div>
    </div>
  )
}
