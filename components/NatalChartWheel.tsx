'use client'

import { useState } from 'react'
import type { NatalChartData, NatalPlanetPosition, NatalAspect } from '@/lib/types'

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', Chiron: '⚷',
}

const ASPECT_COLORS: Record<string, string> = {
  Conjunction: '#fbbf24',
  Square: '#f87171',
  Trine: '#60a5fa',
  Opposition: '#c084fc',
  Sextile: '#34d399',
}

const ASPECT_DASH: Record<string, string> = {
  Conjunction: '',
  Square: '',
  Trine: '',
  Opposition: '0',
  Sextile: '4 3',
}

const SIZE = 400
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = 178
const ECLIP_R = 148
const INNER_R = 48

function lonToXY(lon: number, r: number): [number, number] {
  const rad = (lon - 90) * Math.PI / 180
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
}

function round2(n: number) { return Math.round(n * 100) / 100 }

interface Props {
  data: NatalChartData
}

type Selection =
  | { type: 'planet'; planet: string }
  | { type: 'aspect'; idx: number }
  | { type: 'house'; idx: number }
  | null

const HOUSE_MEANINGS: Record<number, string> = {
  1: 'Self — identity, appearance, how you present to the world',
  2: 'Resources — values, possessions, self-worth, what you hold dear',
  3: 'Communication — siblings, learning, daily mind, short journeys',
  4: 'Home — roots, family, foundation, the unconscious, endings',
  5: 'Creativity — children, romance, play, creative expression, joy',
  6: 'Health — daily work, service, routines, health, practical matters',
  7: 'Partnership — marriage, relationships, open enemies, one-to-one bonds',
  8: 'Transformation — shared resources, occult, depth, death and rebirth',
  9: 'Philosophy — higher mind, travel, spirituality, dreams, wisdom',
  10: 'Vocation — career, public image, authority, ambition, legacy',
  11: 'Community — friends, hopes, wishes, group identity, networks',
  12: 'Unconscious — hidden self, institutions, secrets, self-undoing',
}

const PLANET_MEANINGS: Record<string, string> = {
  Sun: 'Core identity, ego, will, creative life force, what drives you',
  Moon: 'Emotional nature, inner needs, instincts, how you process feelings',
  Mercury: 'Communication, thought, learning, curiosity, how you think and speak',
  Venus: 'Love, attraction, values, pleasure, what you desire in relationships',
  Mars: 'Drive, passion, anger, sexuality, how you assert yourself and take action',
  Jupiter: 'Expansion, luck, growth, optimism, where you find abundance',
  Saturn: 'Discipline, limits, responsibility, where you build lasting structures',
  Uranus: 'Innovation, rebellion, sudden change, where you break free',
  Neptune: 'Dreams, illusion, spirituality, where you dissolve boundaries',
  Pluto: 'Power, transformation, death and rebirth, where you regenerate',
  Chiron: 'The wounded healer — where you heal others through your own wounds',
}

function arcDistance(from: number, to: number): number {
  return ((to - from) % 360 + 360) % 360
}

function getHouseForLongitude(longitude: number, houseCusps: number[]): number {
  for (let i = 0; i < houseCusps.length; i += 1) {
    const start = houseCusps[i]
    const end = houseCusps[(i + 1) % houseCusps.length]
    const arcSpan = arcDistance(start, end)
    const arcToLon = arcDistance(start, longitude)
    if (arcToLon < arcSpan || i === houseCusps.length - 1 && arcToLon <= arcSpan) return i + 1
  }
  return 1
}

function sameSelection(a: Exclude<Selection, null>, b: Exclude<Selection, null>): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'planet' && b.type === 'planet') return a.planet === b.planet
  if (a.type === 'aspect' && b.type === 'aspect') return a.idx === b.idx
  if (a.type === 'house' && b.type === 'house') return a.idx === b.idx
  return false
}

