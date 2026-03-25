'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { DreamExtraction } from '@/lib/types'
import { findTarotCard, selectAstrologicalNote } from '@/lib/spiritual-content'

interface DreamOracleProps {
  extraction: DreamExtraction
  autoReveal?: boolean
  onComplete?: () => void
}

interface OracleCard {
  label: string
  name: string
  body: string
  footnote: string
  expandedText: string
}

const ARC_LABELS: Record<string, string> = {
  ascending: 'Ascending arc',
  descending: 'Descending arc',
  cyclical: 'Cyclical arc',
  fragmented: 'Fragmented arc',
  liminal: 'Liminal arc',
}

const FLIP_DELAYS = [0, 600, 1200]
const FLIP_DURATION = 700

function buildOracleCards(extraction: DreamExtraction): OracleCard[] {
  // Card 1 — "The Symbol" (past / seed)
  const symbols = [...(extraction.symbols ?? [])].sort(
    (a, b) => b.salience - a.salience
  )
  const topSymbol = symbols[0]
  const tarot = topSymbol ? findTarotCard(topSymbol.name) : null

  const card1: OracleCard = {
    label: 'I \u2014 The Symbol',
    name: tarot?.name ?? topSymbol?.name ?? 'The Unnamed',
    body: topSymbol?.meaning ?? 'A symbol beneath the threshold of naming.',
    footnote: tarot?.principle ? `Principle of ${tarot.principle}` : '',
    expandedText: tarot?.meaning ?? '',
  }

  // Card 2 — "The Current" (present / flow)
  const emotion = extraction.emotions?.[0]
  const moonSign = extraction.astro_context?.moon_sign ?? ''
  const arc = extraction.narrative_arc ?? 'liminal'
  const astroNote = selectAstrologicalNote(moonSign, arc)
  const bodyNote = astroNote
    ? astroNote.length > 160
      ? astroNote.slice(0, 160) + '\u2026'
      : astroNote
    : `The Moon in ${moonSign} shapes tonight\u2019s emotional landscape.`

  const card2: OracleCard = {
    label: 'II \u2014 The Current',
    name: emotion
      ? `${emotion.name} \u00b7 ${Math.round(emotion.intensity * 100)}%`
      : 'Stillness',
    body: bodyNote,
    footnote: ARC_LABELS[arc] ?? arc,
    expandedText: astroNote.length > 160 ? astroNote : '',
  }

  // Card 3 — "The Guidance" (future / path)
  const goetic = extraction.goetic_resonance
  const rec = extraction.recommendations?.[0]

  let card3: OracleCard
  if (goetic) {
    card3 = {
      label: 'III \u2014 The Guidance',
      name: goetic.spirit,
      body: goetic.reason,
      footnote: '',
      expandedText: goetic.barbarous,
    }
  } else if (rec) {
    card3 = {
      label: 'III \u2014 The Guidance',
      name: rec.action.length > 50 ? rec.action.slice(0, 50) + '\u2026' : rec.action,
      body: rec.why,
      footnote: `Timing: ${rec.timing}`,
      expandedText: rec.action.length > 50 ? rec.action : '',
    }
  } else {
    card3 = {
      label: 'III \u2014 The Guidance',
      name: 'The Open Path',
      body: 'No specific guidance crystallized \u2014 the way forward is yours to shape.',
      footnote: '',
      expandedText: '',
    }
  }

  return [card1, card2, card3]
}

