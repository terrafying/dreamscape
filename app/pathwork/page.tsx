'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'purification' | 'invocation' | 'pathworking' | 'scrying' | 'closing' | 'done'
type Mode = 'tibetan' | 'western'

interface TibetanContent { mantra?: string; instruction: string }
interface WesternContent { lines?: string[]; close?: string; instruction: string }
interface PhaseConfig {
  id: Phase; label: string; duration: number; icon: string
  tibetan: TibetanContent; western: WesternContent
}

// ─── Phase definitions ────────────────────────────────────────────────────────

const PHASES: PhaseConfig[] = [
  {
    id: 'purification',
    label: 'Purification',
    duration: 180,
    icon: '◌',
    tibetan: {
      mantra: 'OM · AH · HUM',
      instruction: 'Seven slow breaths. OM — white light purifies body. AH — red light purifies speech. HUM — blue light purifies mind. Release the mundane with each exhale.',
    },
    western: {
      instruction: 'Seven slow breaths. With each exhale, release. Hold the intention: "I release what is small in me. I purify this space. I come before my Angel with sincerity."',
    },
  },
  {
    id: 'invocation',
    label: 'Invocation',
    duration: 420,
    icon: '◇',
    tibetan: {
      mantra: 'HOLY ANGEL · KNOW ME',
      instruction: 'Repeat rhythmically as mantra — 108 times. Face East. Let the rhythm carry you deeper than the words. You are calling your own deepest nature.',
    },
    western: {
      lines: [
        'Thee I invoke, the Bornless One.',
        'Thee, that didst create the earth and the heavens.',
        'Hear me and arise.',
        'Come forth and follow me.',
      ],
      instruction: 'Face East. Hold each line fully before moving to the next. Repeat the cycle.',
    },
  },
  {
    id: 'pathworking',
    label: 'Pathworking',
    duration: 600,
    icon: '△',
    tibetan: {
      instruction: 'You stand in silver-purple lunar light. A column rises above you ending in gold warmth. You are the ascending flame. Rise slowly along the pillar. Enter the golden solar heart. Rest there. Be present and available.',
    },
    western: {
      instruction: 'Visualize yourself in the silver-violet light of Yesod, the Moon sphere. The path of Samekh opens upward — fire and water mingling. Ascend to Tiphareth, the golden solar heart. Sit in that light, receptive. Wait without effort.',
    },
  },
  {
    id: 'scrying',
    label: 'Scrying',
    duration: 300,
    icon: '◉',
    tibetan: {
      instruction: 'Gaze softly at the center point without focusing. Release all effort. Your intention is already set. Let what arises arise without grasping or pushing away.',
    },
    western: {
      instruction: 'Soft gaze into the darkness. Intention: "Show me my nature." Do not reach — receive. Record any impressions below as they arise.',
    },
  },
  {
    id: 'closing',
    label: 'Closing',
    duration: 120,
    icon: '◌',
    tibetan: {
      mantra: 'OM · AH · HUM',
      instruction: 'By this merit may all beings realize their true nature. I dedicate this practice to awakening. Carry the warmth of the solar sphere with you.',
    },
    western: {
      close: 'AEĒIOUŌ',
      instruction: 'Holy Guardian Angel, attend me through this day. This work is sealed. Carry the warmth of Tiphareth with you.',
    },
  },
]

const PHASE_IDS = PHASES.map(p => p.id) as Phase[]

// ─── PathworkCanvas ────────────────────────────────────────────────────────────

