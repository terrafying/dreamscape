'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SPIRITS, PGM_INVOCATION, type GoetiaSpirit } from '@/lib/goetia'
import { getDreams } from '@/lib/store'

// ─── Sigil Canvas ─────────────────────────────────────────────────────────────

function SigilCanvas({ spirit, active }: { spirit: GoetiaSpirit; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)

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
    grad.addColorStop(0, `rgba(139,92,246,${pulse * 0.15})`)
    grad.addColorStop(1, 'rgba(139,92,246,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, sz * 0.48, 0, Math.PI * 2)
    ctx.fill()

    // Outer circle
    ctx.beginPath()
    ctx.arc(cx, cy, sz * 0.42, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(139,92,246,${active ? 0.5 : 0.2})`
    ctx.lineWidth = 1
    ctx.stroke()

    // Inner circle
    ctx.beginPath()
    ctx.arc(cx, cy, sz * 0.3, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(139,92,246,${active ? 0.3 : 0.1})`
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Rotating hash derived from spirit number
    const n = spirit.number
    const points = (n % 7) + 4 // 4-10 points
    const innerR = sz * 0.12
    const outerR = sz * 0.38

    // Star polygon
    ctx.beginPath()
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2 - Math.PI / 2 + tRef.current * 0.15
      const r = i % 2 === 0 ? outerR : innerR
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = `rgba(167,139,250,${active ? 0.6 : 0.2})`
    ctx.lineWidth = 1
    ctx.stroke()

    // Central cross from spirit rank
    const crossSize = sz * 0.07
    const rotation = tRef.current * (active ? 0.3 : 0.05)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.beginPath()
    ctx.moveTo(-crossSize, 0); ctx.lineTo(crossSize, 0)
    ctx.moveTo(0, -crossSize); ctx.lineTo(0, crossSize)
    ctx.strokeStyle = `rgba(200,180,255,${active ? 0.8 : 0.3})`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()

    // Spirit number ring marks
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2 - Math.PI / 2
      const markR = sz * 0.44
      const x = cx + Math.cos(angle) * markR
      const y = cy + Math.sin(angle) * markR
      const isSpirit = i === spirit.number - 1
      ctx.beginPath()
      ctx.arc(x, y, isSpirit ? 3 : 0.8, 0, Math.PI * 2)
      ctx.fillStyle = isSpirit
        ? `rgba(200,180,255,${active ? 1 : 0.5})`
        : `rgba(139,92,246,${active ? 0.3 : 0.1})`
      ctx.fill()
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [spirit, active])

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

// ─── Barbarous Word Display ───────────────────────────────────────────────────

function BarbarousDisplay({ words, active }: { words: string; active: boolean }) {
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
  const [selectedSpirit, setSelectedSpirit] = useState<GoetiaSpirit>(SPIRITS[8]) // Paimon default
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'opening' | 'invocation' | 'closing'>('idle')
  const [suggestedSpirits, setSuggestedSpirits] = useState<GoetiaSpirit[]>([])
  const [showAll, setShowAll] = useState(false)
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load suggested spirits from dream resonances
  useEffect(() => {
    getDreams().then(dreams => {
      const recent = dreams.filter(d => d.extraction).slice(0, 6)
      const allSymbols = recent.flatMap(d => d.extraction?.symbols?.map(s => s.name) ?? [])
      const allThemes = recent.flatMap(d => d.extraction?.themes?.map(t => t.name) ?? [])
      const goeticNames = recent
        .map(d => d.extraction?.goetic_resonance?.spirit)
        .filter((s): s is string => Boolean(s))

      // Named spirits from past extractions first
      const fromExtractions = goeticNames
        .filter((name, i, arr) => arr.indexOf(name) === i)
        .map(name => SPIRITS.find(s => s.name === name))
        .filter((s): s is GoetiaSpirit => Boolean(s))
        .slice(0, 3)

      setSuggestedSpirits(fromExtractions.length > 0 ? fromExtractions : [SPIRITS[8], SPIRITS[36], SPIRITS[70]])
    })
  }, [])

  const filteredSpirits = search.length > 1
    ? SPIRITS.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.domains.some(d => d.toLowerCase().includes(search.toLowerCase()))
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

  const RANK_COLOR: Record<string, string> = {
    King: '#fbbf24', Duke: '#60a5fa', Prince: '#a78bfa',
    Marquis: '#34d399', President: '#f472b6', Earl: '#fb923c',
    Knight: '#94a3b8', Count: '#fb923c',
  }

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
          The 72 spirits of the Ars Goetia — drawn from your dream symbols and the current sky.
        </p>
      </div>

      {/* Suggested from dreams */}
      {suggestedSpirits.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.6)' }}>
            Resonant with Your Dreams
          </div>
          <div className="flex gap-2 flex-wrap">
            {suggestedSpirits.map(spirit => (
              <button
                key={spirit.number}
                onClick={() => { setSelectedSpirit(spirit); setSearch('') }}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: selectedSpirit.number === spirit.number ? 'rgba(139,92,246,0.2)' : 'rgba(15,15,26,0.7)',
                  border: `1px solid ${selectedSpirit.number === spirit.number ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`,
                  color: selectedSpirit.number === spirit.number ? 'var(--violet)' : 'var(--muted)',
                }}
              >
                {spirit.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search spirits or domains..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'rgba(15,15,26,0.8)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
        {filteredSpirits.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
            style={{ background: 'rgba(10,8,22,0.97)', border: '1px solid var(--border)' }}
          >
            {filteredSpirits.slice(0, 8).map(spirit => (
              <button
                key={spirit.number}
                onClick={() => { setSelectedSpirit(spirit); setSearch('') }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-xs font-mono w-6 text-right" style={{ color: 'var(--muted)' }}>
                  {spirit.number}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{spirit.name}</span>
                <span className="text-xs" style={{ color: RANK_COLOR[spirit.rank] || 'var(--muted)' }}>
                  {spirit.rank}
                </span>
                <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>
                  {spirit.domains[0]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected spirit + sigil */}
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{
          background: 'rgba(8,5,18,0.9)',
          border: `1px solid ${active ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.15)'}`,
          transition: 'border-color 1s ease',
          boxShadow: active ? '0 0 60px rgba(139,92,246,0.08)' : 'none',
        }}
      >
        {/* Spirit header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                #{selectedSpirit.number}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{
                  background: `${RANK_COLOR[selectedSpirit.rank] || '#888'}20`,
                  color: RANK_COLOR[selectedSpirit.rank] || 'var(--muted)',
                  border: `1px solid ${RANK_COLOR[selectedSpirit.rank] || '#888'}40`,
                }}
              >
                {selectedSpirit.rank}
              </span>
            </div>
            <h2
              className="text-2xl font-medium"
              style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
            >
              {selectedSpirit.name}
            </h2>
          </div>
        </div>

        {/* Domains */}
        <div className="flex flex-wrap gap-1.5">
          {selectedSpirit.domains.map(d => (
            <span
              key={d}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.08)', color: 'var(--muted)', border: '1px solid rgba(139,92,246,0.15)' }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Sigil */}
        <div className="flex justify-center py-2">
          <SigilCanvas spirit={selectedSpirit} active={active} />
        </div>

        {/* Appearance */}
        <div
          className="rounded-lg px-4 py-3 text-xs italic leading-relaxed"
          style={{ background: 'rgba(5,2,12,0.6)', color: 'var(--muted)', fontFamily: 'Georgia, serif' }}
        >
          {selectedSpirit.appearance}
        </div>

        {/* Dream resonance */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.5)' }}>
            Dream Signs
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedSpirit.dream_resonance.map(r => (
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

        {/* Barbarous words */}
        <div
          className="rounded-xl px-4 py-4 text-center space-y-1"
          style={{ background: 'rgba(3,1,10,0.8)', border: '1px solid rgba(139,92,246,0.12)' }}
        >
          <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'rgba(139,92,246,0.4)' }}>
            Words of Invocation
          </div>
          <BarbarousDisplay words={selectedSpirit.barbarous} active={active} />
        </div>

        {/* Phase indicator */}
        {active && (
          <div className="text-center text-xs font-mono tracking-widest animate-pulse" style={{ color: 'rgba(167,139,250,0.6)' }}>
            {phase === 'opening' && 'OPENING THE GATE · ' + PGM_INVOCATION.opening}
            {phase === 'invocation' && 'SPIRIT APPROACHED'}
            {phase === 'closing' && 'CLOSING · ' + PGM_INVOCATION.closing}
          </div>
        )}

        {/* Invoke button */}
        <button
          onClick={active ? cancelInvocation : beginInvocation}
          className="w-full py-4 rounded-2xl text-sm font-medium transition-all duration-500"
          style={{
            background: active
              ? 'rgba(139,92,246,0.08)'
              : 'rgba(139,92,246,0.15)',
            border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.35)'}`,
            color: active ? 'rgba(167,139,250,0.6)' : 'var(--violet)',
            letterSpacing: '0.2em',
            fontFamily: 'monospace',
          }}
        >
          {active ? '◼  CLOSE THE GATE' : `⬡  INVOKE ${selectedSpirit.name.toUpperCase()}`}
        </button>
      </div>

      {/* Browse all */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAll(p => !p)}
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: 'var(--muted)' }}
        >
          {showAll ? '▲ Hide' : '▼ Browse all 72 spirits'}
        </button>
        {showAll && (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {SPIRITS.map(spirit => (
              <button
                key={spirit.number}
                onClick={() => setSelectedSpirit(spirit)}
                className="w-full px-4 py-2.5 rounded-lg flex items-center gap-3 text-left transition-colors"
                style={{
                  background: selectedSpirit.number === spirit.number ? 'rgba(139,92,246,0.1)' : 'transparent',
                  border: `1px solid ${selectedSpirit.number === spirit.number ? 'rgba(139,92,246,0.3)' : 'transparent'}`,
                }}
              >
                <span className="text-xs font-mono w-6 text-right shrink-0" style={{ color: 'var(--muted)' }}>
                  {spirit.number}
                </span>
                <span className="text-sm flex-1" style={{ color: 'var(--text)' }}>{spirit.name}</span>
                <span className="text-xs" style={{ color: RANK_COLOR[spirit.rank] || 'var(--muted)' }}>
                  {spirit.rank}
                </span>
                <span className="text-xs ml-2 truncate max-w-32" style={{ color: 'var(--muted)' }}>
                  {spirit.domains.slice(0, 2).join(', ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
