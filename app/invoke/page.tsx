'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ENTITIES, UNIVERSAL_INVOCATION, type Entity, findResonantEntities } from '@/lib/entities'
import { getDreams } from '@/lib/store'

// ─── Sigil Canvas ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function SigilCanvas({ entity, active }: { entity: Entity; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)
  const [r, g, b] = hexToRgb(entity.color)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sz = canvas.width
    const cx = sz / 2
    const cy = sz / 2
    tRef.current += 0.008

    ctx.clearRect(0, 0, sz, sz)

    // Outer glow ring
    const pulse = active ? 0.5 + Math.sin(tRef.current * 2.3) * 0.3 : 0.2
    const grad = ctx.createRadialGradient(cx, cy, sz * 0.25, cx, cy, sz * 0.48)
    grad.addColorStop(0, `rgba(${r},${g},${b},${pulse * 0.15})`)
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, sz * 0.48, 0, Math.PI * 2)
    ctx.fill()

    // Outer circle
    ctx.beginPath()
    ctx.arc(cx, cy, sz * 0.42, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${r},${g},${b},${active ? 0.5 : 0.2})`
    ctx.lineWidth = 1
    ctx.stroke()

    // Inner circle
    ctx.beginPath()
    ctx.arc(cx, cy, sz * 0.3, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${r},${g},${b},${active ? 0.3 : 0.1})`
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Rotating star polygon derived from entity number
    const n = entity.number
    const points = (n % 7) + 4 // 4–10 points
    const innerR = sz * 0.12
    const outerR = sz * 0.38

    ctx.beginPath()
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2 - Math.PI / 2 + tRef.current * 0.15
      const rad = i % 2 === 0 ? outerR : innerR
      const x = cx + Math.cos(angle) * rad
      const y = cy + Math.sin(angle) * rad
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = `rgba(${r},${g},${b},${active ? 0.6 : 0.2})`
    ctx.lineWidth = 1
    ctx.stroke()

    // Central cross
    const crossSize = sz * 0.07
    const rotation = tRef.current * (active ? 0.3 : 0.05)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.beginPath()
    ctx.moveTo(-crossSize, 0); ctx.lineTo(crossSize, 0)
    ctx.moveTo(0, -crossSize); ctx.lineTo(0, crossSize)
    ctx.strokeStyle = `rgba(${Math.min(r + 60, 255)},${Math.min(g + 60, 255)},${Math.min(b + 60, 255)},${active ? 0.8 : 0.3})`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()

    // Sephirotic number ring marks (10 or 12 positions)
    const total = ENTITIES.length
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2
      const markR = sz * 0.44
      const x = cx + Math.cos(angle) * markR
      const y = cy + Math.sin(angle) * markR
      const isCurrent = i === ENTITIES.findIndex(e => e.id === entity.id)
      ctx.beginPath()
      ctx.arc(x, y, isCurrent ? 3 : 0.8, 0, Math.PI * 2)
      ctx.fillStyle = isCurrent
        ? `rgba(${r},${g},${b},${active ? 1 : 0.5})`
        : `rgba(${r},${g},${b},${active ? 0.3 : 0.1})`
      ctx.fill()
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [entity, active, r, g, b])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      style={{ width: 240, height: 240 }}
    />
  )
}

// ─── Invocation Word Display ──────────────────────────────────────────────────

function InvocationDisplay({ words, active }: { words: string; active: boolean }) {
  const parts = words.split('·').map(w => w.trim()).filter(Boolean)
  const [visibleIdx, setVisibleIdx] = useState(-1)

  useEffect(() => {
    if (!active) { setVisibleIdx(-1); return }
    setVisibleIdx(0)
    const interval = setInterval(() => {
      setVisibleIdx(prev => {
        if (prev >= parts.length - 1) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, 800)
    return () => clearInterval(interval)
  }, [active, parts.length, words])

  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      {parts.map((word, i) => (
        <span
          key={word}
          className="text-sm tracking-widest transition-all duration-700"
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            letterSpacing: '0.25em',
            color: i <= visibleIdx ? 'rgba(200,180,255,0.9)' : 'rgba(139,92,246,0.2)',
            textShadow: i <= visibleIdx && active ? '0 0 20px rgba(139,92,246,0.6)' : 'none',
            transform: i <= visibleIdx ? 'translateY(0)' : 'translateY(4px)',
          }}
        >
          {word}
        </span>
      ))}
    </div>
  )
}