export default function DreamOracle({
  extraction,
  autoReveal = false,
  onComplete,
}: DreamOracleProps) {
  const cards = useMemo(() => buildOracleCards(extraction), [extraction])
  const [revealed, setRevealed] = useState(false)
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const triggerReveal = useCallback(() => {
    if (revealed) return
    setRevealed(true)
    FLIP_DELAYS.forEach((delay, idx) => {
      setTimeout(() => {
        setFlipped((prev) => new Set([...prev, idx]))
      }, delay)
    })
    if (onComplete) {
      setTimeout(onComplete, FLIP_DELAYS[2] + FLIP_DURATION)
    }
  }, [revealed, onComplete])

  useEffect(() => {
    if (!autoReveal) return
    const raf = requestAnimationFrame(() => {
      setTimeout(triggerReveal, 400)
    })
    return () => cancelAnimationFrame(raf)
  }, [autoReveal, triggerReveal])

  const toggleExpand = useCallback((idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="w-full max-w-[240px] sm:w-[220px]"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full cursor-pointer"
              style={{
                aspectRatio: '2 / 3',
                transformStyle: 'preserve-3d',
                transition: `transform ${FLIP_DURATION}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
                transform: flipped.has(idx) ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
              onClick={() => flipped.has(idx) && toggleExpand(idx)}
              role="button"
              tabIndex={0}
              aria-label={`Oracle card: ${card.label}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (flipped.has(idx)) toggleExpand(idx)
                }
              }}
            >
              <CardBack />
              <CardFront card={card} isExpanded={expanded.has(idx)} />
            </div>
          </div>
        ))}
      </div>

      {!revealed && (
        <div className="flex justify-center">
          <button
            onClick={triggerReveal}
            className="px-6 py-2.5 rounded-lg text-sm font-mono tracking-wider cursor-pointer transition-all duration-300 hover:brightness-110"
            style={{
              background: 'rgba(167,139,250,0.12)',
              color: '#a78bfa',
              border: '1px solid rgba(167,139,250,0.3)',
              boxShadow: '0 0 20px rgba(167,139,250,0.08)',
            }}
          >
            Reveal Reading
          </button>
        </div>
      )}
    </div>
  )
}

