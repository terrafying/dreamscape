'use client'

import { useEffect, useState } from 'react'
import type { DreamExtraction } from '@/lib/types'
import AstroPanel from './AstroPanel'
import RecommendationCards from './RecommendationCards'
import SymbolTooltip from './SymbolTooltip'

interface ExtractionDisplayProps {
  extraction: DreamExtraction
  natal?: { sunSign: string; moonSign: string; risingSign?: string } | null
}

const NARRATIVE_ARC_LABEL: Record<string, string> = {
  ascending: '↑ Ascending',
  descending: '↓ Descending',
  cyclical: '↺ Cyclical',
  fragmented: '◇ Fragmented',
  liminal: '∿ Liminal',
}

const LUCIDITY_LABEL: Record<number, string> = {
  0: 'Non-lucid',
  1: 'Semi-lucid',
  2: 'Lucid',
  3: 'Fully lucid',
}

const SECTION_ORDER = ['interpretation', 'symbols', 'emotions', 'themes', 'characters', 'setting', 'astro', 'recommendations', 'goetic']

export default function ExtractionDisplay({ extraction, natal }: ExtractionDisplayProps) {
  const [visible, setVisible] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Stagger section reveal
    SECTION_ORDER.forEach((key, i) => {
      setTimeout(() => {
        setVisible((prev) => new Set([...prev, key]))
      }, i * 200)
    })
  }, [])

  const show = (key: string) => visible.has(key)

  return (
    <div className="space-y-5">
      {/* Meta row */}
      <div className="flex flex-wrap gap-2">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-mono"
          style={{ background: 'rgba(167,139,250,0.12)', color: 'var(--violet)', border: '1px solid rgba(167,139,250,0.25)' }}
        >
          {NARRATIVE_ARC_LABEL[extraction.narrative_arc] || extraction.narrative_arc}
        </span>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-mono"
          style={{ background: 'rgba(129,140,248,0.12)', color: 'var(--indigo)', border: '1px solid rgba(129,140,248,0.25)' }}
        >
          Lucidity: {LUCIDITY_LABEL[extraction.lucidity] || extraction.lucidity}
        </span>
        {extraction.tone && (
          <span
            className="text-xs px-2.5 py-1 rounded-full italic"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            {extraction.tone}
          </span>
        )}
      </div>

      {/* Interpretation */}
      {show('interpretation') && (
        <div
          className="rounded-xl p-4 animate-slide-up"
          style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)' }}
        >
          <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--violet)' }}>
            Interpretation
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text)', fontFamily: 'Georgia, serif', lineHeight: '1.75' }}
          >
            {extraction.interpretation}
          </p>
        </div>
      )}

      {/* Symbols */}
      {show('symbols') && extraction.symbols?.length > 0 && (
        <div className="animate-slide-up space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--violet)' }}>
            Symbols
          </div>
          <div className="space-y-2">
            {extraction.symbols.map((sym) => (
              <div
                key={sym.name}
                className="flex items-start gap-3 rounded-lg p-3"
                style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <SymbolTooltip symbol={{ name: sym.name, meaning: sym.meaning, category: sym.category, salience: sym.salience }}>
                      {sym.name}
                    </SymbolTooltip>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--muted)' }}>
                      {sym.category}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{sym.meaning}</p>
                </div>
                <div className="shrink-0 text-right">
                  <SalienceBar value={sym.salience} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotions */}
      {show('emotions') && extraction.emotions?.length > 0 && (
        <div className="animate-slide-up space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--violet)' }}>
            Emotional Signature
          </div>
          <div className="grid grid-cols-2 gap-2">
            {extraction.emotions.map((em) => (
              <div
                key={em.name}
                className="rounded-lg p-3"
                style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{em.name}</span>
                  <ValenceIndicator valence={em.valence} />
                </div>
                <IntensityBar value={em.intensity} valence={em.valence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Themes */}
      {show('themes') && extraction.themes?.length > 0 && (
        <div className="animate-slide-up space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--violet)' }}>
            Themes
          </div>
          <div className="flex flex-wrap gap-2">
            {extraction.themes.map((theme) => (
              <div
                key={theme.name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(129,140,248,0.1)',
                  border: '1px solid rgba(129,140,248,0.25)',
                }}
              >
                <span className="text-sm" style={{ color: 'var(--text)' }}>{theme.name}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>· {theme.category}</span>
                <span className="text-xs font-mono" style={{ color: 'var(--indigo)' }}>
                  {Math.round(theme.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Characters + Setting */}
      {show('characters') && (
        <div className="animate-slide-up grid grid-cols-1 gap-3 sm:grid-cols-2">
          {extraction.characters?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--violet)' }}>
                Characters
              </div>
              {extraction.characters.map((ch, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg p-3"
                  style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
                >
                  <span className="text-sm">{ch.known ? '👤' : '◈'}</span>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text)' }}>{ch.label}</div>
                    {ch.archetype && (
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>{ch.archetype}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {extraction.setting && (
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--violet)' }}>
                Setting
              </div>
              <div
                className="rounded-lg p-3 space-y-1"
                style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
              >
                <div className="text-sm" style={{ color: 'var(--text)' }}>{extraction.setting.type}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{extraction.setting.quality}</div>
                <div className="text-xs italic" style={{ color: 'var(--muted)' }}>{extraction.setting.time}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Astro Context */}
      {show('astro') && extraction.astro_context && (
        <div className="animate-slide-up">
          <AstroPanel extraction={extraction} natal={natal} />
        </div>
      )}

      {/* Recommendations */}
      {show('recommendations') && extraction.recommendations?.length > 0 && (
        <div className="animate-slide-up">
          <RecommendationCards recommendations={extraction.recommendations} />
        </div>
      )}

      {/* Goetic Resonance */}
      {show('goetic') && extraction.goetic_resonance && (
        <div
          className="animate-slide-up rounded-xl p-5 space-y-3"
          style={{
            background: 'rgba(10,5,20,0.8)',
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: 'inset 0 0 40px rgba(139,92,246,0.04)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.7)' }}>
              Goetic Resonance
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              ⬡
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-medium mb-1" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                {extraction.goetic_resonance.spirit}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {extraction.goetic_resonance.reason}
              </p>
            </div>
          </div>

          <div
            className="rounded-lg px-4 py-3 text-center"
            style={{ background: 'rgba(5,2,15,0.6)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <div className="text-xs font-mono mb-1.5" style={{ color: 'rgba(139,92,246,0.5)', letterSpacing: '0.15em' }}>
              BARBAROUS WORDS OF INVOCATION
            </div>
            <div
              className="text-sm tracking-widest"
              style={{
                color: 'rgba(200,180,255,0.9)',
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.25em',
                fontStyle: 'italic',
              }}
            >
              {extraction.goetic_resonance.barbarous}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SalienceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[0.25, 0.5, 0.75, 1].map((threshold) => (
        <div
          key={threshold}
          className="w-1 h-3 rounded-sm"
          style={{
            background: value >= threshold ? 'var(--violet)' : 'rgba(167,139,250,0.15)',
          }}
        />
      ))}
    </div>
  )
}

function IntensityBar({ value, valence }: { value: number; valence: number }) {
  const color = valence > 0.3 ? '#a78bfa' : valence < -0.3 ? '#f87171' : '#818cf8'
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.round(value * 100)}%`, background: color }}
      />
    </div>
  )
}

function ValenceIndicator({ valence }: { valence: number }) {
  if (valence > 0.3) return <span className="text-xs" style={{ color: '#a78bfa' }}>+</span>
  if (valence < -0.3) return <span className="text-xs" style={{ color: '#f87171' }}>−</span>
  return <span className="text-xs" style={{ color: 'var(--muted)' }}>·</span>
}