// ─── Ritual Data ─────────────────────────────────────────────────────────────

type RitualMode = 'none' | 'lbrp' | 'star-ruby'

interface RitualStep {
  label: string
  direction?: string
  divineName?: string
  instruction: string
  hasPentagram: boolean
  pentagramColor?: string
  duration: number
}

const LBRP_STEPS: RitualStep[] = [
  {
    label: 'Qabalistic Cross',
    instruction: 'Touch forehead: ATEH (Thine is). Touch solar plexus: MALKUTH (the Kingdom). Touch right shoulder: VE-GEBURAH (and the Power). Touch left shoulder: VE-GEDULAH (and the Glory). Clasp hands at chest: LE-OLAHM AMEN (for ever, Amen). Vibrate each word.',
    hasPentagram: false,
    duration: 30,
  },
  {
    label: 'East · Pentagram',
    direction: 'East',
    divineName: 'YHVH',
    instruction: 'Face East. Draw the invoking Earth pentagram in yellow flame. Thrust dagger (or finger) into the center and vibrate: YHVH (Yod Heh Vav Heh). See the pentagram blaze.',
    hasPentagram: true,
    pentagramColor: '#fbbf24',
    duration: 30,
  },
  {
    label: 'South · Pentagram',
    direction: 'South',
    divineName: 'ADONAI',
    instruction: 'Turn South, tracing a line of flame. Draw the invoking Earth pentagram in red flame. Vibrate: ADONAI (Ah-doh-nye). See it blaze in the South.',
    hasPentagram: true,
    pentagramColor: '#ef4444',
    duration: 30,
  },
  {
    label: 'West · Pentagram',
    direction: 'West',
    divineName: 'EHEIEH',
    instruction: 'Turn West, continuing the circle of flame. Draw the invoking Earth pentagram in blue flame. Vibrate: EHEIEH (Eh-hey-yeh). The West blazes.',
    hasPentagram: true,
    pentagramColor: '#60a5fa',
    duration: 30,
  },
  {
    label: 'North · Pentagram',
    direction: 'North',
    divineName: 'AGLA',
    instruction: 'Turn North, continuing the circle. Draw the invoking Earth pentagram in emerald flame. Vibrate: AGLA (Ah-geh-lah — "Thou art mighty forever, O Lord"). Complete the circle back East.',
    hasPentagram: true,
    pentagramColor: '#16a34a',
    duration: 30,
  },
  {
    label: 'Circle of Fire',
    instruction: 'Return East. Extend the arms: "Before me RAPHAEL. Behind me GABRIEL. On my right hand MICHAEL. On my left hand URIEL." See each archangel radiant in their quarter.',
    hasPentagram: false,
    duration: 45,
  },
  {
    label: 'Hexagram Declaration',
    instruction: '"For about me flames the pentagram / And in the column stands the six-rayed star." See yourself at the center of a blazing hexagram, the macrocosm meeting the microcosm.',
    hasPentagram: false,
    duration: 20,
  },
  {
    label: 'Closing Cross',
    instruction: 'Repeat the Qabalistic Cross: ATEH · MALKUTH · VE-GEBURAH · VE-GEDULAH · LE-OLAHM · AMEN. The space is sealed. You stand at the center.',
    hasPentagram: false,
    duration: 30,
  },
]

