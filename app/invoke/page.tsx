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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvokePage() {
  const defaultEntity = ENTITIES.find(e => e.id === 'michael')!
  const [selectedEntity, setSelectedEntity] = useState<Entity>(defaultEntity)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'opening' | 'invocation' | 'closing'>('idle')
  const [suggestedEntities, setSuggestedEntities] = useState<Entity[]>([])
  const [showAll, setShowAll] = useState(false)
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

      {/* Selected entity + sigil */}
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
          onClick={active ? cancelInvocation : beginInvocation}
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
          {active ? '◼  CLOSE' : `⬡  INVOKE ${selectedEntity.name.toUpperCase()}`}
        </button>
      </div>

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
