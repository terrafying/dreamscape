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

const MOON_GUIDANCE: Record<string, string> = {
  Aries: 'Act on instinct today. Hesitation costs more than imperfection.',
  Taurus: 'Slow down. What feels solid and earthy is trustworthy right now.',
  Gemini: 'Follow the most interesting thread. Curiosity is your compass today.',
  Cancer: 'Tend to what needs nurturing. Home — inner or outer — wants attention.',
  Leo: 'Express what you usually hold back. Visibility is not vanity today.',
  Virgo: 'Attend to the small things. Precision work brings disproportionate reward.',
  Libra: 'Seek balance, but don\'t force symmetry. One side may need more weight.',
  Scorpio: 'Look beneath the surface. What you find there is more useful than what\'s visible.',
  Sagittarius: 'Aim further than seems reasonable. The reach itself changes you.',
  Capricorn: 'Build something. Structure and discipline are resources, not constraints.',
  Aquarius: 'Trust the unconventional idea. What seems strange today becomes obvious tomorrow.',
  Pisces: 'Let boundaries soften. Intuition is more reliable than logic right now.',
}

const PHASE_GUIDANCE: Record<string, string> = {
  'New Moon': 'Set intentions. The darkness is fertile ground for new beginnings.',
  'Waxing Crescent': 'Take the first small step. Momentum builds from action, not planning.',
  'First Quarter': 'Push through resistance. Challenges today are tests of commitment.',
  'Waxing Gibbous': 'Refine your approach. What\'s almost right needs adjustment, not abandonment.',
  'Full Moon': 'Illuminate what\'s been hidden. Revelations arrive whether you\'re ready or not.',
  'Waning Gibbous': 'Share what you\'ve learned. Teaching integrates knowledge.',
  'Third Quarter': 'Release what no longer serves. Letting go is not losing.',
  'Waning Crescent': 'Rest and reflect. The cycle is completing; honor what it brought.',
}

function CelestialGuidance({
  moonPhase,
  moonSign,
  retrogrades,
  aspects,
  chiron,
}: {
  moonPhase?: string
  moonSign?: string
  retrogrades: string[]
  aspects: Array<{ planet1: string; planet2: string; aspect: string; orb: number; meaning: string }>
  chiron?: { sign: string; house?: number } | null
}) {
  const lines: string[] = []

  if (moonSign && MOON_GUIDANCE[moonSign]) {
    lines.push(MOON_GUIDANCE[moonSign])
  }
  if (moonPhase && PHASE_GUIDANCE[moonPhase]) {
    lines.push(PHASE_GUIDANCE[moonPhase])
  }
  if (retrogrades.length > 0) {
    const planets = retrogrades.join(' and ')
    lines.push(`${planets} retrograde asks you to revisit rather than advance. Review before committing.`)
  }
  if (aspects.length > 0) {
    const strongest = aspects[0]
    if (strongest.meaning) lines.push(strongest.meaning)
  }
  if (chiron) {
    lines.push(`Chiron in ${chiron.sign}${chiron.house ? ` (House ${chiron.house})` : ''} \u2014 healing comes through what you've avoided. Approach it gently.`)
  }

  if (lines.length === 0) return null

  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)' }}
    >
      <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'rgba(167, 139, 250, 0.5)' }}>
        What this means for you
      </div>
      {lines.map((line, i) => (
        <p
          key={i}
          className="text-xs leading-relaxed"
          style={{ color: 'rgba(226, 232, 240, 0.55)', fontFamily: 'Georgia, serif' }}
        >
          {line}
        </p>
      ))}
    </div>
  )
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

      <CelestialGuidance
        moonPhase={moonPhase}
        moonSign={moonSign}
        retrogrades={retrogrades}
        aspects={aspects}
        chiron={chiron}
      />
    </div>
  )
}
