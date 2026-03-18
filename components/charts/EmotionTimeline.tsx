'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { DreamLog } from '@/lib/types'

interface Props { dreams: DreamLog[] }

const COLORS = ['#a78bfa', '#818cf8', '#2dd4bf', '#f472b6', '#fbbf24']

export default function EmotionTimeline({ dreams }: Props) {
  // Get top 4 emotions across all dreams
  const emotionCount: Record<string, number> = {}
  for (const d of dreams) {
    for (const em of d.extraction?.emotions || []) {
      emotionCount[em.name] = (emotionCount[em.name] || 0) + 1
    }
  }
  const topEmotions = Object.entries(emotionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name)

  if (topEmotions.length === 0) return <EmptyState label="Log dreams to see emotion patterns" />

  const data = dreams
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((d) => {
      const point: Record<string, string | number> = {
        date: d.date.slice(5), // MM-DD
      }
      for (const em of d.extraction?.emotions || []) {
        if (topEmotions.includes(em.name)) {
          point[em.name] = em.intensity
        }
      }
      return point
    })

  return (
    <div className="space-y-2">
      <ChartTitle>Emotion Timeline</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
          />
          {topEmotions.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: COLORS[i] }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs space-y-1"
      style={{ background: '#0f0f1a', border: '1px solid #1e1e2e' }}
    >
      <div style={{ color: '#94a3b8' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.stroke }}>
          {p.name}: {(p.value * 100).toFixed(0)}%
        </div>
      ))}
    </div>
  )
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
      {children}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl h-32 text-xs"
      style={{ border: '1px dashed rgba(255,255,255,0.06)', color: 'var(--muted)' }}
    >
      {label}
    </div>
  )
}