function CardBack() {
  return (
    <div
      className="absolute inset-0 rounded-xl overflow-hidden flex items-center justify-center"
      style={{
        backfaceVisibility: 'hidden',
        background:
          'radial-gradient(ellipse at center, rgba(49,27,96,0.8) 0%, rgba(8,5,18,0.97) 70%)',
        border: '1px solid rgba(139,92,246,0.3)',
        boxShadow:
          'inset 0 0 60px rgba(99,60,180,0.08), 0 0 15px rgba(139,92,246,0.06)',
      }}
    >
      {/* Inner frame */}
      <div
        className="absolute rounded-lg"
        style={{
          inset: '12px',
          border: '1px solid rgba(139,92,246,0.15)',
        }}
      />

      {/* Central sigil */}
      <div className="relative" style={{ width: '48px', height: '48px' }}>
        {/* Circle ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: '2px',
            border: '1px solid rgba(167,139,250,0.3)',
          }}
        />
        {/* Vertical bar */}
        <div
          className="absolute left-1/2 top-0 h-full"
          style={{
            width: '1px',
            background: 'rgba(167,139,250,0.4)',
            transform: 'translateX(-50%)',
          }}
        />
        {/* Horizontal bar */}
        <div
          className="absolute top-1/2 left-0 w-full"
          style={{
            height: '1px',
            background: 'rgba(167,139,250,0.4)',
            transform: 'translateY(-50%)',
          }}
        />
        {/* Diagonal NW-SE */}
        <div
          className="absolute left-1/2 top-0 h-full"
          style={{
            width: '1px',
            background: 'rgba(167,139,250,0.2)',
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />
        {/* Diagonal NE-SW */}
        <div
          className="absolute left-1/2 top-0 h-full"
          style={{
            width: '1px',
            background: 'rgba(167,139,250,0.2)',
            transform: 'translateX(-50%) rotate(-45deg)',
          }}
        />
        {/* Center diamond */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: '8px',
            height: '8px',
            background: 'rgba(167,139,250,0.6)',
            border: '1px solid rgba(167,139,250,0.8)',
            transform: 'translate(-50%, -50%) rotate(45deg)',
          }}
        />
      </div>

      {/* Corner marks */}
      <div
        className="absolute rounded-full"
        style={{ top: '12px', left: '12px', width: '3px', height: '3px', background: 'rgba(167,139,250,0.35)' }}
      />
      <div
        className="absolute rounded-full"
        style={{ top: '12px', right: '12px', width: '3px', height: '3px', background: 'rgba(167,139,250,0.35)' }}
      />
      <div
        className="absolute rounded-full"
        style={{ bottom: '12px', left: '12px', width: '3px', height: '3px', background: 'rgba(167,139,250,0.35)' }}
      />
      <div
        className="absolute rounded-full"
        style={{ bottom: '12px', right: '12px', width: '3px', height: '3px', background: 'rgba(167,139,250,0.35)' }}
      />
    </div>
  )
}

function CardFront({
  card,
  isExpanded,
}: {
  card: OracleCard
  isExpanded: boolean
}) {
  return (
    <div
      className="absolute inset-0 rounded-xl overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: 'rgba(8,5,18,0.95)',
        border: '1px solid rgba(167,139,250,0.25)',
        boxShadow: '0 0 20px rgba(139,92,246,0.06)',
        padding: '16px',
      }}
    >
      {/* Position label */}
      <div
        className="font-mono uppercase tracking-widest shrink-0"
        style={{
          fontSize: '0.5rem',
          color: '#a78bfa',
          letterSpacing: '0.2em',
          marginBottom: '8px',
        }}
      >
        {card.label}
      </div>

      {/* Card name */}
      <div
        className="shrink-0 leading-tight"
        style={{
          fontSize: '1.1rem',
          color: '#e2e8f0',
          fontFamily: 'Georgia, serif',
          fontWeight: 500,
          marginBottom: '10px',
        }}
      >
        {card.name}
      </div>

      {/* Divider */}
      <div
        className="w-full shrink-0"
        style={{
          height: '1px',
          background:
            'linear-gradient(to right, transparent, rgba(167,139,250,0.3), transparent)',
          marginBottom: '12px',
        }}
      />

      {/* Body — no scrolling, just content */}
      <div className="flex-1 flex flex-col">
        {!isExpanded && (
          <>
            <p
              style={{
                fontSize: '0.8rem',
                color: '#94a3b8',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              {card.body}
            </p>

            {/* Footnote */}
            {card.footnote && (
              <div
                className="font-mono mt-auto pt-2"
                style={{
                  fontSize: '0.6rem',
                  color: 'rgba(167,139,250,0.6)',
                  letterSpacing: '0.1em',
                  fontStyle: 'normal',
                }}
              >
                {card.footnote}
              </div>
            )}
          </>
        )}

        {/* Expanded view — full text */}
        {isExpanded && card.expandedText && (
          <div
            style={{
              fontSize: '0.75rem',
              color: '#cbd5e1',
              fontFamily: 'Georgia, serif',
              lineHeight: '1.7',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <p style={{ margin: 0, marginBottom: '8px' }}>
              {card.body}
            </p>
            <div
              style={{
                paddingTop: '8px',
                borderTop: '1px solid rgba(167,139,250,0.15)',
              }}
            >
              {card.expandedText}
            </div>
            {card.footnote && (
              <div
                className="font-mono mt-auto pt-2"
                style={{
                  fontSize: '0.6rem',
                  color: 'rgba(167,139,250,0.6)',
                  letterSpacing: '0.1em',
                  fontStyle: 'normal',
                }}
              >
                {card.footnote}
              </div>
            )}
          </div>
        )}
      </div>

      {/* "more" indicator */}
      {card.expandedText && (
        <div
          className="text-center font-mono shrink-0"
          style={{
            fontSize: '0.55rem',
            color: 'rgba(167,139,250,0.5)',
            letterSpacing: '0.15em',
            marginTop: '8px',
          }}
        >
          {isExpanded ? 'TAP TO COLLAPSE' : 'TAP FOR MORE'}
        </div>
      )}
    </div>
  )
}
