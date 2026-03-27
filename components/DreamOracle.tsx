'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { DreamExtraction } from '@/lib/types'
import { findTarotCard, selectAstrologicalNote } from '@/lib/spiritual-content'
import { findThothArchetype, selectArchetypeByArc, THOTH_ARCHETYPES } from '@/lib/thoth-tarot'

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
  archetypeName?: string
  archetypeQuote?: string
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
  const thoth = topSymbol ? findThothArchetype(topSymbol.name) : null

  const card1: OracleCard = {
    label: 'I \u2014 The Symbol',
    name: thoth?.name ?? tarot?.name ?? topSymbol?.name ?? 'The Unnamed',
    body: topSymbol?.meaning ?? 'A symbol beneath the threshold of naming.',
    footnote: thoth?.hebrewLetter ? `${thoth.hebrewLetter} — ${thoth.path}` : tarot?.principle ? `Principle of ${tarot.principle}` : '',
    expandedText: thoth?.dreamResonance ?? tarot?.meaning ?? '',
    archetypeName: thoth?.name,
    archetypeQuote: thoth?.crowleyQuote,
  }

  // Card 2 — "The Current" (present / flow)
  const emotion = extraction.emotions?.[0]
  const moonSign = extraction.astro_context?.moon_sign ?? ''
  const arc = extraction.narrative_arc ?? 'liminal'
  const astroNote = selectAstrologicalNote(moonSign, arc)
  const arcArchetype = selectArchetypeByArc(arc)
  const bodyNote = astroNote
    ? astroNote.length > 160
      ? astroNote.slice(0, 160) + '\u2026'
      : astroNote
    : `The Moon in ${moonSign} shapes tonight\u2019s emotional landscape.`

  const card2: OracleCard = {
    label: 'II \u2014 The Current',
    name: arcArchetype?.name ?? (emotion
      ? `${emotion.name} \u00b7 ${Math.round(emotion.intensity * 100)}%`
      : 'Stillness'),
    body: bodyNote,
    footnote: arcArchetype?.hebrewLetter ? `${arcArchetype.hebrewLetter} — ${ARC_LABELS[arc] ?? arc}` : ARC_LABELS[arc] ?? arc,
    expandedText: astroNote.length > 160 ? astroNote : '',
    archetypeName: arcArchetype?.name,
    archetypeQuote: arcArchetype?.crowleyQuote,
  }

  // Card 3 — "The Guidance" (future / path)
  const goetic = extraction.goetic_resonance
  const rec = extraction.recommendations?.[0]
  const completionArchetype = findThothArchetype('completion') || THOTH_ARCHETYPES[21] // The World

  let card3: OracleCard
  if (goetic) {
    card3 = {
      label: 'III \u2014 The Guidance',
      name: goetic.spirit,
      body: goetic.reason,
      footnote: '',
      expandedText: goetic.barbarous,
      archetypeName: completionArchetype?.name,
      archetypeQuote: completionArchetype?.crowleyQuote,
    }
  } else if (rec) {
    card3 = {
      label: 'III \u2014 The Guidance',
      name: rec.action.length > 50 ? rec.action.slice(0, 50) + '\u2026' : rec.action,
      body: rec.why,
      footnote: `Timing: ${rec.timing}`,
      expandedText: rec.action.length > 50 ? rec.action : '',
      archetypeName: completionArchetype?.name,
      archetypeQuote: completionArchetype?.crowleyQuote,
    }
  } else {
    card3 = {
      label: 'III \u2014 The Guidance',
      name: completionArchetype?.name ?? 'The Open Path',
      body: completionArchetype?.dreamResonance ?? 'No specific guidance crystallized \u2014 the way forward is yours to shape.',
      footnote: completionArchetype?.hebrewLetter ?? '',
      expandedText: '',
      archetypeName: completionArchetype?.name,
      archetypeQuote: completionArchetype?.crowleyQuote,
    }
  }

  return [card1, card2, card3]
}

