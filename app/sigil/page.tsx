'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  condenseSigilPhrase,
  buildSigilRecipe,
  createSigilRenderData,
  type SigilRenderData,
} from '@/lib/sigil'
import type { SigilRecipe } from '@/lib/types'

// ─── Animated SVG Sigil ───────────────────────────────────────────────────────

function SigilSVG({
  renderData,
  recipe,
  active,
  size = 320,
}: {
  renderData: SigilRenderData
  recipe: SigilRecipe
  active: boolean
  size?: number
}) {
  const [opacity, setOpacity] = useState(0)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)
  const [glowIntensity, setGlowIntensity] = useState(0.3)
  const svgRef = useRef<SVGSVGElement>(null)

  const PALETTE = recipe.style.palette
  const primary = PALETTE[0] ?? '#f4c95d'
  const secondary = PALETTE[1] ?? '#c084fc'
  const tertiary = PALETTE[2] ?? '#94a3b8'

  useEffect(() => {
    setOpacity(0)
    const timeout = setTimeout(() => {
      const animate = () => {
        tRef.current += 0.01
        const pulse = active
          ? 0.6 + Math.sin(tRef.current * 1.8) * 0.4
          : 0.3 + Math.sin(tRef.current * 0.6) * 0.15
        setGlowIntensity(pulse)
        frameRef.current = requestAnimationFrame(animate)
      }
      frameRef.current = requestAnimationFrame(animate)
    }, 100)
    setTimeout(() => setOpacity(1), 200)
    return () => {
      cancelAnimationFrame(frameRef.current)
      clearTimeout(timeout)
    }
  }, [active, recipe.seed])

  const cx = size / 2
  const cy = size / 2
  const scale = size / 240

  const scaledRings = renderData.rings.map(r => ({ radius: r.radius * scale }))
  const scaledSpokes = renderData.spokes.map(s => ({
    x1: cx + (s.x1 - 120) * scale,
    y1: cy + (s.y1 - 120) * scale,
    x2: cx + (s.x2 - 120) * scale,
    y2: cy + (s.y2 - 120) * scale,
  }))
  const scaleCoord = (n: number, base: number) => base + (n - 120) * scale

  const scaledGlyphPath = renderData.glyphPath.replace(
    /([ML])\s*([\d.]+)\s+([\d.]+)/g,
    (_, cmd, x, y) =>
      `${cmd} ${scaleCoord(parseFloat(x), cx).toFixed(2)} ${scaleCoord(parseFloat(y), cy).toFixed(2)}`
  )

  const scaledStarPath = renderData.starPath.replace(
    /([\d.]+)\s+([\d.]+)/g,
    (_, x, y) =>
      `${scaleCoord(parseFloat(x), cx).toFixed(2)} ${scaleCoord(parseFloat(y), cy).toFixed(2)}`
  )

  const scaledRunes = renderData.runeMarks.map(r => ({
    x1: cx + (r.x1 - 120) * scale,
    y1: cy + (r.y1 - 120) * scale,
    x2: cx + (r.x2 - 120) * scale,
    y2: cy + (r.y2 - 120) * scale,
  }))

  const outerR = (size * 0.36) * (scaledRings.at(-1)?.radius ?? 86.4) / 86.4

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        opacity,
        transition: 'opacity 0.8s ease',
        filter: `drop-shadow(0 0 ${Math.round(glowIntensity * 24)}px ${primary}66)`,
      }}
    >
      <defs>
        <radialGradient id="sigilBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={primary} stopOpacity={glowIntensity * 0.08} />
          <stop offset="100%" stopColor={primary} stopOpacity={0} />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={size * 0.48} fill="url(#sigilBg)" />

      {/* Rings */}
      {scaledRings.map((ring, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={ring.radius}
          fill="none"
          stroke={i === scaledRings.length - 1 ? primary : tertiary}
          strokeWidth={i === scaledRings.length - 1 ? recipe.geometry.line_weight : 0.5}
          strokeOpacity={active ? 0.5 : 0.2}
        />
      ))}

      {/* Outer border */}
      {recipe.style.border_mode !== 'none' && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={size * 0.44}
            fill="none"
            stroke={primary}
            strokeWidth={0.8}
            strokeOpacity={active ? 0.6 : 0.25}
          />
          {recipe.style.border_mode === 'double-circle' && (
            <circle
              cx={cx}
              cy={cy}
              r={size * 0.46}
              fill="none"
              stroke={primary}
              strokeWidth={0.4}
              strokeOpacity={active ? 0.3 : 0.12}
            />
          )}
        </>
      )}

      {/* Spokes */}
      {scaledSpokes.map((s, i) => (
        <line
          key={i}
          x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={tertiary}
          strokeWidth={0.5}
          strokeOpacity={active ? 0.3 : 0.12}
        />
      ))}

      {/* Star polygon */}
      {scaledStarPath && (
        <path
          d={scaledStarPath}
          fill="none"
          stroke={secondary}
          strokeWidth={recipe.geometry.line_weight}
          strokeOpacity={active ? 0.7 : 0.3}
          strokeLinejoin="round"
          filter="url(#glow)"
        />
      )}

      {/* Glyph path (letter-based) */}
      {scaledGlyphPath && (
        <path
          d={scaledGlyphPath}
          fill="none"
          stroke={primary}
          strokeWidth={recipe.geometry.line_weight * 1.2}
          strokeOpacity={active ? 0.9 : 0.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
      )}

      {/* Rune marks */}
      {scaledRunes.map((r, i) => (
        <line
          key={i}
          x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke={primary}
          strokeWidth={1.5}
          strokeOpacity={active ? 0.8 : 0.3}
          strokeLinecap="round"
        />
      ))}

      {/* Center mark */}
      <circle
        cx={cx} cy={cy} r={3}
        fill={primary}
        fillOpacity={active ? 0.9 : 0.4}
        filter="url(#glow)"
      />
    </svg>
  )
}

