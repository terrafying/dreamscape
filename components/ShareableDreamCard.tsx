'use client'

import { useRef } from 'react'
import type { DreamLog } from '@/lib/types'

export default function ShareableDreamCard({ dream }: { dream: DreamLog }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const saveImage = () => {
    const c = canvasRef.current
    if (!c) return
    const link = document.createElement('a')
    link.download = `dream-${dream.date}.png`
    link.href = c.toDataURL('image/png')
    link.click()
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

    // Footer
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px monospace'
    ctx.fillText('dreamscape.quest', 24, h - 24)
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
      <div className="flex items-center justify-end">
        <button
          onClick={saveImage}
          className="px-3 py-1.5 rounded-full text-xs"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Save Image
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