const STAR_RUBY_STEPS: RitualStep[] = [
  {
    label: 'Opening Declaration',
    divineName: 'APO PANTOS KAKODAIMONOS',
    instruction: 'Face East. With a sweeping gesture banish all negative forces: APO PANTOS KAKODAIMONOS (Away, all evil daimons!). Then: IO PAN — feel the universal life-force surge. CHAOS! BABALON! NUIT! HADIT!',
    hasPentagram: false,
    duration: 30,
  },
  {
    label: 'East · Therion',
    direction: 'East',
    divineName: 'THERION',
    instruction: 'Face East. Draw the invoking pentagram of Earth in golden flame. Thrust and vibrate: THERION (The Beast — the universal masculine, solar will made flesh). See it blaze.',
    hasPentagram: true,
    pentagramColor: '#fbbf24',
    duration: 30,
  },
  {
    label: 'South · Babalon',
    direction: 'South',
    divineName: 'BABALON',
    instruction: 'Turn South tracing flame. Draw invoking pentagram. Vibrate: BABALON (The Scarlet Woman — the Great Mother, the universal feminine, unconditional love). The South blazes red.',
    hasPentagram: true,
    pentagramColor: '#e879f9',
    duration: 30,
  },
  {
    label: 'West · Nuit',
    direction: 'West',
    divineName: 'NUIT',
    instruction: 'Turn West. Draw invoking pentagram. Vibrate: NUIT (the infinite starry space, the body of heaven, all possibility). The West blazes deep blue.',
    hasPentagram: true,
    pentagramColor: '#818cf8',
    duration: 30,
  },
  {
    label: 'North · Hadit',
    direction: 'North',
    divineName: 'HADIT',
    instruction: 'Turn North. Draw invoking pentagram in black flame edged with green. Vibrate: HADIT (the infinitely contracted point of pure consciousness, the hidden flame in the heart of every star). The North blazes.',
    hasPentagram: true,
    pentagramColor: '#a3e635',
    duration: 30,
  },
  {
    label: 'Circle & Centers',
    instruction: 'Return East. Extend arms: "Before me RAPHAEL · Behind me GABRIEL · Right MICHAEL · Left URIEL." Then: "Above me shines AIWASS · In my heart burns HADIT · About me blazes NUIT." Feel the column of light connecting heaven and earth through your spine.',
    hasPentagram: false,
    duration: 45,
  },
  {
    label: 'Declaration of Law',
    instruction: '"Do what thou wilt shall be the whole of the Law." "Love is the law, love under will." Vibrate: ABRAHADABRA — the Word of the Aeon. The ritual is complete.',
    hasPentagram: false,
    duration: 30,
  },
]

// ─── Pentagram Canvas ─────────────────────────────────────────────────────────

