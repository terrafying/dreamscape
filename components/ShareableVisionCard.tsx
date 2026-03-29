'use client'

import { useEffect, useRef, useState } from 'react'
import { SITE_URL } from '@/lib/site'
import { createSigilRenderData } from '@/lib/sigil'
import type { VisionExtraction } from '@/lib/types'

export default function ShareableVisionCard({
  extraction,
  imageUrl,
  sharePath,
  shareHandle = 'you',
}: {
  extraction: VisionExtraction
  imageUrl?: string
  sharePath?: string
  shareHandle?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)

  const shareUrl = sharePath ? `${SITE_URL}${sharePath}` : `${SITE_URL}/visions`

  useEffect(() => {
    let cancelled = false

    const render = async () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = 1080
      const height = 1350
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = '100%'
      canvas.style.height = 'auto'

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const bg = ctx.createLinearGradient(0, 0, width, height)
      bg.addColorStop(0, '#080812')
      bg.addColorStop(0.45, '#1a102d')
      bg.addColorStop(1, '#05060c')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      drawGlow(ctx, width * 0.18, 150, 320, 'rgba(244,201,93,0.18)')
      drawGlow(ctx, width * 0.85, 220, 360, 'rgba(192,132,252,0.22)')
      drawGlow(ctx, width * 0.48, 980, 420, 'rgba(148,163,184,0.10)')

      const frameX = 48
      const frameY = 48
      const frameW = width - frameX * 2
      const frameH = height - frameY * 2
      roundRect(ctx, frameX, frameY, frameW, frameH, 30)
      ctx.fillStyle = 'rgba(7,9,16,0.38)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const heroX = 88
      const heroY = 138
      const heroW = width - heroX * 2
      const heroH = 520
      roundRect(ctx, heroX, heroY, heroW, heroH, 30)
      ctx.save()
      ctx.clip()

      if (imageUrl) {
        const image = await loadImage(imageUrl)
        if (image && !cancelled) {
          drawCoverImage(ctx, image, heroX, heroY, heroW, heroH)
        } else {
          drawFallbackPanel(ctx, heroX, heroY, heroW, heroH)
        }
      } else {
        drawFallbackPanel(ctx, heroX, heroY, heroW, heroH)
      }

      const heroFade = ctx.createLinearGradient(0, heroY, 0, heroY + heroH)
      heroFade.addColorStop(0, 'rgba(5,6,12,0.02)')
      heroFade.addColorStop(0.55, 'rgba(5,6,12,0.24)')
      heroFade.addColorStop(1, 'rgba(5,6,12,0.88)')
      ctx.fillStyle = heroFade
      ctx.fillRect(heroX, heroY, heroW, heroH)
      ctx.restore()

      ctx.fillStyle = '#f4c95d'
      ctx.font = '600 24px Georgia, serif'
      ctx.fillText('Dreamscape', 96, 100)
      ctx.fillStyle = 'rgba(226,232,240,0.72)'
      ctx.font = '17px monospace'
      ctx.fillText(`VISION RITUAL  //  @${shareHandle}`, 96, 126)

      const sigilSize = 176
      const sigilX = width - 96 - sigilSize
      const sigilY = 76
      roundRect(ctx, sigilX - 16, sigilY - 16, sigilSize + 32, sigilSize + 32, 28)
      ctx.fillStyle = 'rgba(7,9,16,0.62)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(244,201,93,0.16)'
      ctx.stroke()
      drawSigil(ctx, extraction, sigilX, sigilY, sigilSize)

      ctx.fillStyle = 'rgba(244,201,93,0.94)'
      ctx.font = '15px monospace'
      ctx.fillText('INTENTION', 96, 724)

      ctx.fillStyle = '#f8fafc'
      ctx.font = '600 58px Georgia, serif'
      wrapText(ctx, extraction.title, 96, 792, width - 192, 68, 3)

      ctx.fillStyle = 'rgba(226,232,240,0.88)'
      ctx.font = '29px Georgia, serif'
      wrapText(ctx, extraction.distilled_intention, 96, 982, width - 192, 40, 4)

      roundRect(ctx, 96, 1120, width - 192, 108, 24)
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.stroke()

      ctx.fillStyle = 'rgba(226,232,240,0.56)'
      ctx.font = '14px monospace'
      ctx.fillText('MOTIFS', 124, 1152)
      ctx.fillStyle = '#dbe4ef'
      ctx.font = '22px Georgia, serif'
      wrapText(ctx, extraction.visual_motifs.slice(0, 4).join('  ·  '), 124, 1192, width - 248, 28, 2)

      ctx.fillStyle = 'rgba(226,232,240,0.45)'
      ctx.font = '15px monospace'
      ctx.fillText(shareUrl, 96, height - 82)
      ctx.fillStyle = 'rgba(244,201,93,0.82)'
      ctx.font = '600 16px Georgia, serif'
      ctx.fillText('Open the full ritual on Dreamscape', 96, height - 108)
    }

    render()
    return () => {
      cancelled = true
    }
  }, [extraction, imageUrl, shareHandle, shareUrl])

  const saveImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${slugify(extraction.title)}-vision.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const shareNative = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return saveImage()
    const file = new File([blob], `${slugify(extraction.title)}-vision.png`, { type: 'image/png' })
    const text = `${extraction.title} — ${extraction.distilled_intention}`

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text, url: shareUrl })
        return
      } catch {}
    }

    if (navigator.share) {
      try {
        await navigator.share({ text, url: shareUrl })
        return
      } catch {}
    }

    saveImage()
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <div className="rounded-[1.75rem] p-4 space-y-3" style={{ background: 'linear-gradient(180deg, rgba(15,15,26,0.74), rgba(10,12,18,0.78))', border: '1px solid rgba(192,132,252,0.16)' }}>
      <div>
        <div className="text-xs uppercase tracking-[0.16em]" style={{ color: '#d8b4fe' }}>Poster Export</div>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Export a social-first vision poster with hero image, sigil seal, and ritual headline.
        </p>
      </div>

      <div className="rounded-[1.5rem] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <canvas ref={canvasRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={saveImage} className="px-3 py-2 rounded-xl text-xs" style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
          Save Image
        </button>
        <button onClick={shareNative} className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(192,132,252,0.16)', border: '1px solid rgba(192,132,252,0.26)', color: '#e9d5ff' }}>
          Share Card
        </button>
        <button onClick={copyLink} className="px-3 py-2 rounded-xl text-xs" style={{ border: '1px solid rgba(244,201,93,0.18)', color: '#f4c95d' }}>
          {copied ? 'Copied Link' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  let objectUrl: string | null = null
  try {
    const resolved = src.startsWith('data:') ? src : await fetch(src).then(async (response) => {
      const blob = await response.blob()
      objectUrl = URL.createObjectURL(blob)
      return objectUrl
    })

    return await new Promise((resolve) => {
      const image = new Image()
      image.onload = () => {
        resolve(image)
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
      image.onerror = () => {
        resolve(null)
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
      image.src = resolved
    })
  } catch {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    return null
  }
}

function drawFallbackPanel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, 'rgba(244,201,93,0.18)')
  gradient.addColorStop(0.5, 'rgba(192,132,252,0.14)')
  gradient.addColorStop(1, 'rgba(148,163,184,0.10)')
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, width, height)
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  const glow = ctx.createRadialGradient(x, y, 20, x, y, radius)
  glow.addColorStop(0, color)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