// ─── Charge Ring Canvas ───────────────────────────────────────────────────────

function ChargeRing({ progress, sealed }: { progress: number; sealed: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sz = canvas.width
    const cx = sz / 2
    const cy = sz / 2
    const r = sz * 0.44

    ctx.clearRect(0, 0, sz, sz)

    // Background ring
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(244,201,93,0.1)'
    ctx.lineWidth = 3
    ctx.stroke()

    // Progress arc
    const angle = -Math.PI / 2 + progress * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, angle)
    ctx.strokeStyle = sealed ? '#c084fc' : '#f4c95d'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()

    // Glow dot at tip
    if (!sealed && progress > 0 && progress < 1) {
      const tipX = cx + Math.cos(angle) * r
      const tipY = cy + Math.sin(angle) * r
      const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 8)
      grad.addColorStop(0, 'rgba(244,201,93,0.9)')
      grad.addColorStop(1, 'rgba(244,201,93,0)')
      ctx.beginPath()
      ctx.arc(tipX, tipY, 8, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
    }
  }, [progress, sealed])

  return <canvas ref={canvasRef} width={40} height={40} style={{ width: 40, height: 40 }} />
}

// ─── Stage Types ──────────────────────────────────────────────────────────────

type Stage = 'compose' | 'forge' | 'charge' | 'sealed'