function PentagramCanvas({ color = '#fbbf24', active }: { color: string; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)
  const drawProgressRef = useRef(0)

  const [cr, cg, cb] = hexToRgb(color)

  useEffect(() => {
    drawProgressRef.current = 0
    tRef.current = 0
  }, [color])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sz = canvas.width, cx = sz / 2, cy = sz / 2

    tRef.current += active ? 0.015 : 0.006
    if (drawProgressRef.current < 1) {
      drawProgressRef.current = Math.min(1, drawProgressRef.current + 0.008)
    }

    ctx.clearRect(0, 0, sz, sz)

    // Background glow
    const pulse = active ? 0.4 + Math.sin(tRef.current * 2) * 0.3 : 0.15
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz * 0.45)
    bgGrad.addColorStop(0, `rgba(${cr},${cg},${cb},${pulse * 0.12})`)
    bgGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
    ctx.fillStyle = bgGrad
    ctx.beginPath(); ctx.arc(cx, cy, sz * 0.45, 0, Math.PI * 2); ctx.fill()

    // Outer circle
    ctx.beginPath(); ctx.arc(cx, cy, sz * 0.40, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${active ? 0.5 : 0.2})`
    ctx.lineWidth = 1; ctx.stroke()

    // 5 points of the pentagram
    const r = sz * 0.34
    const pts = Array.from({ length: 5 }, (_, i) => ({
      x: cx + Math.cos(-Math.PI / 2 + (i * Math.PI * 2) / 5) * r,
      y: cy + Math.sin(-Math.PI / 2 + (i * Math.PI * 2) / 5) * r,
    }))

    // Star order: 0→2→4→1→3→0 (standard star path)
    const starOrder = [0, 2, 4, 1, 3]
    const segments: Array<[number, number, number, number]> = []
    for (let i = 0; i < 5; i++) {
      const from = pts[starOrder[i]]
      const to = pts[starOrder[(i + 1) % 5]]
      segments.push([from.x, from.y, to.x, to.y])
    }

    // Draw pentagram with progress (animated in)
    const totalProgress = drawProgressRef.current
    const totalLength = 5

    ctx.shadowBlur = active ? 12 : 4
    ctx.shadowColor = color
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${active ? 0.9 : 0.5})`
    ctx.lineWidth = active ? 1.8 : 1.2
    ctx.lineCap = 'round'

    let drawn = 0
    for (let i = 0; i < 5; i++) {
      const segStart = i / totalLength
      const segEnd = (i + 1) / totalLength
      const [x1, y1, x2, y2] = segments[i]

      if (totalProgress <= segStart) break
      const segProgress = Math.min(1, (totalProgress - segStart) / (segEnd - segStart))
      const ex = x1 + (x2 - x1) * segProgress
      const ey = y1 + (y2 - y1) * segProgress

      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke()
      drawn++
    }

    ctx.shadowBlur = 0

    // Center dot
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${active ? 0.8 : 0.3})`
    ctx.fill()

    frameRef.current = requestAnimationFrame(draw)
  }, [color, active, cr, cg, cb])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{ width: 200, height: 200 }}
    />
  )
}

// ─── Ritual Guide ─────────────────────────────────────────────────────────────

function RitualGuide({
  steps,
  onComplete,
}: {
  steps: RitualStep[]
  onComplete: () => void
}) {
  const [stepIdx, setStepIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(steps[0]?.duration ?? 30)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const step = steps[stepIdx]

  useEffect(() => {
    setTimeLeft(step?.duration ?? 30)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [stepIdx])

  const advance = () => {
    if (stepIdx >= steps.length - 1) {
      onComplete()
    } else {
      setStepIdx(s => s + 1)
    }
  }

  if (!step) return null

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-0.5 rounded-full"
            style={{
              background: i < stepIdx
                ? 'rgba(251,191,36,0.6)'
                : i === stepIdx
                ? 'rgba(251,191,36,0.9)'
                : 'rgba(251,191,36,0.1)',
            }}
          />
        ))}
      </div>

      {/* Step header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(251,191,36,0.5)' }}>
            Step {stepIdx + 1} of {steps.length}
          </div>
          <div className="text-base font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            {step.label}
          </div>
        </div>
        <div
          className="text-xl font-mono tabular-nums"
          style={{ color: timeLeft < 10 ? 'rgba(251,191,36,0.9)' : 'var(--muted)' }}
        >
          {timeLeft}s
        </div>
      </div>

      {/* Pentagram */}
      {step.hasPentagram && (
        <div className="flex justify-center">
          <PentagramCanvas color={step.pentagramColor ?? '#fbbf24'} active />
        </div>
      )}

      {/* Divine name */}
      {step.divineName && (
        <div className="text-center py-1">
          <div
            className="text-lg tracking-widest"
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              color: step.pentagramColor ?? 'rgba(251,191,36,0.9)',
              letterSpacing: '0.3em',
            }}
          >
            {step.divineName}
          </div>
        </div>
      )}

      {/* Instruction */}
      <div
        className="rounded-xl px-4 py-4"
        style={{ background: 'rgba(5,3,14,0.85)', border: '1px solid rgba(251,191,36,0.1)' }}
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
          {step.instruction}
        </p>
      </div>

      {/* Advance button */}
      <button
        onClick={advance}
        className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all"
        style={{
          background: timeLeft === 0 ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.06)',
          border: `1px solid ${timeLeft === 0 ? 'rgba(251,191,36,0.4)' : 'rgba(251,191,36,0.15)'}`,
          color: timeLeft === 0 ? 'rgba(251,191,36,0.9)' : 'rgba(251,191,36,0.4)',
          letterSpacing: '0.18em',
          fontFamily: 'monospace',
        }}
      >
        {stepIdx >= steps.length - 1 ? '◼ COMPLETE RITUAL' : 'NEXT STEP →'}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvokePage() {
  const defaultEntity = ENTITIES.find(e => e.id === 'michael')!
  const [selectedEntity, setSelectedEntity] = useState<Entity>(defaultEntity)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'opening' | 'invocation' | 'closing'>('idle')
  const [suggestedEntities, setSuggestedEntities] = useState<Entity[]>([])
  const [showAll, setShowAll] = useState(false)
  const [ritualMode, setRitualMode] = useState<RitualMode>('none')
  const [ritualActive, setRitualActive] = useState(false)
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load suggested entities from dream resonances
  useEffect(() => {
    getDreams().then(dreams => {
      const recent = dreams.filter(d => d.extraction).slice(0, 6)
      const allSymbols = recent.flatMap(d =>
        d.extraction?.symbols?.map((s: any) => typeof s === 'string' ? s : s?.name || '') ?? []
      ).filter(Boolean)
      const allThemes = recent.flatMap(d =>
        d.extraction?.themes?.map((t: any) => typeof t === 'string' ? t : t?.name || '') ?? []
      ).filter(Boolean)

      const resonant = findResonantEntities(allThemes, allSymbols, 3)
      setSuggestedEntities(
        resonant.length > 0
          ? resonant
          : [
            ENTITIES.find(e => e.id === 'michael')!,
            ENTITIES.find(e => e.id === 'gabriel')!,
            ENTITIES.find(e => e.id === 'raphael')!,
          ]
      )
    })
  }, [])

  const filteredEntities = search.length > 1
    ? ENTITIES.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.domains.some(d => d.toLowerCase().includes(search.toLowerCase())) ||
        e.sephirah.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const beginInvocation = () => {
    setActive(true)
    setPhase('opening')
    phaseTimerRef.current = setTimeout(() => {
      setPhase('invocation')
      phaseTimerRef.current = setTimeout(() => {
        setPhase('closing')
        phaseTimerRef.current = setTimeout(() => {
          setActive(false)
          setPhase('idle')
        }, 4000)
      }, 6000)
    }, 3000)
  }

  const cancelInvocation = () => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    setActive(false)
    setPhase('idle')
  }

  const [er, eg, eb] = hexToRgb(selectedEntity.color)
  const entityRgb = `${er},${eg},${eb}`

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <h1
          className="text-2xl font-medium tracking-tight"
          style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
        >
          Invocation
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Archangels, intelligences, and archetypes — drawn from your dream symbols and current sky.
        </p>
      </div>

      {/* Suggested from dreams */}
      {suggestedEntities.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.6)' }}>
            Resonant with Your Dreams
          </div>
          <div className="flex gap-2 flex-wrap">
            {suggestedEntities.map(entity => (
              <button
                key={entity.id}
                onClick={() => { setSelectedEntity(entity); setSearch('') }}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: selectedEntity.id === entity.id ? 'rgba(139,92,246,0.2)' : 'rgba(15,15,26,0.7)',
                  border: `1px solid ${selectedEntity.id === entity.id ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`,
                  color: selectedEntity.id === entity.id ? 'var(--violet)' : 'var(--muted)',
                }}
              >
                {entity.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, domain, or sphere..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'rgba(15,15,26,0.8)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
        {filteredEntities.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
            style={{ background: 'rgba(10,8,22,0.97)', border: '1px solid var(--border)' }}
          >
            {filteredEntities.slice(0, 8).map(entity => {
              const [cr, cg, cb] = hexToRgb(entity.color)
              return (
                <button
                  key={entity.id}
                  onClick={() => { setSelectedEntity(entity); setSearch('') }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: entity.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{entity.name}</span>
                  <span className="text-xs" style={{ color: `rgba(${cr},${cg},${cb},0.8)` }}>
                    {entity.sephirah}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>
                    {entity.domains[0]}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Ritual mode toggle */}
      {!active && !ritualActive && (
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.4)' }}>
            Pre-Invocation Ritual
          </div>
          <div className="flex gap-2">
            {([
              { id: 'none', label: 'None' },
              { id: 'lbrp', label: 'LBRP' },
              { id: 'star-ruby', label: 'Star Ruby' },
            ] as Array<{ id: RitualMode; label: string }>).map(r => (
              <button
                key={r.id}
                onClick={() => setRitualMode(r.id)}
                className="px-3 py-1.5 rounded-full text-xs font-mono transition-all"
                style={{
                  background: ritualMode === r.id ? 'rgba(251,191,36,0.12)' : 'rgba(15,15,26,0.7)',
                  border: `1px solid ${ritualMode === r.id ? 'rgba(251,191,36,0.4)' : 'var(--border)'}`,
                  color: ritualMode === r.id ? '#fbbf24' : 'var(--muted)',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          {ritualMode !== 'none' && (
            <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {ritualMode === 'lbrp'
                ? 'Lesser Banishing Ritual of the Pentagram · clears and consecrates the space'
                : 'Star Ruby (Thelemic) · Therion · Babalon · Nuit · Hadit'}
            </p>
          )}
        </div>
      )}

      {/* Active ritual guide */}
      {ritualActive && (
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(8,5,18,0.95)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(251,191,36,0.5)' }}>
                {ritualMode === 'lbrp' ? 'Lesser Banishing Ritual' : 'Star Ruby'}
              </div>
              <div className="text-base font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                Preparing the space for {selectedEntity.name}
              </div>
            </div>
            <button
              onClick={() => setRitualActive(false)}
              className="text-xs"
              style={{ color: 'var(--muted)' }}
            >
              ✕ Cancel
            </button>
          </div>
          <RitualGuide
            steps={ritualMode === 'lbrp' ? LBRP_STEPS : STAR_RUBY_STEPS}
            onComplete={() => {
              setRitualActive(false)
              beginInvocation()
            }}
          />
        </div>
      )}

      {/* Selected entity + sigil */}
      {!ritualActive && (
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{
          background: 'rgba(8,5,18,0.9)',
          border: `1px solid ${active ? `rgba(${entityRgb},0.4)` : `rgba(${entityRgb},0.15)`}`,
          transition: 'border-color 1s ease',
          boxShadow: active ? `0 0 60px rgba(${entityRgb},0.08)` : 'none',
        }}
      >
        {/* Entity header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{
                  background: `rgba(${entityRgb},0.12)`,
                  color: selectedEntity.color,
                  border: `1px solid rgba(${entityRgb},0.3)`,
                }}
              >
                {selectedEntity.sephirah}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                {selectedEntity.planet}
              </span>
            </div>
            <h2
              className="text-2xl font-medium"
              style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
            >
              {selectedEntity.name}
            </h2>
          </div>
        </div>

        {/* Domains */}
        <div className="flex flex-wrap gap-1.5">
          {selectedEntity.domains.map(d => (
            <span
              key={d}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `rgba(${entityRgb},0.08)`, color: 'var(--muted)', border: `1px solid rgba(${entityRgb},0.15)` }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Sigil */}
        <div className="flex justify-center py-2">
          <SigilCanvas entity={selectedEntity} active={active} />
        </div>

        {/* Appearance */}
        <div
          className="rounded-lg px-4 py-3 text-xs italic leading-relaxed"
          style={{ background: 'rgba(5,2,12,0.6)', color: 'var(--muted)', fontFamily: 'Georgia, serif' }}
        >
          {selectedEntity.appearance}
        </div>

        {/* Tibetan correspondence */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: `rgba(${entityRgb},0.5)` }}>
            Tibetan Correspondence
          </div>
          <p className="text-xs italic" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}>
            {selectedEntity.tibetan}
          </p>
        </div>

        {/* Dream resonance */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.5)' }}>
            Dream Signs
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedEntity.dream_resonance.map(r => (
              <span
                key={r}
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: 'rgba(139,92,246,0.06)', color: 'rgba(167,139,250,0.7)' }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Invocation words */}
        <div
          className="rounded-xl px-4 py-4 text-center space-y-1"
          style={{ background: 'rgba(3,1,10,0.8)', border: '1px solid rgba(139,92,246,0.12)' }}
        >
          <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'rgba(139,92,246,0.4)' }}>
            Words of Invocation
          </div>
          <InvocationDisplay words={selectedEntity.invocation} active={active} />
        </div>

        {/* Phase indicator */}
        {active && (
          <div className="text-center text-xs font-mono tracking-widest animate-pulse" style={{ color: 'rgba(167,139,250,0.6)' }}>
            {phase === 'opening' && 'OPENING · ' + UNIVERSAL_INVOCATION.opening}
            {phase === 'invocation' && 'PRESENT'}
            {phase === 'closing' && 'SEALING · ' + UNIVERSAL_INVOCATION.closing}
          </div>
        )}

        {/* Invoke button */}
        <button
          onClick={active ? cancelInvocation : (ritualMode !== 'none' ? () => setRitualActive(true) : beginInvocation)}
          className="w-full py-4 rounded-2xl text-sm font-medium transition-all duration-500"
          style={{
            background: active
              ? `rgba(${entityRgb},0.08)`
              : `rgba(${entityRgb},0.12)`,
            border: `1px solid ${active ? `rgba(${entityRgb},0.3)` : `rgba(${entityRgb},0.35)`}`,
            color: active ? `rgba(${entityRgb},0.6)` : selectedEntity.color,
            letterSpacing: '0.2em',
            fontFamily: 'monospace',
          }}
        >
          {active
            ? '◼  CLOSE'
            : ritualMode !== 'none'
            ? `⬡  BEGIN RITUAL · ${selectedEntity.name.toUpperCase()}`
            : `⬡  INVOKE ${selectedEntity.name.toUpperCase()}`}
        </button>
      </div>
      )} {/* end !ritualActive */}

      {/* Pathwork link */}
      <div className="text-center">
        <a
          href="/pathwork"
          className="text-xs font-mono tracking-widest"
          style={{ color: 'rgba(139,92,246,0.5)' }}
        >
          △ Begin daily pathwork practice →
        </a>
      </div>

      {/* Browse all */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAll(p => !p)}
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: 'var(--muted)' }}
        >
          {showAll ? '▲ Hide' : '▼ Browse all intelligences'}
        </button>
        {showAll && (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {ENTITIES.map(entity => {
              const [cr, cg, cb] = hexToRgb(entity.color)
              return (
                <button
                  key={entity.id}
                  onClick={() => setSelectedEntity(entity)}
                  className="w-full px-4 py-2.5 rounded-lg flex items-center gap-3 text-left transition-colors"
                  style={{
                    background: selectedEntity.id === entity.id ? `rgba(${cr},${cg},${cb},0.08)` : 'transparent',
                    border: `1px solid ${selectedEntity.id === entity.id ? `rgba(${cr},${cg},${cb},0.3)` : 'transparent'}`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entity.color }} />
                  <span className="text-sm flex-1" style={{ color: 'var(--text)' }}>{entity.name}</span>
                  <span className="text-xs" style={{ color: `rgba(${cr},${cg},${cb},0.8)` }}>
                    {entity.sephirah}
                  </span>
                  <span className="text-xs ml-2 truncate max-w-32" style={{ color: 'var(--muted)' }}>
                    {entity.domains.slice(0, 2).join(', ')}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
