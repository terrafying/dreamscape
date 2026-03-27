'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { SharedDreamWithCounts } from '@/lib/types'
import { SITE_URL } from '@/lib/site'

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
  dream: SharedDreamWithCounts | any
  onReact?: (emoji: string) => void
  myReactions?: string[]
}

export default function SharedDreamCard({ dream, onReact, myReactions = [] }: SharedDreamCardProps) {
   const [copied, setCopied] = useState(false)
   const [showCard, setShowCard] = useState(false)
   const canvasRef = useRef<HTMLCanvasElement | null>(null)
   const transcript = (dream.dream_data as { transcript?: string })?.transcript ?? ''
   const mood = dreamMood(dream.dream_data as { extraction?: { emotions?: { name: string }[]; tone?: string } })
   const arc = dreamArc(dream.dream_data as { extraction?: { narrative_arc?: string } })
   const symbols = dream.symbols.slice(0, 4)
   const truncated = transcript.length > 100 ? transcript.slice(0, 100) + '…' : transcript
   const interpretation = (dream.dream_data as { extraction?: { interpretation?: string } })?.extraction?.interpretation ?? ''

   const getBlob = (): Promise<Blob | null> => {
     return new Promise((resolve) => {
       const c = canvasRef.current
       if (!c) return resolve(null)
       c.toBlob((blob) => resolve(blob), 'image/png')
     })
   }

   const saveImage = () => {
     const c = canvasRef.current
     if (!c) return
     const link = document.createElement('a')
     link.download = `dream-${dream.id}.png`
     link.href = c.toDataURL('image/png')
     link.click()
   }

   const shareNative = async () => {
     const blob = await getBlob()
     if (!blob) return saveImage()

     const file = new File([blob], `dream-${dream.id}.png`, { type: 'image/png' })
     const shareUrl = `${SITE_URL}/dream/${dream.id}`
     const shareText = interpretation
       ? `"${interpretation.slice(0, 120)}..." — @${dream.share_handle}'s dream on Dreamscape`
       : `A dream from @${dream.share_handle} — Dreamscape`

     if (navigator.share && navigator.canShare?.({ files: [file] })) {
       try {
         await navigator.share({ files: [file], text: shareText, url: shareUrl })
         return
       } catch {}
     }

     if (navigator.share) {
       try {
         await navigator.share({ text: shareText, url: shareUrl })
         return
       } catch {}
     }

     saveImage()
   }

   const handleShare = async () => {
     const text = `@${dream.share_handle} shared a dream:\n"${truncated}"\n\nExplore at ${SITE_URL}/dream/${dream.id}`
     if (navigator.share) {
       try {
         await navigator.share({ text, url: `${SITE_URL}/dream/${dream.id}` })
       } catch { }
     } else {
       await navigator.clipboard.writeText(text)
       setCopied(true)
       setTimeout(() => setCopied(false), 2000)
     }
   }

   const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
     // Background gradient
     const g = ctx.createLinearGradient(0, 0, 0, h)
     g.addColorStop(0, '#0c0c18')
     g.addColorStop(1, '#1a102a')
     ctx.fillStyle = g
     ctx.fillRect(0, 0, w, h)

     // Frame
     ctx.strokeStyle = 'rgba(167,139,250,0.35)'
     ctx.lineWidth = 2
     ctx.strokeRect(12, 12, w - 24, h - 24)

     // Title/date
     ctx.fillStyle = '#e2e8f0'
     ctx.font = '600 18px Georgia, serif'
     ctx.fillText('Dreamscape', 24, 40)

     ctx.fillStyle = '#94a3b8'
     ctx.font = '12px monospace'
     ctx.fillText(`@${dream.share_handle}`, 24, 60)

     // Body excerpt
     const text = transcript.trim().slice(0, 280)
     ctx.fillStyle = '#e2e8f0'
     ctx.font = '14px Georgia, serif'
     wrapText(ctx, quoteify(text), 24, 96, w - 48, 20)

     // Interpretation headline (if any)
     if (interpretation) {
       ctx.fillStyle = '#a78bfa'
       ctx.font = 'italic 14px Georgia, serif'
       wrapText(ctx, interpretation, 24, h - 90, w - 48, 18)
     }

     ctx.fillStyle = '#94a3b8'
     ctx.font = '12px monospace'
     const shareUrl = `${SITE_URL}/dream/${dream.id}`
     ctx.fillText(shareUrl, 24, h - 24)
   }

   const onCanvas = (el: HTMLCanvasElement | null) => {
     if (!el) return
     canvasRef.current = el
     const dpr = Math.min(window.devicePixelRatio || 1, 2)
     const w = 800
     const h = 420
     el.width = Math.floor(w * dpr)
     el.height = Math.floor(h * dpr)
     el.style.width = w + 'px'
     el.style.height = h + 'px'
     const ctx = el.getContext('2d')
     if (!ctx) return
     ctx.scale(dpr, dpr)
     draw(ctx, w, h)
   }

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
           {symbols.map((s: string) => (
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

        <button
          onClick={handleShare}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ border: '1px solid var(--border)', color: copied ? '#86efac' : 'var(--muted)' }}
        >
          {copied ? 'Copied!' : 'Share'}
        </button>
        <Link
          href={`/dream/${dream.id}`}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          View →
        </Link>
       </div>

       {showCard && (
         <div className="space-y-2 mt-4 pt-4 border-t border-violet-500/20">
           <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
             Shareable Dream Card
           </div>
           <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
             <canvas ref={onCanvas}></canvas>
           </div>
           <div className="flex items-center justify-end gap-2">
             <button
               onClick={() => {
                 navigator.clipboard?.writeText(`${SITE_URL}/dream/${dream.id}`).catch(() => {})
               }}
               className="px-3 py-1.5 rounded-full text-xs cursor-pointer"
               style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
             >
               Copy Link
             </button>
             <button
               onClick={saveImage}
               className="px-3 py-1.5 rounded-full text-xs cursor-pointer"
               style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
             >
               Save Image
             </button>
             <button
               onClick={shareNative}
               className="px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all duration-200"
               style={{
                 background: 'rgba(167, 139, 250, 0.1)',
                 border: '1px solid rgba(167, 139, 250, 0.3)',
                 color: '#a78bfa',
               }}
             >
               Share Card
             </button>
           </div>
         </div>
       )}

       <button
         onClick={() => setShowCard(!showCard)}
         className="text-xs px-2 py-1 rounded-lg mt-2"
         style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
       >
         {showCard ? 'Hide Card' : 'Show Card'}
       </button>
     </div>
   )
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/)
  let line = ''
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y)
      line = words[n] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, y)
}

function quoteify(text: string) {
  if (!text) return ''
  return text.startsWith('"') ? text : `"${text}${text.endsWith('"') ? '' : '"'}`
}
