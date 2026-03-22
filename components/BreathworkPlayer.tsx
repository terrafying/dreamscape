'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  VERTS_24, EDGES_24, VERTS_16, EDGES_16,
  VERTS_TESSERACT, EDGES_TESSERACT, VERTS_5CELL, EDGES_5CELL,
  rotate4D, proj4to3, proj3to2, type Vec4,
} from '@/lib/geometry4d'

// ─── Shape registry ───────────────────────────────────────────────────────────

const SHAPES = [
  { verts: VERTS_24,         edges: EDGES_24,         name: '24-cell',    scale: 1.00 },
  { verts: VERTS_TESSERACT,  edges: EDGES_TESSERACT,  name: 'Tesseract',  scale: 0.55 },
  { verts: VERTS_16,         edges: EDGES_16,         name: '16-cell',    scale: 1.05 },
  { verts: VERTS_5CELL,      edges: EDGES_5CELL,      name: '5-cell',     scale: 1.05 },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type PhaseType = 'inhale' | 'inhale2' | 'hold' | 'exhale' | 'hold-out' | 'retention'

interface Phase { type: PhaseType; seconds: number; label: string; guidance?: string }

interface BreathPattern {
  id: string
  name: string
  icon: string
  tagline: string
  category: string
  color: string
  sequence: Phase[]
  retentionCycles?: number
  retention?: Phase
  recoverySequence?: Phase[]
}

interface PhaseState {
  idx: number
  cycleCount: number
  phaseStart: number
  stage: 'normal' | 'retention' | 'recovery'
  recoveryIdx: number
}

// ─── Patterns ─────────────────────────────────────────────────────────────────

const PATTERNS: BreathPattern[] = [
  {
    id: 'phys-sigh',
    name: 'Physiological Sigh',
    icon: '⇑',
    tagline: 'Fastest anxiety reset known. Stanford-validated double inhale, long exhale.',
    category: 'Reset',
    color: '#38bdf8',
    sequence: [
      { type: 'inhale', seconds: 2, label: 'Inhale through nose' },
      { type: 'inhale2', seconds: 1, label: 'Top-up sniff' },
      { type: 'exhale', seconds: 8, label: 'Long exhale through mouth' },
    ],
  },
  {
    id: 'box',
    name: 'Box Breathing',
    icon: '▢',
    tagline: 'Equal 4-4-4-4 cycle. Navy SEAL cortisol reset protocol.',
    category: 'Calm',
    color: '#60a5fa',
    sequence: [
      { type: 'inhale', seconds: 4, label: 'Inhale' },
      { type: 'hold', seconds: 4, label: 'Hold full' },
      { type: 'exhale', seconds: 4, label: 'Exhale' },
      { type: 'hold-out', seconds: 4, label: 'Hold empty' },
    ],
  },
  {
    id: '478',
    name: '4-7-8',
    icon: '◎',
    tagline: 'Extended hold activates deep parasympathetic — Dr Weil sleep induction.',
    category: 'Sleep',
    color: '#a78bfa',
    sequence: [
      { type: 'inhale', seconds: 4, label: 'Inhale' },
      { type: 'hold', seconds: 7, label: 'Hold' },
      { type: 'exhale', seconds: 8, label: 'Exhale' },
    ],
  },
  {
    id: 'coherent',
    name: 'Coherent',
    icon: '∿',
    tagline: '5-5 resonance frequency tunes heart rate variability and vagal tone.',
    category: 'Balance',
    color: '#34d399',
    sequence: [
      { type: 'inhale', seconds: 5, label: 'Inhale' },
      { type: 'exhale', seconds: 5, label: 'Exhale' },
    ],
  },
  {
    id: 'wim-hof',
    name: 'Wim Hof',
    icon: '❄',
    tagline: '30 power breaths → empty retention. Alkalises blood, heightens focus.',
    category: 'Activate',
    color: '#fbbf24',
    sequence: [
      { type: 'inhale', seconds: 1.5, label: 'Power inhale (fill fully)' },
      { type: 'exhale', seconds: 1.5, label: 'Passive release' },
    ],
    retentionCycles: 30,
    retention: { type: 'retention', seconds: 90, label: 'Hold — release when you need to' },
    recoverySequence: [
      { type: 'inhale', seconds: 3, label: 'Recovery: deep inhale' },
      { type: 'hold', seconds: 15, label: 'Hold full' },
      { type: 'exhale', seconds: 4, label: 'Slow release' },
    ],
  },
  {
    id: 'holotropic',
    name: 'Holotropic',
    icon: '∞',
    tagline: 'Continuous circular breathing — no pauses. Expanded state protocol.',
    category: 'Transcend',
    color: '#f472b6',
    sequence: [
      { type: 'inhale', seconds: 2.5, label: 'Inhale (continuous, no pause)' },
      { type: 'exhale', seconds: 2.5, label: 'Exhale (continuous, connected)' },
    ],
  },
  {
    id: 'tummo',
    name: 'Tummo',
    icon: '🜂',
    tagline: 'Tibetan inner heat — vase breathing builds pranic fire.',
    category: 'Transcend',
    color: '#fb923c',
    sequence: [
      { type: 'inhale', seconds: 5, label: 'Inhale deep, belly first' },
      { type: 'hold', seconds: 3, label: 'Vase hold — push down gently' },
      { type: 'exhale', seconds: 5, label: 'Slow release' },
      { type: 'hold-out', seconds: 2, label: 'Empty pause' },
    ],
  },
  {
    id: 'kapalabhati',
    name: 'Kapalabhati',
    icon: '⚡',
    tagline: 'Rapid exhale pumps — skull shining breath. Clears CO₂, ignites prana.',
    category: 'Activate',
    color: '#f97316',
    sequence: [
      { type: 'inhale', seconds: 0.4, label: 'Passive inhale' },
      { type: 'exhale', seconds: 0.25, label: 'Sharp pump out' },
    ],
  },
  {
    id: 'jhana1',
    name: 'First Jhana',
    icon: '🕯',
    tagline: 'Applied and sustained thought — the gateway absorption.',
    category: 'Meditate',
    color: '#fbbf24',
    sequence: [
      {
        type: 'inhale', seconds: 12, label: 'Settle in',
        guidance: 'Sit comfortably. Bring attention to the breath at the nostrils — the cool sensation of the in-breath, the warmth of the out. Let the breath find its own natural rhythm. As thoughts arise, note them gently and return to the breath. The mind is restless at first — this is normal. With each return, the mind grows calmer.',
      },
    ],
  },
  {
    id: 'jhana2',
    name: 'Second Jhana',
    icon: '◈',
    tagline: 'Rapture and pleasure — internal brightness, one-pointedness.',
    category: 'Meditate',
    color: '#fb923c',
    sequence: [
      {
        type: 'inhale', seconds: 12, label: 'Settle deeper',
        guidance: 'The breath has grown still and subtle. Let attention move from the nostrils to the whole body — you may feel warmth, tingling, or a sense of lightness. Rapture begins as small waves of pleasure washing through the body. You are aware of the breath, but the breath is no longer the object — pleasure is. Rest here. If the mind wanders, return to the feeling of warmth.',
      },
    ],
  },
  {
    id: 'jhana3',
    name: 'Third Jhana',
    icon: '◇',
    tagline: 'Fading rapture — equanimity toward the pleasant.',
    category: 'Meditate',
    color: '#a78bfa',
    sequence: [
      {
        type: 'inhale', seconds: 12, label: 'Rest in equanimity',
        guidance: 'The rapture is fading now. What remains is a quiet, pleasurable equanimity — neither excited nor dull. You may feel like you are resting in perfect balance. The breath has become very subtle, almost imperceptible. This is the third jhana: the equanimity that arises when pleasure is no longer clung to. Simply rest. Do nothing. Be.',
      },
    ],
  },
  {
    id: 'jhana4',
    name: 'Fourth Jhana',
    icon: '◻',
    tagline: 'Pure equanimity — neither pleasure nor pain. The mind is one.',
    category: 'Meditate',
    color: '#94a3b8',
    sequence: [
      {
        type: 'inhale', seconds: 12, label: 'Pure equanimity',
        guidance: 'Neither pleasure nor pain. Neither good nor bad. The mind is perfectly clean, perfectly still, perfectly aware. There is no object of attention — only awareness itself. Rest here. If any sensation arises — warmth, cold, a thought — do not grasp, do not repel. Let it pass through awareness like light through glass. The mind has come to rest in its own nature.',
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function getPhase(p: BreathPattern, s: PhaseState): Phase {
  if (s.stage === 'retention') return p.retention!
  if (s.stage === 'recovery') return p.recoverySequence![s.recoveryIdx]
  return p.sequence[s.idx]
}

function advance(s: PhaseState, p: BreathPattern, ts: number): void {
  s.phaseStart = ts
  if (s.stage === 'retention') {
    if (p.recoverySequence?.length) {
      s.stage = 'recovery'
      s.recoveryIdx = 0
    } else {
      s.stage = 'normal'
      s.idx = 0
      s.cycleCount++
    }
    return
  }
  if (s.stage === 'recovery') {
    s.recoveryIdx++
    if (s.recoveryIdx >= (p.recoverySequence?.length ?? 0)) {
      s.stage = 'normal'
      s.idx = 0
      s.cycleCount++
    }
    return
  }
  s.idx = (s.idx + 1) % p.sequence.length
  if (s.idx === 0) {
    s.cycleCount++
    if (p.retentionCycles && s.cycleCount > 0 && s.cycleCount % p.retentionCycles === 0) {
      s.stage = 'retention'
    }
  }
}

type Angles = { xy: number; zw: number; xz: number; yw: number; lastTs: number }

function drawScene(
  ctx: CanvasRenderingContext2D,
  sz: number,
  progress: number,
  hex: string,
  t: number,
  ang: Angles,
  verts: Vec4[],
  edges: [number, number][],
  shapeScale: number,
): void {
  const cx = sz / 2
  const cy = sz / 2
  const ri = parseInt(hex.slice(1, 3), 16)
  const gi = parseInt(hex.slice(3, 5), 16)
  const bi = parseInt(hex.slice(5, 7), 16)

  ctx.clearRect(0, 0, sz, sz)

  // Background glow — breathes with progress
  const glowR = sz * (0.18 + 0.28 * progress)
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
  glow.addColorStop(0, `rgba(${ri},${gi},${bi},${(0.04 + 0.09 * progress).toFixed(3)})`)
  glow.addColorStop(1, `rgba(${ri},${gi},${bi},0)`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, sz, sz)

  // Scale polytope with breath — base scale fills ~70% of canvas at rest, 90% on full inhale
  const scale = sz * (3.2 + 0.8 * progress) * shapeScale

  // Rotate and project vertices
  const pts = verts.map((v) => {
    let r = rotate4D(v, ang.xy, 0, 1)
    r = rotate4D(r, ang.zw, 2, 3)
    r = rotate4D(r, ang.xz, 0, 2)
    r = rotate4D(r, ang.yw, 1, 3)
    const v3 = proj4to3(r)
    return { p2: proj3to2(v3, 3.5, scale, cx, cy), w: r[3] }
  })

  // Draw edges — alpha and width vary by 4D depth (w coordinate)
  for (const [a, b] of edges) {
    const wAvg = (pts[a].w + pts[b].w) * 0.5
    // Clamp w to [-2, 2] to handle all shape magnitudes uniformly
    const depth = Math.max(0, Math.min(1, (wAvg + 2.1) / 4.2))
    const alpha = ((0.06 + 0.68 * depth) * (0.3 + 0.7 * progress)).toFixed(3)
    ctx.beginPath()
    ctx.moveTo(pts[a].p2[0], pts[a].p2[1])
    ctx.lineTo(pts[b].p2[0], pts[b].p2[1])
    ctx.strokeStyle = `rgba(${ri},${gi},${bi},${alpha})`
    ctx.lineWidth = 0.4 + 1.1 * depth
    ctx.stroke()
  }

  // Pulse ring on hold-full (sz-relative, not scale-relative)
  if (progress > 0.88) {
    const pulse = (0.5 + 0.5 * Math.sin(t * 2.2)) * 0.3 * ((progress - 0.88) / 0.12)
    ctx.beginPath()
    ctx.arc(cx, cy, sz * (0.42 + 0.04 * progress), 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${ri},${gi},${bi},${pulse.toFixed(3)})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BreathworkPlayer({ onPlayingChange }: { onPlayingChange?: (p: boolean) => void } = {}) {
  const [playing, setPlaying] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showGuidance, setShowGuidance] = useState(false)
  const [display, setDisplay] = useState({ label: '', countdown: 0, cycleCount: 0, stage: 'normal' as string, guidance: '' as string })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const playRef = useRef(false)
  const patRef = useRef(0)
  const stateRef = useRef<PhaseState>({ idx: 0, cycleCount: 0, phaseStart: 0, stage: 'normal', recoveryIdx: 0 })
  const lastCdRef = useRef(-1)
  const lastStageRef = useRef('')
  const anglesRef = useRef<Angles>({ xy: 0, zw: 0, xz: 0, yw: 0, lastTs: 0 })
  const shapeRef = useRef(0)
  const SZ = 280

  useEffect(() => {
    const c = canvasRef.current!
    const dpr = window.devicePixelRatio || 1
    c.width = SZ * dpr
    c.height = SZ * dpr
    c.style.width = `${SZ}px`
    c.style.height = `${SZ}px`
    c.getContext('2d')!.scale(dpr, dpr)
  }, [])

  useEffect(() => () => { playRef.current = false; cancelAnimationFrame(rafRef.current) }, [])

  const loop = useCallback((ts: number) => {
    if (!playRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const p = PATTERNS[patRef.current]
    const s = stateRef.current
    const phase = getPhase(p, s)
    if ((ts - s.phaseStart) / 1000 >= phase.seconds) advance(s, p, ts)

    const cp = getPhase(p, s)
    const ce = (ts - s.phaseStart) / 1000
    const pr = Math.min(ce / cp.seconds, 1)
    const et = easeInOut(pr)

    let orb = 0
    switch (cp.type) {
      case 'inhale':    orb = et; break
      case 'inhale2':   orb = 1; break
      case 'hold':      orb = 1; break
      case 'exhale':    orb = 1 - et; break
      case 'hold-out':  orb = 0; break
      case 'retention': orb = 0.15 + 0.04 * Math.sin(ts * 0.0015); break
    }

    // Advance 4D rotation angles
    const ang = anglesRef.current
    if (ang.lastTs > 0) {
      const dt = Math.min((ts - ang.lastTs) / 1000, 0.05)
      ang.xy += dt * 0.31
      ang.zw += dt * 0.31  // isoclinic: same speed as xy
      ang.xz += dt * 0.17
      ang.yw += dt * 0.09
    }
    ang.lastTs = ts
    const sh = SHAPES[shapeRef.current]
    drawScene(ctx, SZ, orb, p.color, ts / 1000, ang, sh.verts, sh.edges, sh.scale)

    const cd = Math.max(Math.ceil(cp.seconds - ce), 0)
    if (cd !== lastCdRef.current || s.stage !== lastStageRef.current) {
      lastCdRef.current = cd
      lastStageRef.current = s.stage
      setDisplay({ label: cp.label, countdown: cd, cycleCount: s.cycleCount, stage: s.stage, guidance: cp.guidance ?? '' })
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const toggle = () => {
    if (playing) {
      playRef.current = false
      cancelAnimationFrame(rafRef.current)
      anglesRef.current = { xy: 0, zw: 0, xz: 0, yw: 0, lastTs: 0 }
      setPlaying(false)
      onPlayingChange?.(false)
      lastCdRef.current = -1
      lastStageRef.current = ''
      setDisplay({ label: '', countdown: 0, cycleCount: 0, stage: 'normal', guidance: '' })
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, SZ, SZ)
    } else {
      shapeRef.current = Math.floor(Math.random() * SHAPES.length)
      patRef.current = selectedIdx
      stateRef.current = { idx: 0, cycleCount: 0, phaseStart: performance.now(), stage: 'normal', recoveryIdx: 0 }
      playRef.current = true
      setPlaying(true)
      onPlayingChange?.(true)
      const fp = PATTERNS[selectedIdx].sequence[0]
      setDisplay({ label: fp.label, countdown: Math.ceil(fp.seconds), cycleCount: 0, stage: 'normal', guidance: fp.guidance ?? '' })
      rafRef.current = requestAnimationFrame(loop)
    }
  }

  const pat = PATTERNS[selectedIdx]

  return (
    <div className="space-y-5">

      {/* Pattern grid */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Breathwork Pattern
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PATTERNS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => !playing && setSelectedIdx(i)}
              className="text-left rounded-xl p-3 transition-all"
              style={{
                background: selectedIdx === i ? `${p.color}14` : 'rgba(15,15,26,0.7)',
                border: `1px solid ${selectedIdx === i ? `${p.color}55` : 'var(--border)'}`,
                opacity: playing && selectedIdx !== i ? 0.35 : 1,
                cursor: playing && selectedIdx !== i ? 'default' : 'pointer',
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span style={{ color: p.color, fontSize: '13px' }}>{p.icon}</span>
                <span className="text-xs font-medium" style={{ color: selectedIdx === i ? p.color : 'var(--text)' }}>
                  {p.name}
                </span>
                {playing && selectedIdx === i && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: p.color, animation: 'pulse-dot 1.5s infinite' }} />
                )}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.05em' }}>{p.category.toUpperCase()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Polytope canvas */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex items-center justify-center">
          <canvas ref={canvasRef} style={{ display: 'block' }} />
          {/* Overlay: only show idle hint — let the shape dominate when playing */}
          {!playing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: 'none' }}>
              <div className="text-center">
                <div style={{ fontSize: '26px', color: 'var(--muted)', opacity: 0.4 }}>{pat.icon}</div>
                <div className="text-xs mt-1 font-mono" style={{ color: 'var(--muted)', opacity: 0.3 }}>
                  {pat.sequence.map(p => p.seconds).join(' · ')}s
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phase info below canvas — compact, non-intrusive */}
        <div className="text-center" style={{ minHeight: '2.5rem' }}>
          {playing && (
            <>
              <div className="text-sm font-medium" style={{ color: pat.color }}>{display.label}</div>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                  {display.countdown}s
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>·</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {display.stage === 'retention'
                    ? 'empty retention'
                    : display.stage === 'recovery'
                    ? 'recovery'
                    : `cycle ${display.cycleCount + 1}`}
                </span>
                {display.guidance && (
                  <button
                    onClick={() => setShowGuidance(v => !v)}
                    className="ml-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ border: `1px solid ${pat.color}40`, color: pat.color, opacity: 0.7 }}
                  >
                    {showGuidance ? 'hide' : 'guide'}
                  </button>
                )}
              </div>
              {showGuidance && display.guidance && (
                <div
                  className="mt-3 px-4 py-3 rounded-xl text-sm text-left max-w-xs mx-auto"
                  style={{
                    background: `${pat.color}0a`,
                    border: `1px solid ${pat.color}25`,
                    color: 'var(--text)',
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    lineHeight: 1.7,
                  }}
                >
                  {display.guidance}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={toggle}
        className="w-full py-4 rounded-2xl text-sm font-medium transition-all duration-300"
        style={{
          background: playing ? `${pat.color}18` : pat.color,
          border: `1px solid ${playing ? `${pat.color}55` : 'transparent'}`,
          color: playing ? pat.color : '#07070f',
        }}
      >
        {playing ? `◼  Stop · ${pat.name}` : `▶  Begin · ${pat.name}`}
      </button>

      {/* Info */}
      {!playing && (
        <div
          className="rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: 'rgba(15,15,26,0.5)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          <span className="font-medium" style={{ color: 'var(--text)' }}>{pat.name} — </span>
          {pat.tagline}
          {pat.retentionCycles && (
            <span> Exhale fully and hold after every {pat.retentionCycles} cycles. Inhale when you must.</span>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
      `}</style>
    </div>
  )
}