export default function NatalChartWheel({ data }: Props) {
  const { planets, aspects, houseCusps, ascendant } = data
  const [selection, setSelection] = useState<Selection>(null)

  const planetMap = new Map(planets.map(p => [p.planet, p]))

  const houseLabelR = INNER_R - 4
  const signLabelR = OUTER_R + 14

  const toggleSelection = (next: Exclude<Selection, null>) => {
    setSelection(prev => (prev && sameSelection(prev, next) ? null : next))
  }

  const selectedAspect = selection?.type === 'aspect' ? aspects[selection.idx] : null
  const selectedPlanet = selection?.type === 'planet' ? planetMap.get(selection.planet) : null
  const selectedHouse = selection?.type === 'house' ? selection.idx + 1 : null

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
        aria-label="Natal chart wheel"
      >
        <defs>
          <radialGradient id="bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx={CX} cy={CY} r={OUTER_R + 6} fill="url(#bg)" />

        {[OUTER_R, ECLIP_R, INNER_R].map(r => (
          <circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={r === OUTER_R ? 2 : 1}
          />
        ))}

        {houseCusps.map((lon, i) => {
          const [x1, y1] = lonToXY(lon, INNER_R)
          const [x2, y2] = lonToXY(lon, OUTER_R)
          const isSelected = selection?.type === 'house' && selection.idx === i
          return (
            <g
              key={i}
              onClick={() => toggleSelection({ type: 'house', idx: i })}
              style={{ cursor: 'pointer' }}
            >
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={12}
              />
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isSelected ? 'rgba(196,181,253,0.9)' : i === 0 ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.12)'}
                strokeWidth={isSelected ? 2.6 : i === 0 ? 2 : 1}
                className={isSelected ? 'selection-pulse' : undefined}
              />
            </g>
          )
        })}

        {houseCusps.map((lon, i) => {
          const [lx, ly] = lonToXY(((lon + houseCusps[(i + 1) % 12]) / 2) % 360, houseLabelR)
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fill="rgba(255,255,255,0.3)"
              fontFamily="monospace"
            >
              {i + 1}
            </text>
          )
        })}

        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(idx => {
          const signName = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][idx]
          const lon = idx * 30 + 15
          const [sx, sy] = lonToXY(lon, signLabelR)
          return (
            <text
              key={idx}
              x={sx}
              y={sy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fill="rgba(255,255,255,0.5)"
            >
              {ZODIAC_SYMBOLS[signName]}
            </text>
          )
        })}

        {aspects.map((asp, i) => {
          const p1 = planetMap.get(asp.planet1)
          const p2 = planetMap.get(asp.planet2)
          if (!p1 || !p2) return null
          const [x1, y1] = lonToXY(p1.longitude, ECLIP_R)
          const [x2, y2] = lonToXY(p2.longitude, ECLIP_R)
          const color = ASPECT_COLORS[asp.aspect] ?? 'rgba(255,255,255,0.3)'
          const dash = ASPECT_DASH[asp.aspect] ?? ''
          const isSelected = selection?.type === 'aspect' && selection.idx === i
          return (
            <g key={i} onClick={() => toggleSelection({ type: 'aspect', idx: i })} style={{ cursor: 'pointer' }}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={14}
              />
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isSelected ? '#e9d5ff' : color}
                strokeWidth={isSelected ? 2.8 : asp.aspect === 'Conjunction' || asp.aspect === 'Square' ? 1.5 : 1}
                strokeOpacity={isSelected ? 1 : 0.6}
                strokeDasharray={dash || undefined}
                filter="url(#glow)"
                className={isSelected ? 'selection-pulse' : undefined}
              />
            </g>
          )
        })}

        {planets.map(p => {
          const [px, py] = lonToXY(p.longitude, ECLIP_R)
          const deg = p.longitude % 30
          const insideRing = deg > 10 && deg < 20
          const [tx, ty] = lonToXY(p.longitude, insideRing ? ECLIP_R + 14 : ECLIP_R + 10)
          const isSelected = selection?.type === 'planet' && selection.planet === p.planet
          const color = isSelected ? '#f5d0fe' : '#e2e8f0'
          return (
            <g key={p.planet} onClick={() => toggleSelection({ type: 'planet', planet: p.planet })} style={{ cursor: 'pointer' }}>
              <circle cx={px} cy={py} r={20} fill="transparent" />
              <circle
                cx={px}
                cy={py}
                r={7}
                fill="rgba(10,10,20,0.9)"
                stroke={color}
                strokeWidth={isSelected ? 2.4 : 1.5}
                className={isSelected ? 'selection-pulse' : undefined}
              />
              <text
                x={px}
                y={py}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill={color}
              >
                {PLANET_SYMBOLS[p.planet] ?? p.planet[0]}
              </text>
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7"
                fill={isSelected ? 'rgba(233,213,255,0.95)' : 'rgba(200,200,220,0.7)'}
                fontFamily="monospace"
              >
                {p.degree}°
              </text>
            </g>
          )
        })}

        <circle cx={CX} cy={CY} r={16} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="monospace">
          {round2(ascendant)}°
        </text>

        <style>
          {`@keyframes wheelPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.08); opacity: 0.9; }
          }
          .selection-pulse {
            transform-origin: center;
            animation: wheelPulse 1.6s ease-in-out infinite;
          }`}
        </style>
      </svg>

      {selection && (
        <div
          style={{
            background: 'rgba(15,15,30,0.7)',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 10,
            padding: '12px 14px',
            color: 'rgba(241,245,249,0.95)',
            maxWidth: 400,
            margin: '0 auto',
            fontFamily: 'Georgia, serif',
          }}
        >
          {selection.type === 'planet' && selectedPlanet && (
            <div className="space-y-2">
              <div className="text-sm" style={{ color: 'rgba(233,213,255,0.95)' }}>
                <span style={{ fontSize: 18, marginRight: 6 }}>{PLANET_SYMBOLS[selectedPlanet.planet] ?? selectedPlanet.planet[0]}</span>
                {selectedPlanet.planet}
              </div>
              <div className="text-xs" style={{ fontFamily: 'monospace', color: 'rgba(200,200,220,0.7)' }}>
                {selectedPlanet.sign} {selectedPlanet.degree}° • House {getHouseForLongitude(selectedPlanet.longitude, houseCusps)}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'rgba(226,232,240,0.8)' }}>
                <strong>{PLANET_MEANINGS[selectedPlanet.planet] || selectedPlanet.planet}</strong>
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'rgba(200,200,220,0.7)', fontStyle: 'italic' }}>
                In {selectedPlanet.sign}: Your {selectedPlanet.planet.toLowerCase()} expresses through {selectedPlanet.sign.toLowerCase()} qualities.
              </div>
              {aspects.filter(asp => asp.planet1 === selectedPlanet.planet || asp.planet2 === selectedPlanet.planet).length > 0 && (
                <div className="text-xs">
                  <div style={{ color: 'rgba(167,139,250,0.7)', marginBottom: 4 }}>Aspects:</div>
                  <ul className="list-disc pl-4" style={{ fontFamily: 'monospace', color: 'rgba(200,200,220,0.7)' }}>
                    {aspects
                      .filter(asp => asp.planet1 === selectedPlanet.planet || asp.planet2 === selectedPlanet.planet)
                      .map((asp, idx) => {
                        const other = asp.planet1 === selectedPlanet.planet ? asp.planet2 : asp.planet1
                        return <li key={`${asp.aspect}-${other}-${idx}`}>{asp.aspect} {other} (orb {round2(asp.orb)}°)</li>
                      })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {selection.type === 'aspect' && selectedAspect && (
            <div className="space-y-2">
              <div className="text-sm" style={{ color: 'rgba(233,213,255,0.95)' }}>{selectedAspect.aspect}</div>
              <div className="text-xs" style={{ fontFamily: 'monospace' }}>
                {PLANET_SYMBOLS[selectedAspect.planet1] ?? selectedAspect.planet1[0]} {selectedAspect.planet1} ↔ {PLANET_SYMBOLS[selectedAspect.planet2] ?? selectedAspect.planet2[0]} {selectedAspect.planet2}
              </div>
              <div className="text-xs" style={{ fontFamily: 'monospace' }}>Orb: {round2(selectedAspect.orb)}°</div>
            </div>
          )}

          {selection.type === 'house' && selectedHouse && (
            <div className="space-y-2">
              <div className="text-sm" style={{ color: 'rgba(233,213,255,0.95)' }}>
                House {selectedHouse}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'rgba(226,232,240,0.8)' }}>
                <strong>{HOUSE_MEANINGS[selectedHouse]}</strong>
              </div>
              {planets.filter(p => getHouseForLongitude(p.longitude, houseCusps) === selectedHouse).length > 0 && (
                <div className="text-xs">
                  <div style={{ color: 'rgba(167,139,250,0.7)', marginBottom: 4 }}>Planets here:</div>
                  <ul className="list-disc pl-4" style={{ fontFamily: 'monospace', color: 'rgba(200,200,220,0.7)' }}>
                    {planets
                      .filter(p => getHouseForLongitude(p.longitude, houseCusps) === selectedHouse)
                      .map(p => (
                        <li key={p.planet}>
                          {PLANET_SYMBOLS[p.planet] ?? p.planet[0]} {p.planet} ({p.sign} {p.degree}°)
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
