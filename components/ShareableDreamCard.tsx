'use client'

import { useRef } from 'react'
import type { DreamLog } from '@/lib/types'

export default function ShareableDreamCard({ dream }: { dream: DreamLog }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
    link.download = `dream-${dream.date}.png`
    link.href = c.toDataURL('image/png')
    link.click()
  }

  const shareNative = async () => {
    const blob = await getBlob()
    if (!blob) return saveImage()

    const file = new File([blob], `dream-${dream.date}.png`, { type: 'image/png' })
    const shareUrl = `${window.location.origin}/dream/${dream.id}`
    const shareText = dream.extraction?.interpretation
      ? `"${dream.extraction.interpretation.slice(0, 120)}..." — my dream reading on Dreamscape`
      : `A dream from ${dream.date} — Dreamscape`

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
    ctx.fillText(dream.date, 24, 60)

    // Body excerpt
    const text = (dream.transcript || '').trim().slice(0, 280)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '14px Georgia, serif'
    wrapText(ctx, quoteify(text), 24, 96, w - 48, 20)

    // Interpretation headline (if any)
    const interp = dream.extraction?.interpretation?.trim()
    if (interp) {
      ctx.fillStyle = '#a78bfa'
      ctx.font = 'italic 14px Georgia, serif'
      wrapText(ctx, interp, 24, h - 90, w - 48, 18)
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px monospace'
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/dream/${dream.id}`
      : `dreamscape.quest/dream/${dream.id}`
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

  return (
    <div className="space-y-2">
      <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
        Shareable Dream Card
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <canvas ref={onCanvas}></canvas>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => {
            const url = `${window.location.origin}/dream/${dream.id}`
            navigator.clipboard?.writeText(url).catch(() => {})
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
          Share
        </button>
      </div>
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
  return text.startsWith('“') ? text : `“${text}${text.endsWith('”') ? '' : '”'}`
}
