'use client'

import { useState } from 'react'
import type { DreamExtraction, NatalPlacements, CurrentSky } from '@/lib/types'

interface AstroPanelProps {
  extraction?: DreamExtraction
  natal?: NatalPlacements | null
  currentSky?: CurrentSky | null
  compact?: boolean
}

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

const HOUSE_MEANINGS: Record<number, string> = {
  1: 'Self', 2: 'Resources', 3: 'Communication', 4: 'Home',
  5: 'Creativity', 6: 'Health', 7: 'Partnership', 8: 'Transformation',
  9: 'Philosophy', 10: 'Vocation', 11: 'Community', 12: 'Unconscious',
}

export default function AstroPanel({ extraction, natal, currentSky, compact }: AstroPanelProps) {
  const [aspectsOpen, setAspectsOpen] = useState(false)
  const astro = extraction?.astro_context

  if (!astro && !currentSky) return null

  const moonPhase = astro?.moon_phase || currentSky?.moonPhase
  const moonSign = astro?.moon_sign || currentSky?.moonSign
  const moonEmoji = currentSky?.moonPhaseEmoji || '🌙'
  const retrogrades = currentSky?.retrogrades || []
  const cosmicThemes = astro?.cosmic_themes || []
  const transitNote = astro?.transit_note || currentSky?.dominantTransit
  const natalAspects = astro?.natal_aspects?.filter(Boolean) || []
  const aspects = currentSky?.aspects || []
  const chiron = currentSky?.chiron
  const outerPlanets = currentSky?.outerPlanets || []

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: 'rgba(15, 15, 30, 0.7)',
        border: '1px solid rgba(167, 139, 250, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">✦</span>
        <span
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: 'var(--violet)', letterSpacing: '0.15em' }}
        >
          Celestial Context
        </span>
      </div>

      {/* Current Sky */}
      <div className="grid grid-cols-2 gap-2">
        {moonPhase && (
          <div className="flex items-center gap-2">
            <span className="text-lg">{moonEmoji}</span>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Moon</div>
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {moonPhase}
                {moonSign && (
                  <span style={{ color: 'var(--violet)' }}>
                    {' '}in {SIGN_SYMBOLS[moonSign] || ''} {moonSign}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        {currentSky?.sunSign && (
          <div className="flex items-center gap-2">
            <span className="text-lg">☀️</span>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Sun</div>
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {SIGN_SYMBOLS[currentSky.sunSign] || ''} {currentSky.sunSign}
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Retrogrades */}
      {retrogrades.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {retrogrades.map((planet) => (
            <span
              key={planet}
              className="text-xs px-2 py-0.5 rounded-full font-mono"
              style={{
                background: 'rgba(251, 191, 36, 0.1)',
                color: 'var(--gold)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
              }}
            >
              ℞ {planet}
            </span>
          ))}
        </div>
      )}

      {/* Natal Big 3 */}
      {natal && (
        <div
          className="rounded-lg p-3 space-y-1.5"
          style={{ background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.15)' }}
        >
          <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--indigo)' }}>
            Natal Big 3
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg">☀️</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Sun</div>
              <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                {SIGN_SYMBOLS[natal.sunSign] || ''} {natal.sunSign}
              </div>
            </div>
            <div>
              <div className="text-lg">🌙</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Moon</div>
              <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                {SIGN_SYMBOLS[natal.moonSign] || ''} {natal.moonSign}
              </div>
            </div>
            <div>
              <div className="text-lg">↑</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Rising</div>
              <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                {natal.risingSign
                  ? `${SIGN_SYMBOLS[natal.risingSign] || ''} ${natal.risingSign}`
                  : <span style={{ color: 'var(--muted)' }}>–</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transit Aspects — collapsible */}
      {aspects.length > 0 && !compact && (
        <div>
          <button
            onClick={() => setAspectsOpen(v => !v)}
            className="text-xs font-mono uppercase tracking-wider w-full text-left flex items-center justify-between"
            style={{ color: 'var(--indigo)' }}
          >
            <span>Transit Aspects ({aspects.length})</span>
            <span>{aspectsOpen ? '▲' : '▼'}</span>
          </button>
          {aspectsOpen && (
            <div className="mt-2 space-y-1.5">
              {aspects.slice(0, 6).map((a, i) => (
                <div key={i} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {a.planet1} <span style={{ color: 'var(--gold)' }}>{a.aspect}</span> {a.planet2}
                    <span className="ml-2" style={{ color: 'var(--muted)' }}>({a.orb}°)</span>
                  </div>
                  <div className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}>
                    {a.meaning}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outer Planet Transits */}
      {outerPlanets.length > 0 && !compact && (
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Outer Planets
          </div>
          <div className="space-y-1">
            {outerPlanets.map((op) => (
              <div key={op.planet} className="flex items-start gap-2">
                <span className="text-xs mt-0.5" style={{ color: 'var(--muted)', minWidth: 60 }}>
                  {op.planet}
                </span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>
                  {SIGN_SYMBOLS[op.sign] || ''} {op.sign}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cosmic Themes */}
      {cosmicThemes.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1.5">
          {cosmicThemes.map((theme) => (
            <span
              key={theme}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(167, 139, 250, 0.1)',
                color: 'var(--violet)',
                border: '1px solid rgba(167, 139, 250, 0.2)',
              }}
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* Transit Note */}
      {transitNote && (
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}
        >
          {transitNote}
        </p>
      )}

      {/* Natal Aspects */}
      {natalAspects.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--indigo)' }}>
            Transit × Natal
          </div>
          {natalAspects.map((aspect, i) => (
            <div key={i} className="text-sm" style={{ color: 'var(--text)' }}>
              · {aspect}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
