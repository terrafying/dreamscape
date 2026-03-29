'use client'

import { createSigilRenderData } from '@/lib/sigil'
import type { SigilRecipe } from '@/lib/types'

export default function VisionSigil({
  recipe,
  size = 240,
  className = '',
}: {
  recipe: SigilRecipe
  size?: number
  className?: string
}) {
  const data = createSigilRenderData(recipe, size)
  const center = size / 2
  const palette = recipe.style.palette.length > 0 ? recipe.style.palette : ['#f4c95d', '#c084fc', '#94a3b8']
  const stroke = palette[0]
  const accent = palette[1] || palette[0]

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-label="Vision sigil">
      <defs>
        <radialGradient id={`vision-sigil-bg-${recipe.seed}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(244,201,93,0.16)" />
          <stop offset="55%" stopColor="rgba(192,132,252,0.08)" />
          <stop offset="100%" stopColor="rgba(10,10,18,0)" />
        </radialGradient>
        <filter id={`vision-sigil-glow-${recipe.seed}`}>
          <feGaussianBlur stdDeviation={recipe.style.glow * 4} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={size} height={size} rx={size * 0.08} fill={`url(#vision-sigil-bg-${recipe.seed})`} />

      {recipe.style.border_mode !== 'none' && (
        <g opacity="0.8">
          <circle cx={center} cy={center} r={size * 0.42} fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth={1.2} />
          {(recipe.style.border_mode === 'double-circle' || recipe.style.border_mode === 'seal') && (
            <circle cx={center} cy={center} r={size * 0.455} fill="none" stroke={stroke} strokeOpacity="0.2" strokeWidth={0.8} />
          )}
        </g>
      )}

      <g filter={`url(#vision-sigil-glow-${recipe.seed})`}>
        {data.rings.map((ring) => (
          <circle
            key={ring.radius}
            cx={center}
            cy={center}
            r={ring.radius}
            fill="none"
            stroke={accent}
            strokeOpacity="0.24"
            strokeWidth={recipe.geometry.line_weight * 0.8}
          />
        ))}

        {data.spokes.map((spoke, index) => (
          <line
            key={`${spoke.x1}-${spoke.y1}-${index}`}
            x1={spoke.x1}
            y1={spoke.y1}
            x2={spoke.x2}
            y2={spoke.y2}
            stroke={stroke}
            strokeOpacity="0.38"
            strokeWidth={recipe.geometry.line_weight}
          />
        ))}

        {data.starPath && (
          <path
            d={data.starPath}
            fill="none"
            stroke={accent}
            strokeOpacity="0.7"
            strokeWidth={recipe.geometry.line_weight * 1.1}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        <path
          d={data.glyphPath}
          fill="none"
          stroke={stroke}
          strokeOpacity="0.92"
          strokeWidth={recipe.geometry.line_weight * 1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.runeMarks.map((mark, index) => (
          <line
            key={`${mark.x1}-${mark.y1}-${index}`}
            x1={mark.x1}
            y1={mark.y1}
            x2={mark.x2}
            y2={mark.y2}
            stroke={accent}
            strokeOpacity="0.55"
            strokeWidth={1.4}
          />
        ))}

        <circle cx={center} cy={center} r={size * 0.03} fill={accent} fillOpacity="0.85" />
      </g>

      {recipe.style.border_mode === 'seal' && (
        <text
          x="50%"
          y={size - size * 0.08}
          textAnchor="middle"
          fontSize={size * 0.045}
          letterSpacing={size * 0.008}
          fill="rgba(226,232,240,0.55)"
        >
          {recipe.glyph_letters.join(' ')}
        </text>
      )}
    </svg>
  )
}