export default function DreamOracle({
  extraction,
  autoReveal = true,
  onComplete,
}: DreamOracleProps) {
  const cards = useMemo(() => buildOracleCards(extraction), [extraction])
  const [revealed, setRevealed] = useState(true)
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState<number | null>(null)
  const touchStartX = useRef(0)

  const triggerReveal = useCallback(() => {
    if (revealed) return
    setRevealed(true)
    // Auto-flip cards on reveal
    FLIP_DELAYS.forEach((delay, idx) => {
      setTimeout(() => {
        setFlipped((prev) => new Set([...prev, idx]))
      }, delay)
    })
    if (onComplete) {
      setTimeout(onComplete, FLIP_DELAYS[2] + FLIP_DURATION)
    }
  }, [revealed, onComplete])

  const revealCard = useCallback((idx: number) => {
    if (!revealed) {
      setRevealed(true)
    }
    setFlipped((prev) => new Set([...prev, idx]))
    if (flipped.size === cards.length - 1) {
      if (onComplete) {
        setTimeout(onComplete, FLIP_DURATION)
      }
    }
  }, [revealed, flipped.size, cards.length, onComplete])

  useEffect(() => {
    if (!autoReveal) return
    const raf = requestAnimationFrame(() => {
      setTimeout(triggerReveal, 400)
    })
    return () => cancelAnimationFrame(raf)
  }, [autoReveal, triggerReveal])

  const handleCardClick = useCallback((idx: number) => {
    if (flipped.has(idx)) {
      setModalOpen(idx)
    }
  }, [flipped])

  const handleModalTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleModalTouchEnd = (e: React.TouchEvent, idx: number) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && idx < cards.length - 1) {
        setModalOpen(idx + 1)
      } else if (diff < 0 && idx > 0) {
        setModalOpen(idx - 1)
      } else {
        setModalOpen(null)
      }
    }
  }

  return (
    <>
      <div className="w-full space-y-6">

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="w-full max-w-xs sm:w-64"
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
                onClick={() => {
                  if (revealed && !flipped.has(idx)) {
                    revealCard(idx)
                  } else if (flipped.has(idx)) {
                    handleCardClick(idx)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Oracle card: ${card.label}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (revealed && !flipped.has(idx)) {
                      revealCard(idx)
                    } else if (flipped.has(idx)) {
                      handleCardClick(idx)
                    }
                  }
                }}
              >
                <CardBack />
                <CardFront card={card} />
              </div>
            </div>
          ))}
        </div>

        {revealed && flipped.size < cards.length && (
          <div className="flex justify-center">
            <p className="text-xs" style={{ color: 'rgba(167,139,250,0.5)', fontStyle: 'italic' }}>
              Click cards to reveal ({flipped.size}/{cards.length})
            </p>
          </div>
        )}
      </div>

      {modalOpen !== null && (
        <CardModal
          card={cards[modalOpen]}
          cardIndex={modalOpen}
          totalCards={cards.length}
          onClose={() => setModalOpen(null)}
          onNext={() => modalOpen < cards.length - 1 && setModalOpen(modalOpen + 1)}
          onPrev={() => modalOpen > 0 && setModalOpen(modalOpen - 1)}
          onTouchStart={handleModalTouchStart}
          onTouchEnd={(e) => handleModalTouchEnd(e, modalOpen)}
        />
      )}
    </>
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

