'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Element Definitions ──────────────────────────────────────────────────────

type ElementId = 'earth' | 'water' | 'fire' | 'air' | 'akasha'

interface TattwaTattwa {
  id: ElementId
  name: string
  sanskrit: string
  symbol: string
  color: string
  complementary: string
  mantra: string
  description: string
  scryingPrompt: string
}

const TATTVAS: TattwaTattwa[] = [
  {
    id: 'earth',
    name: 'Earth',
    sanskrit: 'Prithivi',
    symbol: 'square',
    color: '#f4c95d',
    complementary: '#6b21d8',
    mantra: 'LAM',
    description: 'The principle of solidity. Foundation, endurance, the physical realm.',
    scryingPrompt: 'What terrain, landscape, or material form presented itself?',
  },
  {
    id: 'water',
    name: 'Water',
    sanskrit: 'Apas',
    symbol: 'crescent',
    color: '#94a3b8',
    complementary: '#c2410c',
    mantra: 'VAM',
    description: 'The principle of fluidity. Feeling, intuition, the unconscious depths.',
    scryingPrompt: 'What flowed, pooled, or reflected in the portal?',
  },
  {
    id: 'fire',
    name: 'Fire',
    sanskrit: 'Tejas',
    symbol: 'triangle',
    color: '#ef4444',
    complementary: '#16a34a',
    mantra: 'RAM',
    description: 'The principle of expansion. Will, transformation, purification.',
    scryingPrompt: 'What burned, illuminated, or transformed in the vision?',
  },
  {
    id: 'air',
    name: 'Air',
    sanskrit: 'Vayu',
    symbol: 'circle',
    color: '#60a5fa',
    complementary: '#ea580c',
    mantra: 'YAM',
    description: 'The principle of movement. Mind, breath, the realm of thought and spirit.',
    scryingPrompt: 'What moved, communicated, or dissolved into pure awareness?',
  },
  {
    id: 'akasha',
    name: 'Akasha',
    sanskrit: 'Akasha',
    symbol: 'egg',
    color: '#818cf8',
    complementary: '#ca8a04',
    mantra: 'HAM',
    description: 'The principle of space. The ground of all elements, pure consciousness.',
    scryingPrompt: 'What emerged from the void? What was the quality of the space itself?',
  },
]

// ─── Tattwa Canvas ────────────────────────────────────────────────────────────

function TattwCanvas({
  element,
  phase,
  gazeProgress,
}: {
  element: TattwaTattwa
  phase: 'gaze' | 'afterimage' | 'idle'
  gazeProgress: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)

  const drawSymbol = useCallback(
    (ctx: CanvasRenderingContext2D, sz: number, color: string, t: number, breathe: number) => {
      const cx = sz / 2
      const cy = sz / 2
      ctx.shadowBlur = 20 + breathe * 15
      ctx.shadowColor = color

      if (element.symbol === 'square') {
        const side = sz * 0.38 + breathe * sz * 0.02
        ctx.fillStyle = color
        ctx.fillRect(cx - side / 2, cy - side / 2, side, side)
      } else if (element.symbol === 'crescent') {
        const r = sz * 0.22 + breathe * sz * 0.01
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#030212'
        ctx.beginPath()
        ctx.arc(cx + r * 0.55, cy, r * 0.82, 0, Math.PI * 2)
        ctx.fill()
      } else if (element.symbol === 'triangle') {
        const h = sz * 0.42 + breathe * sz * 0.02
        const w = h * 1.15
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(cx, cy - h * 0.62)
        ctx.lineTo(cx + w / 2, cy + h * 0.38)
        ctx.lineTo(cx - w / 2, cy + h * 0.38)
        ctx.closePath()
        ctx.fill()
      } else if (element.symbol === 'circle') {
        const r = sz * 0.22 + breathe * sz * 0.01
        ctx.strokeStyle = color
        ctx.lineWidth = sz * 0.025
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
      } else if (element.symbol === 'egg') {
        const rx = sz * 0.16 + breathe * sz * 0.01
        const ry = sz * 0.22 + breathe * sz * 0.01
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
    },
    [element.symbol]
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sz = canvas.width
    tRef.current += 0.008

    ctx.clearRect(0, 0, sz, sz)
    ctx.fillStyle = '#030212'
    ctx.fillRect(0, 0, sz, sz)

    const breathe = Math.sin(tRef.current * 0.8) * 0.5 + 0.5
    const color = phase === 'afterimage' ? element.complementary : element.color

    if (phase === 'gaze' || phase === 'afterimage') {
      drawSymbol(ctx, sz, color, tRef.current, breathe * 0.3)
    }

    // Gaze progress ring (during gaze phase)
    if (phase === 'gaze') {
      const cx = sz / 2
      const cy = sz / 2
      const r = sz * 0.46
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + gazeProgress * Math.PI * 2)
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.5
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [element, phase, gazeProgress, drawSymbol])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      style={{ width: 300, height: 300, borderRadius: '50%' }}
    />
  )
}