interface SigilArchiveEntry {
  id: string
  date: string
  intention: string
  recipe: SigilRecipe
  glyphLetters: string[]
  notes: string
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SigilPage() {
  const [stage, setStage] = useState<Stage>('compose')
  const [intention, setIntention] = useState('')
  const [glyphLetters, setGlyphLetters] = useState<string[]>([])
  const [removedLetters, setRemovedLetters] = useState<string[]>([])
  const [recipe, setRecipe] = useState<SigilRecipe | null>(null)
  const [renderData, setRenderData] = useState<SigilRenderData | null>(null)
  const [chargeSeconds, setChargeSeconds] = useState(60)
  const [chargeProgress, setChargeProgress] = useState(0)
  const [notes, setNotes] = useState('')
  const [archive, setArchive] = useState<SigilArchiveEntry[]>([])
  const chargeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sigil-archive')
      if (raw) setArchive(JSON.parse(raw))
    } catch {}
  }, [])

  const handleCondense = () => {
    if (!intention.trim()) return
    const condensed = condenseSigilPhrase(intention)
    setGlyphLetters(condensed.glyphLetters)
    setRemovedLetters(condensed.removed)
    const r = buildSigilRecipe(intention)
    const rd = createSigilRenderData(r, 320)
    setRecipe(r)
    setRenderData(rd)
    setStage('forge')
  }

  const handleBeginCharge = () => {
    setStage('charge')
    setChargeProgress(0)
    setChargeSeconds(60)
    chargeIntervalRef.current = setInterval(() => {
      setChargeSeconds(prev => {
        const next = prev - 1
        setChargeProgress((60 - next) / 60)
        if (next <= 0) {
          clearInterval(chargeIntervalRef.current!)
          setTimeout(() => setStage('sealed'), 600)
          return 0
        }
        return next
      })
    }, 1000)
  }

  const handleSeal = () => {
    if (!recipe) return
    const entry: SigilArchiveEntry = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString().split('T')[0],
      intention,
      recipe,
      glyphLetters,
      notes,
    }
    const updated = [entry, ...archive].slice(0, 20)
    setArchive(updated)
    try { localStorage.setItem('sigil-archive', JSON.stringify(updated)) } catch {}
  }

  const handleReset = () => {
    if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current)
    setStage('compose')
    setIntention('')
    setGlyphLetters([])
    setRemovedLetters([])
    setRecipe(null)
    setRenderData(null)
    setChargeProgress(0)
    setChargeSeconds(60)
    setNotes('')
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <h1
          className="text-2xl font-medium tracking-tight"
          style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
        >
          Sigil Forge
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          State your will. Reduce it. Charge it. Release it.
        </p>
      </div>

      {/* Stage indicator */}
      <div className="flex gap-6">
        {(['compose', 'forge', 'charge', 'sealed'] as Stage[]).map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: stage === s ? '#f4c95d' : s === 'sealed' && stage === 'sealed' ? '#c084fc' : 'rgba(255,255,255,0.15)',
                boxShadow: stage === s ? '0 0 6px #f4c95d88' : 'none',
              }}
            />
            <span
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: stage === s ? '#f4c95d' : 'rgba(255,255,255,0.2)' }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Stage: Compose */}
      {stage === 'compose' && (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'rgba(8,5,18,0.9)', border: '1px solid rgba(244,201,93,0.15)' }}
          >
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(244,201,93,0.5)' }}>
              State Your Will
            </div>
            <textarea
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="Write your intention as a clear, present-tense statement of will..."
              className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed outline-none resize-none"
              style={{
                background: 'rgba(15,15,26,0.8)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                minHeight: '120px',
              }}
              rows={5}
              data-no-swipe
            />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Write as if it is already so. Vowels will be removed, duplicate consonants collapsed —
              what remains becomes the glyph.
            </p>
          </div>
          <button
            onClick={handleCondense}
            disabled={!intention.trim()}
            className="w-full py-4 rounded-2xl text-sm font-medium transition-all"
            style={{
              background: intention.trim() ? 'rgba(244,201,93,0.12)' : 'rgba(244,201,93,0.04)',
              border: `1px solid ${intention.trim() ? 'rgba(244,201,93,0.35)' : 'rgba(244,201,93,0.1)'}`,
              color: intention.trim() ? '#f4c95d' : 'rgba(244,201,93,0.3)',
              letterSpacing: '0.2em',
              fontFamily: 'monospace',
            }}
          >
            ⬡ CONDENSE &amp; FORGE
          </button>
        </div>
      )}

      {/* Stage: Forge */}
      {(stage === 'forge' || stage === 'charge' || stage === 'sealed') && recipe && renderData && (
        <div className="space-y-6">
          {/* Reduction display */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(8,5,18,0.9)', border: '1px solid rgba(244,201,93,0.15)' }}
          >
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(244,201,93,0.5)' }}>
              Reduction
            </div>
            <div className="space-y-2">
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                Original: <span style={{ color: 'var(--text)' }}>{intention}</span>
              </div>
              {removedLetters.length > 0 && (
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  Removed (vowels + duplicates):{' '}
                  <span style={{ color: 'rgba(244,201,93,0.4)', fontFamily: 'monospace' }}>
                    {removedLetters.join(' ')}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {glyphLetters.map((l, i) => (
                  <span
                    key={i}
                    className="w-8 h-8 flex items-center justify-center rounded text-sm font-mono font-bold"
                    style={{
                      background: 'rgba(244,201,93,0.08)',
                      border: '1px solid rgba(244,201,93,0.3)',
                      color: '#f4c95d',
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sigil canvas */}
          <div className="flex justify-center relative">
            {stage === 'charge' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(0,0,0,0.3) 0%, transparent 70%)',
                  }}
                />
              </div>
            )}
            <SigilSVG
              renderData={renderData}
              recipe={recipe}
              active={stage === 'charge' || stage === 'sealed'}
              size={320}
            />
          </div>

          {/* Charge / sealed controls */}
          {stage === 'forge' && (
            <div className="space-y-3">
              <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Fix your gaze on the center point. Allow the form to blur.<br />
                When ready, begin the 60-second charge.
              </p>
              <button
                onClick={handleBeginCharge}
                className="w-full py-4 rounded-2xl text-sm font-medium transition-all"
                style={{
                  background: 'rgba(244,201,93,0.12)',
                  border: '1px solid rgba(244,201,93,0.35)',
                  color: '#f4c95d',
                  letterSpacing: '0.2em',
                  fontFamily: 'monospace',
                }}
              >
                ◎ BEGIN CHARGE
              </button>
              <button onClick={handleReset} className="w-full py-2 text-xs" style={{ color: 'var(--muted)' }}>
                ← Reforge
              </button>
            </div>
          )}

          {stage === 'charge' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <ChargeRing progress={chargeProgress} sealed={false} />
                <div className="text-center">
                  <div
                    className="text-3xl font-mono font-light"
                    style={{ color: '#f4c95d', letterSpacing: '0.1em' }}
                  >
                    {chargeSeconds}
                  </div>
                  <div className="text-xs font-mono uppercase tracking-widest mt-1" style={{ color: 'rgba(244,201,93,0.4)' }}>
                    seconds remaining
                  </div>
                </div>
                <ChargeRing progress={chargeProgress} sealed={false} />
              </div>
              <p className="text-xs text-center animate-pulse" style={{ color: 'rgba(244,201,93,0.5)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Hold the gaze. Let the will burn through.
              </p>
            </div>
          )}

          {stage === 'sealed' && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: '#c084fc' }}>
                  ✦ Sealed
                </div>
                <p className="text-xs italic" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}>
                  The charge is complete. Record any impressions, then release attachment to the outcome.
                </p>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Impressions during the charge, images, sensations..."
                className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed outline-none resize-none"
                style={{
                  background: 'rgba(15,15,26,0.8)',
                  border: '1px solid rgba(192,132,252,0.2)',
                  color: 'var(--text)',
                  minHeight: '100px',
                }}
                rows={4}
                data-no-swipe
              />
              <button
                onClick={() => { handleSeal(); handleReset() }}
                className="w-full py-4 rounded-2xl text-sm font-medium"
                style={{
                  background: 'rgba(192,132,252,0.12)',
                  border: '1px solid rgba(192,132,252,0.35)',
                  color: '#c084fc',
                  letterSpacing: '0.2em',
                  fontFamily: 'monospace',
                }}
              >
                ◼ ARCHIVE &amp; RELEASE
              </button>
            </div>
          )}
        </div>
      )}

      {/* Archive */}
      {archive.length > 0 && stage === 'compose' && (
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Archived Sigils
          </div>
          <div className="space-y-2">
            {archive.slice(0, 5).map(entry => (
              <div
                key={entry.id}
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(8,5,18,0.7)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{entry.date}</span>
                      <span className="text-[10px] font-mono" style={{ color: 'rgba(244,201,93,0.5)' }}>
                        {entry.glyphLetters.join('')}
                      </span>
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--text)' }}>{entry.intention}</p>
                    {entry.notes && (
                      <p className="text-xs mt-1 truncate" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                        {entry.notes.slice(0, 80)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