function CardFront({ card }: { card: OracleCard }) {
  return (
    <div
      className="absolute inset-0 rounded-xl overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: 'rgba(8,5,18,0.95)',
        border: '1px solid rgba(167,139,250,0.25)',
        boxShadow: '0 0 20px rgba(139,92,246,0.06)',
        padding: '20px',
      }}
    >
      <div
        className="font-mono uppercase tracking-widest shrink-0"
        style={{
          fontSize: '0.5rem',
          color: '#a78bfa',
          letterSpacing: '0.2em',
          marginBottom: '10px',
        }}
      >
        {card.label}
      </div>

      <div
        className="shrink-0 leading-tight"
        style={{
          fontSize: '1.2rem',
          color: '#e2e8f0',
          fontFamily: 'Georgia, serif',
          fontWeight: 500,
          marginBottom: '12px',
        }}
      >
        {card.name}
      </div>

      <div
        className="w-full shrink-0"
        style={{
          height: '1px',
          background:
            'linear-gradient(to right, transparent, rgba(167,139,250,0.3), transparent)',
          marginBottom: '14px',
        }}
      />

      <p
        className="flex-1"
        style={{
          fontSize: '0.85rem',
          color: '#94a3b8',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          lineHeight: '1.6',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {card.body}
      </p>

      {card.footnote && (
        <div
          className="font-mono mt-auto pt-3"
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

      <div
        className="text-center font-mono shrink-0 mt-3"
        style={{
          fontSize: '0.55rem',
          color: 'rgba(167,139,250,0.5)',
          letterSpacing: '0.15em',
        }}
      >
        TAP FOR MORE
      </div>
    </div>
  )
}

function CardModal({
  card,
  cardIndex,
  totalCards,
  onClose,
  onNext,
  onPrev,
  onTouchStart,
  onTouchEnd,
}: {
  card: OracleCard
  cardIndex: number
  totalCards: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(8,5,18,0.98)',
          border: '1px solid rgba(167,139,250,0.3)',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
          style={{ color: 'rgba(167,139,250,0.6)' }}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '90vh' }}>
          <div
            className="font-mono uppercase tracking-widest"
            style={{
              fontSize: '0.6rem',
              color: '#a78bfa',
              letterSpacing: '0.2em',
            }}
          >
            {card.label}
          </div>

          <div
            style={{
              fontSize: '1.5rem',
              color: '#e2e8f0',
              fontFamily: 'Georgia, serif',
              fontWeight: 500,
            }}
          >
            {card.name}
          </div>

          <div
            style={{
              height: '1px',
              background:
                'linear-gradient(to right, transparent, rgba(167,139,250,0.3), transparent)',
            }}
          />

          <p
            style={{
              fontSize: '0.95rem',
              color: '#94a3b8',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              lineHeight: '1.7',
              margin: 0,
            }}
          >
            {card.body}
          </p>

          {card.expandedText && (
            <div
              style={{
                paddingTop: '16px',
                borderTop: '1px solid rgba(167,139,250,0.15)',
                fontSize: '0.9rem',
                color: '#cbd5e1',
                fontFamily: 'Georgia, serif',
                lineHeight: '1.8',
              }}
            >
              {card.expandedText}
            </div>
          )}

          {card.footnote && (
            <div
              className="font-mono"
              style={{
                fontSize: '0.7rem',
                color: 'rgba(167,139,250,0.6)',
                letterSpacing: '0.1em',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(167,139,250,0.1)',
              }}
            >
              {card.footnote}
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between p-4 border-t"
          style={{ borderColor: 'rgba(167,139,250,0.1)' }}
        >
          <button
            onClick={onPrev}
            disabled={cardIndex === 0}
            className="px-3 py-1.5 rounded text-xs font-mono transition-all"
            style={{
              color: cardIndex === 0 ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.6)',
              border: `1px solid ${cardIndex === 0 ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.2)'}`,
              opacity: cardIndex === 0 ? 0.5 : 1,
              cursor: cardIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Prev
          </button>

          <div
            style={{
              fontSize: '0.7rem',
              color: 'rgba(167,139,250,0.5)',
              fontFamily: 'monospace',
            }}
          >
            {cardIndex + 1} / {totalCards}
          </div>

          <button
            onClick={onNext}
            disabled={cardIndex === totalCards - 1}
            className="px-3 py-1.5 rounded text-xs font-mono transition-all"
            style={{
              color: cardIndex === totalCards - 1 ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.6)',
              border: `1px solid ${cardIndex === totalCards - 1 ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.2)'}`,
              opacity: cardIndex === totalCards - 1 ? 0.5 : 1,
              cursor: cardIndex === totalCards - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