function drawCoverImage(ctx: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, width: number, height: number) {
  const native = image as HTMLImageElement
  const ratio = Math.max(width / native.width, height / native.height)
  const drawWidth = native.width * ratio
  const drawHeight = native.height * ratio
  const drawX = x + (width - drawWidth) / 2
  const drawY = y + (height - drawHeight) / 2
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

function drawSigil(ctx: CanvasRenderingContext2D, extraction: VisionExtraction, x: number, y: number, size: number) {
  const recipe = extraction.sigil_recipe
  const data = createSigilRenderData(recipe, size)
  const center = size / 2
  ctx.save()
  ctx.translate(x, y)

  ctx.strokeStyle = 'rgba(192, 132, 252, 0.26)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(center, center, size * 0.46, 0, Math.PI * 2)
  ctx.stroke()

  for (const ring of data.rings) {
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.22)'
    ctx.lineWidth = recipe.geometry.line_weight * 0.8
    ctx.beginPath()
    ctx.arc(center, center, ring.radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  for (const spoke of data.spokes) {
    ctx.strokeStyle = 'rgba(244, 201, 93, 0.38)'
    ctx.lineWidth = recipe.geometry.line_weight
    ctx.beginPath()
    ctx.moveTo(spoke.x1, spoke.y1)
    ctx.lineTo(spoke.x2, spoke.y2)
    ctx.stroke()
  }

  if (data.starPath) {
    traceSvgPath(ctx, data.starPath)
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.66)'
    ctx.lineWidth = recipe.geometry.line_weight * 1.1
    ctx.stroke()
  }

  traceSvgPath(ctx, data.glyphPath)
  ctx.strokeStyle = 'rgba(244, 201, 93, 0.95)'
  ctx.lineWidth = recipe.geometry.line_weight * 1.5
  ctx.stroke()

  for (const rune of data.runeMarks) {
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.44)'
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.moveTo(rune.x1, rune.y1)
    ctx.lineTo(rune.x2, rune.y2)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(244, 201, 93, 0.88)'
  ctx.beginPath()
  ctx.arc(center, center, size * 0.03, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function traceSvgPath(ctx: CanvasRenderingContext2D, path: string) {
  const tokens = path.trim().split(/\s+/)
  ctx.beginPath()
  let index = 0
  while (index < tokens.length) {
    const token = tokens[index]
    if (token === 'M' || token === 'L') {
      const x = Number(tokens[index + 1])
      const y = Number(tokens[index + 2])
      if (token === 'M') ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
      index += 3
      continue
    }
    if (token.includes(',')) {
      const [x, y] = token.split(',').map(Number)
      ctx.lineTo(x, y)
      index += 1
      continue
    }
    index += 1
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines - 1) break
    } else {
      line = testLine
    }
  }

  const consumedWords = lines.join(' ').split(/\s+/).filter(Boolean).length
  const remaining = words.slice(consumedWords)
  if (remaining.length > 0) {
    const finalLine = lines.length === maxLines - 1 ? ellipsizeToWidth(ctx, remaining.join(' '), maxWidth) : remaining.join(' ')
    lines.push(finalLine)
  }

  lines.slice(0, maxLines).forEach((current, index) => {
    ctx.fillText(current, x, y + index * lineHeight)
  })
}

function ellipsizeToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let value = text
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1)
  }
  return `${value}…`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'vision'
}