// ─── Session Log ──────────────────────────────────────────────────────────────

interface TattwSession {
  id: string
  date: string
  element: ElementId
  notes: string
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TattwaPage() {
  const [activeElement, setActiveElement] = useState<ElementId>('fire')
  const [phase, setPhase] = useState<'idle' | 'gaze' | 'afterimage' | 'scrying'>('idle')
  const [gazeSeconds, setGazeSeconds] = useState(60)
  const [gazeProgress, setGazeProgress] = useState(0)
  const [afterImageSeconds, setAfterImageSeconds] = useState(10)
  const [notes, setNotes] = useState('')
  const [sessions, setSessions] = useState<TattwSession[]>([])
  const gazeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const afterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const element = TATTVAS.find(t => t.id === activeElement)!

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tattwa-sessions')
      if (raw) setSessions(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    // Reset when switching elements
    if (gazeIntervalRef.current) clearInterval(gazeIntervalRef.current)
    if (afterIntervalRef.current) clearInterval(afterIntervalRef.current)
    setPhase('idle')
    setGazeSeconds(60)
    setGazeProgress(0)
    setAfterImageSeconds(10)
    setNotes('')
  }, [activeElement])

  const startGaze = () => {
    setPhase('gaze')
    setGazeSeconds(60)
    setGazeProgress(0)
    gazeIntervalRef.current = setInterval(() => {
      setGazeSeconds(prev => {
        const next = prev - 1
        setGazeProgress((60 - next) / 60)
        if (next <= 0) {
          clearInterval(gazeIntervalRef.current!)
          startAfterimage()
          return 0
        }
        return next
      })
    }, 1000)
  }

