'use client'

import { useState, useEffect, useRef } from 'react'
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
  isPreview?: boolean
}

export default function SharedDreamCard({ dream, onReact, myReactions = [], isPreview = false }: SharedDreamCardProps) {
   const [copied, setCopied] = useState(false)
   const [showCard, setShowCard] = useState(false)
   const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
   const [generatingImage, setGeneratingImage] = useState(false)
   const [genStatus, setGenStatus] = useState('')
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
     const shareUrl = isPreview ? SITE_URL : `${SITE_URL}/dream/${dream.id}`
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
     const shareUrl = isPreview ? SITE_URL : `${SITE_URL}/dream/${dream.id}`
     const text = `@${dream.share_handle} shared a dream:\n"${truncated}"\n\nExplore at ${shareUrl}`
     if (navigator.share) {
       try {
         await navigator.share({ text, url: shareUrl })
       } catch { }
     } else {
       await navigator.clipboard.writeText(text)
       setCopied(true)
       setTimeout(() => setCopied(false), 2000)
     }
   }

    const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Background
      if (bgImage) {
        const scale = Math.max(w / bgImage.width, h / bgImage.height)
        const imgW = bgImage.width * scale
        const imgH = bgImage.height * scale
        const ix = (w - imgW) / 2
        const iy = (h - imgH) / 2
        ctx.drawImage(bgImage, ix, iy, imgW, imgH)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(0, 0, w, h)
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, '#0c0c18')
        g.addColorStop(1, '#1a102a')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      // Frame
      ctx.strokeStyle = 'rgba(167,139,250,0.35)'
      ctx.lineWidth = 2
      ctx.strokeRect(12, 12, w - 24, h - 24)

      // Title/date
      ctx.fillStyle = bgImage ? '#ffffff' : '#e2e8f0'
      ctx.font = '600 18px Impact, sans-serif'
      ctx.shadowColor = 'black'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillText('DREAMSCAPE', 24, 40)

      ctx.fillStyle = bgImage ? '#cccccc' : '#94a3b8'
      ctx.font = '12px monospace'
      ctx.shadowBlur = 2
      ctx.fillText(`@${dream.share_handle}`, 24, 60)

      // Reset shadow for text background
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Body excerpt
      const text = transcript.trim().slice(0, 200) + (transcript.length > 200 ? '...' : '')
      const quotedText = quoteify(text)
      
      // Draw text background rectangle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
      ctx.fillRect(16, 76, w - 32, 110)

      ctx.fillStyle = '#ffffff'
      ctx.font = '18px Impact, sans-serif'
      wrapText(ctx, quotedText, 24, 100, w - 48, 24)

      // Interpretation headline (if any)
      if (interpretation) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
        ctx.fillRect(16, h - 100, w - 32, 50)
        
        ctx.fillStyle = '#a78bfa'
        ctx.font = 'italic 16px Impact, sans-serif'
        wrapText(ctx, interpretation.slice(0, 100) + (interpretation.length > 100 ? '...' : ''), 24, h - 76, w - 48, 22)
      }

      ctx.fillStyle = bgImage ? '#ffffff' : '#94a3b8'
      ctx.font = '12px monospace'
      ctx.shadowColor = 'black'
      ctx.shadowBlur = 2
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      const shareUrl = isPreview ? SITE_URL : `${SITE_URL}/dream/${dream.id}`
      ctx.fillText(shareUrl, 24, h - 24)

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
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

   const handleGenerateImage = async () => {
     if (generatingImage) return
     setGeneratingImage(true)
     setGenStatus('Conjuring visual...')
     try {
       const res = await fetch('/api/generate-card', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           dreams: [dream.dream_data || dream],
           storyTitle: 'A Dream',
         }),
       })
       if (!res.ok) throw new Error('API error')
       if (!res.body) throw new Error('No body')
       
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
             setGenStatus(data.message)
           } else if (eventType === 'done') {
             const img = new window.Image()
             img.onload = () => {
               setBgImage(img)
               setGeneratingImage(false)
               setGenStatus('')
             }
             img.src = data.base64.startsWith('data:image') ? data.base64 : `data:image/jpeg;base64,${data.base64}`
           } else if (eventType === 'error') {
             throw new Error(data.message)
           }
         }
       }
     } catch (err) {
       console.error(err)
       setGenStatus('Generation failed.')
       setGeneratingImage(false)
     }
   }

   useEffect(() => {
     const c = canvasRef.current
     if (c) {
       const ctx = c.getContext('2d')
       if (ctx) {
         const dpr = Math.min(window.devicePixelRatio || 1, 2)
         ctx.save()
         // Re-apply scale for redraw because we're restoring
         ctx.scale(dpr, dpr)
         draw(ctx, 800, 420)
         ctx.restore()
       }
     }
   }, [bgImage])

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
            {isPreview ? (
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text)' }}
              >
                @{dream.share_handle}
              </span>
            ) : (
              <Link
                href={`/dream/${dream.id}`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--text)' }}
              >
                @{dream.share_handle}
              </Link>
            )}
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

      {isPreview ? (
        <div className="block">
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'rgba(226,232,240,0.75)', fontFamily: 'Georgia, serif' }}
          >
            {truncated || 'No transcript available'}
          </p>
        </div>
      ) : (
        <Link href={`/dream/${dream.id}`} className="block">
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'rgba(226,232,240,0.75)', fontFamily: 'Georgia, serif' }}
          >
            {truncated || 'No transcript available'}
          </p>
        </Link>
      )}

        {symbols.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {symbols.map((s: any) => {
              const symbolName = typeof s === 'string' ? s : (s?.name || String(s))
              return (
                <span
                  key={symbolName}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', color: 'rgba(251,191,36,0.7)' }}
                >
                  {symbolName}
                </span>
              )
            })}
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

        {!isPreview && (
          <>
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
          </>
        )}
       </div>

       {showCard && (
         <div className="space-y-2 mt-4 pt-4 border-t border-violet-500/20">
           <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
             <span>Shareable Dream Card</span>
             {!bgImage && (
               <button
                 onClick={handleGenerateImage}
                 disabled={generatingImage}
                 className="flex items-center gap-2 hover:text-white transition-colors"
                 style={{ color: 'var(--violet)' }}
               >
                 {generatingImage ? (
                   <>
                     <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--violet)' }} />
                     {genStatus || 'Conjuring...'}
                   </>
                 ) : (
                   '✦ Generate AI Visual'
                 )}
               </button>
             )}
           </div>
           <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
             <canvas ref={onCanvas}></canvas>
           </div>
           <div className="flex items-center justify-end gap-2">
             {!isPreview && (
               <button
                 onClick={() => {
                   navigator.clipboard?.writeText(`${SITE_URL}/dream/${dream.id}`).catch(() => {})
                 }}
                 className="px-3 py-1.5 rounded-full text-xs cursor-pointer"
                 style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
               >
                 Copy Link
               </button>
             )}
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