function PathworkCanvas({ phase, progress }: { phase: Phase; progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)
  const starsRef = useRef<Array<{ x: number; y: number; r: number; spd: number }>>([])

  useEffect(() => {
    starsRef.current = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.6 + 0.2,
      spd: Math.random() * 5 + 2,
    }))
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width, H = canvas.height, cx = W / 2
    tRef.current += 0.01
    const t = tRef.current

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#05031a'
    ctx.fillRect(0, 0, W, H)

    const isPathworking = phase === 'pathworking'
    const isScrying = phase === 'scrying'
    const isClosing = phase === 'closing'
    const isActive = isPathworking || isClosing
    const dimmed = phase === 'idle' || phase === 'purification' || phase === 'invocation'

    if (!isScrying) {
      // Stars
      for (const s of starsRef.current) {
        const a = (dimmed ? 0.06 : 0.18) + Math.sin(t / s.spd) * 0.05
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,190,255,${a})`
        ctx.fill()
      }

      const yy = H * 0.77   // Yesod center
      const ty = H * 0.23   // Tiphareth center
      const pathTop = ty + 28
      const pathBottom = yy - 24

      // Connecting pillar
      const pG = ctx.createLinearGradient(cx, pathBottom, cx, pathTop)
      pG.addColorStop(0, `rgba(180,130,255,${isActive ? 0.45 : 0.1})`)
      pG.addColorStop(0.5, `rgba(220,190,255,${isActive ? 0.2 : 0.05})`)
      pG.addColorStop(1, `rgba(255,200,80,${isActive ? 0.45 : 0.1})`)
      ctx.strokeStyle = pG; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(cx, pathBottom); ctx.lineTo(cx, pathTop); ctx.stroke()

      // Yesod sphere
      const yPulse = dimmed ? 0.12 : 0.55 + Math.sin(t * 1.9) * 0.25
      const yGlow = ctx.createRadialGradient(cx, yy, 0, cx, yy, 52)
      yGlow.addColorStop(0, `rgba(160,100,255,${yPulse * 0.45})`)
      yGlow.addColorStop(1, 'rgba(100,50,180,0)')
      ctx.fillStyle = yGlow
      ctx.beginPath(); ctx.arc(cx, yy, 52, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx, yy, 24, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(180,120,255,${isActive ? 0.8 : 0.22})`
      ctx.lineWidth = 1.5; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, yy, 8, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(210,170,255,${isActive ? 0.7 : 0.18})`; ctx.fill()
      ctx.font = '8px monospace'
      ctx.fillStyle = `rgba(180,130,255,${isActive ? 0.65 : 0.22})`
      ctx.textAlign = 'center'
      ctx.fillText('YESOD · MOON', cx, yy + 38)

      // Tiphareth sphere
      const tPulse = dimmed ? 0.12 : 0.6 + Math.sin(t * 1.4) * 0.25
      const tGlow = ctx.createRadialGradient(cx, ty, 0, cx, ty, 64)
      tGlow.addColorStop(0, `rgba(255,200,80,${tPulse * 0.55})`)
      tGlow.addColorStop(1, 'rgba(180,120,0,0)')
      ctx.fillStyle = tGlow
      ctx.beginPath(); ctx.arc(cx, ty, 64, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx, ty, 30, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,200,80,${isActive ? 0.9 : 0.22})`
      ctx.lineWidth = 1.5; ctx.stroke()

      // Rotating cross at Tiphareth
      const cs = 10
      ctx.save(); ctx.translate(cx, ty); ctx.rotate(t * 0.18)
      ctx.beginPath()
      ctx.moveTo(-cs, 0); ctx.lineTo(cs, 0)
      ctx.moveTo(0, -cs); ctx.lineTo(0, cs)
      ctx.strokeStyle = `rgba(255,240,180,${isActive ? 0.85 : 0.18})`
      ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

      ctx.beginPath(); ctx.arc(cx, ty, 10, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,220,120,${isActive ? 0.8 : 0.18})`; ctx.fill()
      ctx.font = '8px monospace'
      ctx.fillStyle = `rgba(255,200,80,${isActive ? 0.65 : 0.22})`
      ctx.textAlign = 'center'
      ctx.fillText('TIPHARETH · SUN', cx, ty - 40)

      // Soul point — rises during pathworking, rests at Tiphareth during closing
      if (isPathworking || isClosing) {
        const p = isClosing ? 1 : progress
        const sY = pathBottom + p * (pathTop - pathBottom)
        const sp = 0.75 + Math.sin(t * 3) * 0.25
        const sGlow = ctx.createRadialGradient(cx, sY, 0, cx, sY, 16)
        sGlow.addColorStop(0, `rgba(255,255,200,${sp * 0.9})`)
        sGlow.addColorStop(0.5, `rgba(255,220,100,${sp * 0.5})`)
        sGlow.addColorStop(1, 'rgba(255,180,60,0)')
        ctx.fillStyle = sGlow
        ctx.beginPath(); ctx.arc(cx, sY, 16, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(cx, sY, 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,240,${sp})`; ctx.fill()
      }
    } else {
      // Scrying: pure dark with a single soft pulsing point
      const sp = 0.25 + Math.sin(t * 0.7) * 0.12
      const sGlow = ctx.createRadialGradient(cx, H / 2, 0, cx, H / 2, 40)
      sGlow.addColorStop(0, `rgba(180,160,255,${sp * 0.5})`)
      sGlow.addColorStop(1, 'rgba(80,60,160,0)')
      ctx.fillStyle = sGlow
      ctx.beginPath(); ctx.arc(cx, H / 2, 40, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx, H / 2, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(220,200,255,${0.45 + Math.sin(t * 0.7) * 0.25})`; ctx.fill()
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [phase, progress])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={360}
      style={{ width: 280, height: 360, display: 'block', margin: '0 auto' }}
    />
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PathworkPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [mode, setMode] = useState<Mode>('tibetan')
  const [timeLeft, setTimeLeft] = useState(0)
  const [progress, setProgress] = useState(0)
  const [scryingNotes, setScryingNotes] = useState('')
  const [paused, setPaused] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)
  const sessionStartRef = useRef(0)

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('pathwork-sessions') || '[]')
      setSessionCount(s.length)
    } catch {}
  }, [])

  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function startPhase(p: Phase) {
    const cfg = PHASES.find(c => c.id === p)
    if (!cfg) return
    clearTimer()
    durationRef.current = cfg.duration
    setPhase(p); setTimeLeft(cfg.duration); setProgress(0); setPaused(false)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const n = Math.max(0, prev - 1)
        setProgress(1 - n / durationRef.current)
        return n
      })
    }, 1000)
  }

  function advancePhase(currentPhase: Phase) {
    const idx = PHASE_IDS.indexOf(currentPhase)
    const next = PHASE_IDS[idx + 1]
    if (!next) {
      finishSession()
    } else {
      startPhase(next)
    }
  }

  function finishSession() {
    clearTimer()
    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode,
      scrying_notes: scryingNotes,
      duration: Math.floor((Date.now() - sessionStartRef.current) / 1000),
    }
    try {
      const existing = JSON.parse(localStorage.getItem('pathwork-sessions') || '[]')
      localStorage.setItem('pathwork-sessions', JSON.stringify([session, ...existing].slice(0, 90)))
      setSessionCount(existing.length + 1)
    } catch {}
    setPhase('done')
  }

  function beginSession() {
    sessionStartRef.current = Date.now()
    setScryingNotes('')
    startPhase('purification')
  }

  function togglePause() {
    if (paused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const n = Math.max(0, prev - 1)
          setProgress(1 - n / durationRef.current)
          return n
        })
      }, 1000)
      setPaused(false)
    } else {
      clearTimer(); setPaused(true)
    }
  }

  useEffect(() => () => clearTimer(), [])

  // Auto-advance all phases except scrying (requires manual tap after notes)
  useEffect(() => {
    if (timeLeft === 0 && phase !== 'idle' && phase !== 'done' && phase !== 'scrying') {
      const t = setTimeout(() => advancePhase(phase), 2000)
      return () => clearTimeout(t)
    }
  }, [timeLeft, phase])

  const cfg = PHASES.find(p => p.id === phase)
  const phaseIdx = PHASE_IDS.indexOf(phase)
  const instruction = cfg
    ? (mode === 'tibetan' ? cfg.tibetan.instruction : cfg.western.instruction)
    : null
  const mantra = cfg && mode === 'tibetan' ? cfg.tibetan.mantra : undefined
  const westernLines = cfg && mode === 'western' ? cfg.western.lines : undefined
  const westernClose = cfg && mode === 'western' ? cfg.western.close : undefined

  function fmt(s: number) {
    const m = Math.floor(Math.abs(s) / 60)
    const sec = Math.abs(s) % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const totalDuration = PHASES.reduce((sum, p) => sum + p.duration, 0)
  const totalMin = Math.round(totalDuration / 60)

  return (
    <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            Pathwork
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {sessionCount > 0
              ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''} completed`
              : 'Daily practice · Yesod to Tiphareth'}
          </p>
        </div>
        {/* Mode toggle */}
        <div
          className="flex gap-0.5 rounded-lg p-0.5"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          {(['tibetan', 'western'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 rounded text-xs transition-all"
              style={{
                background: mode === m ? 'rgba(139,92,246,0.25)' : 'transparent',
                color: mode === m ? 'var(--violet)' : 'var(--muted)',
              }}
            >
              {m === 'tibetan' ? 'Tibetan' : 'Western'}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas — always visible */}
      <PathworkCanvas phase={phase} progress={progress} />

      {/* Idle state */}
      {phase === 'idle' && (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(8,5,18,0.9)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <div className="space-y-2">
              {PHASES.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <span style={{ color: 'rgba(139,92,246,0.5)', fontFamily: 'monospace', minWidth: '12px' }}>{p.icon}</span>
                  <span className="flex-1">{p.label}</span>
                  <span className="opacity-50 font-mono">{fmt(p.duration)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 text-xs" style={{ color: 'var(--muted)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
              ~{totalMin} min total · {mode === 'tibetan' ? 'Tibetan mantra tradition' : 'Western Hermetic tradition'}
            </div>
          </div>
          <button
            onClick={beginSession}
            className="w-full py-4 rounded-2xl text-sm font-medium transition-all duration-300"
            style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.35)',
              color: 'var(--violet)',
              fontFamily: 'monospace',
              letterSpacing: '0.15em',
            }}
          >
            △ BEGIN SESSION
          </button>
        </div>
      )}

      {/* Active phase */}
      {phase !== 'idle' && phase !== 'done' && cfg && (
        <div className="space-y-4">

          {/* Progress bar */}
          <div className="flex items-center gap-1.5">
            {PHASES.map((p, i) => (
              <div
                key={p.id}
                className="flex-1 h-0.5 rounded-full transition-all duration-500"
                style={{
                  background: i < phaseIdx
                    ? 'rgba(139,92,246,0.6)'
                    : i === phaseIdx
                    ? 'rgba(255,200,80,0.8)'
                    : 'rgba(139,92,246,0.12)',
                }}
              />
            ))}
          </div>

          {/* Phase header + timer */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.6)' }}>
                {cfg.icon} Phase {phaseIdx + 1} of {PHASES.length}
              </div>
              <div className="text-lg font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                {cfg.label}
              </div>
            </div>
            <div
              className="text-2xl font-mono tabular-nums"
              style={{ color: timeLeft < 20 ? 'rgba(255,200,80,0.9)' : 'var(--muted)' }}
            >
              {fmt(timeLeft)}
            </div>
          </div>

          {/* Content */}
          <div
            className="rounded-xl px-4 py-4 space-y-3"
            style={{ background: 'rgba(5,3,14,0.85)', border: '1px solid rgba(139,92,246,0.12)' }}
          >
            {/* Tibetan mantra */}
            {mantra && (
              <div className="text-center py-2">
                <div
                  className="text-base tracking-widest"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(200,180,255,0.9)', letterSpacing: '0.3em' }}
                >
                  {mantra}
                </div>
              </div>
            )}

            {/* Western invocation lines */}
            {westernLines && (
              <div className="space-y-2 py-1">
                {westernLines.map((line, i) => (
                  <p
                    key={i}
                    className="text-sm text-center italic"
                    style={{ fontFamily: 'Georgia, serif', color: 'rgba(180,160,255,0.85)', lineHeight: 1.8 }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}

            {/* Western closing word */}
            {westernClose && (
              <div className="text-center pt-1">
                <span
                  className="text-xl tracking-widest"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(200,180,255,0.9)', letterSpacing: '0.4em' }}
                >
                  {westernClose}
                </span>
              </div>
            )}

            {/* Instruction */}
            {instruction && (
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {instruction}
              </p>
            )}
          </div>

          {/* Scrying notes */}
          {phase === 'scrying' && (
            <textarea
              value={scryingNotes}
              onChange={e => setScryingNotes(e.target.value)}
              placeholder="Record impressions, images, words, felt sense..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'rgba(3,1,10,0.9)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: 'var(--text)',
                fontFamily: 'Georgia, serif',
              }}
            />
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="px-4 py-2.5 rounded-xl text-xs font-mono tracking-widest transition-all"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.18)',
                color: 'var(--muted)',
              }}
            >
              {paused ? '▶ RESUME' : '‖ PAUSE'}
            </button>
            <button
              onClick={() => advancePhase(phase)}
              className="flex-1 py-2.5 rounded-xl text-xs font-mono tracking-widest transition-all"
              style={{
                background: timeLeft === 0 ? 'rgba(255,200,80,0.12)' : 'rgba(139,92,246,0.12)',
                border: `1px solid ${timeLeft === 0 ? 'rgba(255,200,80,0.4)' : 'rgba(139,92,246,0.3)'}`,
                color: timeLeft === 0 ? 'rgba(255,200,80,0.9)' : 'var(--violet)',
              }}
            >
              {phase === 'closing'
                ? '◼ SEAL & CLOSE'
                : `NEXT: ${PHASES[phaseIdx + 1]?.label?.toUpperCase() ?? 'CLOSE'} →`
              }
            </button>
          </div>
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && (
        <div className="space-y-4">
          <div
            className="rounded-2xl px-5 py-5 space-y-4"
            style={{ background: 'rgba(8,5,18,0.9)', border: '1px solid rgba(255,200,80,0.2)' }}
          >
            <div
              className="text-sm font-medium"
              style={{ color: 'rgba(255,200,80,0.85)', fontFamily: 'Georgia, serif' }}
            >
              Session complete.
            </div>
            {scryingNotes && (
              <div className="space-y-1.5">
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.5)' }}>
                  Scrying Notes
                </div>
                <p
                  className="text-sm italic leading-relaxed"
                  style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}
                >
                  {scryingNotes}
                </p>
              </div>
            )}
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(139,92,246,0.5)' }}>
              Record any impressions that continue to surface through the day. The practice continues below the threshold of conscious attention.
            </p>
          </div>
          <button
            onClick={() => { setPhase('idle'); setScryingNotes('') }}
            className="w-full py-3 rounded-xl text-xs font-mono tracking-widest transition-all"
            style={{
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.18)',
              color: 'var(--muted)',
            }}
          >
            ↩ NEW SESSION
          </button>
        </div>
      )}
    </div>
  )
}