  const startAfterimage = () => {
    setPhase('afterimage')
    setAfterImageSeconds(10)
    afterIntervalRef.current = setInterval(() => {
      setAfterImageSeconds(prev => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(afterIntervalRef.current!)
          setPhase('scrying')
          return 0
        }
        return next
      })
    }, 1000)
  }

  const saveSession = () => {
    const entry: TattwSession = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString().split('T')[0],
      element: activeElement,
      notes,
    }
    const updated = [entry, ...sessions].slice(0, 30)
    setSessions(updated)
    try { localStorage.setItem('tattwa-sessions', JSON.stringify(updated)) } catch {}
    setPhase('idle')
    setNotes('')
    setGazeSeconds(60)
    setGazeProgress(0)
  }

  const cancelSession = () => {
    if (gazeIntervalRef.current) clearInterval(gazeIntervalRef.current)
    if (afterIntervalRef.current) clearInterval(afterIntervalRef.current)
    setPhase('idle')
    setGazeSeconds(60)
    setGazeProgress(0)
    setAfterImageSeconds(10)
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <h1
          className="text-2xl font-medium tracking-tight"
          style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
        >
          Elemental Scrying
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Tattwa vision — fix the gaze, enter the afterimage portal, record what appears.
        </p>
      </div>

      {/* Element selector */}
      <div className="flex gap-2 flex-wrap">
        {TATTVAS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveElement(t.id)}
            disabled={phase !== 'idle'}
            className="px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition-all"
            style={{
              background: activeElement === t.id ? `${t.color}22` : 'rgba(15,15,26,0.7)',
              border: `1px solid ${activeElement === t.id ? t.color + '66' : 'var(--border)'}`,
              color: activeElement === t.id ? t.color : 'var(--muted)',
              opacity: phase !== 'idle' && activeElement !== t.id ? 0.4 : 1,
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Element info */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{
          background: 'rgba(8,5,18,0.9)',
          border: `1px solid ${element.color}22`,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{ background: `${element.color}18`, color: element.color, border: `1px solid ${element.color}44` }}
              >
                {element.sanskrit}
              </span>
              <span className="text-xs font-mono tracking-widest" style={{ color: 'var(--muted)' }}>
                {element.mantra}
              </span>
            </div>
            <h2
              className="text-xl font-medium"
              style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
            >
              {element.name}
            </h2>
          </div>
        </div>
        <p className="text-xs italic leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}>
          {element.description}
        </p>
      </div>

      {/* Tattwa canvas */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative"
          style={{
            borderRadius: '50%',
            boxShadow: `0 0 60px ${phase === 'afterimage' ? element.complementary : element.color}33`,
            transition: 'box-shadow 1s ease',
          }}
        >
          <TattwCanvas
            element={element}
            phase={phase === 'idle' ? 'idle' : phase === 'scrying' ? 'idle' : phase}
            gazeProgress={gazeProgress}
          />
        </div>

        {/* Phase label */}
        {phase === 'gaze' && (
          <div className="text-center space-y-1">
            <div className="text-3xl font-mono font-light" style={{ color: element.color }}>
              {gazeSeconds}
            </div>
            <div className="text-xs font-mono uppercase tracking-widest animate-pulse" style={{ color: `${element.color}88` }}>
              Fix your gaze · do not blink
            </div>
          </div>
        )}
        {phase === 'afterimage' && (
          <div className="text-center space-y-1">
            <div
              className="text-3xl font-mono font-light"
              style={{ color: element.complementary }}
            >
              {afterImageSeconds}
            </div>
            <div
              className="text-xs font-mono uppercase tracking-widest animate-pulse"
              style={{ color: `${element.complementary}88` }}
            >
              Portal open · look through
            </div>
          </div>
        )}
        {phase === 'idle' && (
          <p className="text-xs text-center" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Gaze at the center of the symbol for 60 seconds without blinking.<br />
            The afterimage becomes the portal.
          </p>
        )}
      </div>

      {/* Controls */}
      {phase === 'idle' && (
        <button
          onClick={startGaze}
          className="w-full py-4 rounded-2xl text-sm font-medium transition-all"
          style={{
            background: `${element.color}14`,
            border: `1px solid ${element.color}40`,
            color: element.color,
            letterSpacing: '0.2em',
            fontFamily: 'monospace',
          }}
        >
          ◎ BEGIN GAZE
        </button>
      )}
      {(phase === 'gaze' || phase === 'afterimage') && (
        <button
          onClick={cancelSession}
          className="w-full py-3 rounded-2xl text-xs"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Cancel
        </button>
      )}

      {/* Scrying notes */}
      {phase === 'scrying' && (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{
              background: `${element.complementary}0d`,
              border: `1px solid ${element.complementary}33`,
            }}
          >
            <div
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: element.complementary }}
            >
              Portal Notes
            </div>
            <p className="text-xs italic" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}>
              {element.scryingPrompt}
            </p>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Record your impressions while they are fresh..."
            className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed outline-none resize-none"
            style={{
              background: 'rgba(15,15,26,0.8)',
              border: `1px solid ${element.complementary}22`,
              color: 'var(--text)',
              minHeight: '120px',
            }}
            rows={5}
            data-no-swipe
            autoFocus
          />
          <button
            onClick={saveSession}
            className="w-full py-4 rounded-2xl text-sm font-medium"
            style={{
              background: `${element.complementary}14`,
              border: `1px solid ${element.complementary}44`,
              color: element.complementary,
              letterSpacing: '0.2em',
              fontFamily: 'monospace',
            }}
          >
            ◼ SEAL &amp; RECORD
          </button>
        </div>
      )}

      {/* Recent sessions */}
      {sessions.length > 0 && phase === 'idle' && (
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Recent Sessions
          </div>
          <div className="space-y-2">
            {sessions.slice(0, 5).map(s => {
              const el = TATTVAS.find(t => t.id === s.element)!
              return (
                <div
                  key={s.id}
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'rgba(8,5,18,0.7)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{s.date}</span>
                    <span
                      className="text-[10px] px-1.5 rounded-full font-mono"
                      style={{ background: `${el.color}18`, color: el.color }}
                    >
                      {el.name}
                    </span>
                  </div>
                  {s.notes && (
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{s.notes.slice(0, 120)}{s.notes.length > 120 ? '…' : ''}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
