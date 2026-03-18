'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import type { DreamLog } from '@/lib/types'

interface Props { dreams: DreamLog[] }

const THEME_CATEGORIES = [
  'Archetypal', 'Shadow', 'Relational', 'Existential',
  'Transformative', 'Healing', 'Vocation', 'Ancestral',
]

export default function ThemeRadar({ dreams }: Props) {
  const counts: Record<string, number> = {}
  for (const cat of THEME_CATEGORIES) counts[cat] = 0

  for (const d of dreams) {
    for (const t of d.extraction?.themes || []) {
      const cat = THEME_CATEGORIES.find(
        (c) => c.toLowerCase() === t.category.toLowerCase()
      ) || 'Archetypal'
      counts[cat] = (counts[cat] || 0) + 1
    }
  }

  const data = THEME_CATEGORIES.map((cat) => ({ category: cat.slice(0, 8), full: cat, value: counts[cat] || 0 }))
  const hasData = data.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center rounded-xl h-32 text-xs"
        style={{ border: '1px dashed rgba(255,255,255,0.06)', color: 'var(--muted)' }}
      >
        Log dreams to see theme patterns
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
        Theme Radar
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 'auto']}
            tick={{ fill: '#475569', fontSize: 8 }}
            axisLine={false}
          />
          <Radar
            name="Themes"
            dataKey="value"
            stroke="#a78bfa"
            fill="#a78bfa"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: '#0f0f1a', border: '1px solid #1e1e2e' }}
                >
                  <span style={{ color: '#a78bfa' }}>{d.full}</span>
                  <span style={{ color: '#94a3b8' }}>{': '}{d.value}</span>
                </div>
              )
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
