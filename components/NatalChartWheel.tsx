'use client'

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

export default function NatalChartWheel({ data }: Props) {
  const { planets, aspects, houseCusps, ascendant } = data

  const planetMap = new Map(planets.map(p => [p.planet, p]))

  const houseLabelR = INNER_R - 4
  const signLabelR = OUTER_R + 14

  return (
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
          cx={CX} cy={CY} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={r === OUTER_R ? 2 : 1}
        />
      ))}

      {houseCusps.map((lon, i) => {
        const [x1, y1] = lonToXY(lon, INNER_R)
        const [x2, y2] = lonToXY(lon, OUTER_R)
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={i === 0 ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={i === 0 ? 2 : 1}
          />
        )
      })}

      {houseCusps.map((lon, i) => {
        const [lx, ly] = lonToXY(((lon + houseCusps[(i + 1) % 12]) / 2) % 360, houseLabelR)
        return (
          <text
            key={i}
            x={lx} y={ly}
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
            x={sx} y={sy}
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
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color}
            strokeWidth={asp.aspect === 'Conjunction' || asp.aspect === 'Square' ? 1.5 : 1}
            strokeOpacity={0.6}
            strokeDasharray={dash || undefined}
            filter="url(#glow)"
          />
        )
      })}

      {planets.map(p => {
        const [px, py] = lonToXY(p.longitude, ECLIP_R)
        const deg = p.longitude % 30
        const insideRing = deg > 10 && deg < 20
        const [tx, ty] = lonToXY(p.longitude, insideRing ? ECLIP_R + 14 : ECLIP_R + 10)
        const color = '#e2e8f0'
        return (
          <g key={p.planet}>
            <circle
              cx={px} cy={py} r={7}
              fill="rgba(10,10,20,0.9)"
              stroke={color}
              strokeWidth={1.5}
            />
            <text
              x={px} y={py}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill={color}
            >
              {PLANET_SYMBOLS[p.planet] ?? p.planet[0]}
            </text>
            <text
              x={tx} y={ty}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="rgba(200,200,220,0.7)"
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
    </svg>
  )
}
