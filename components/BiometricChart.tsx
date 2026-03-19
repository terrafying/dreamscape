'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { BiometricData, DreamLog } from '@/lib/types'

interface Props {
  biometrics: BiometricData[]
  dreams: DreamLog[]
}

interface ChartPoint {
  date: string
  fullDate: string
  hrv: number
  sleepScore: number
  restfulnessIndex: number
  hasDream: boolean
  correlation: string
}

function buildCorrelationText(dream: DreamLog | undefined, biometric: BiometricData): string {
  if (!dream?.extraction) {
    if (biometric.hrv < 50) return `Low HRV night (${biometric.hrv})`
    if (biometric.sleepScore < 70) return `Lower sleep score (${biometric.sleepScore})`
    return 'No analyzed dream on this date'
  }

  const arc = dream.extraction.narrative_arc
  const fragmented = arc === 'fragmented' || arc === 'liminal'
  const hrvLow = biometric.hrv < 50
  const sleepLow = biometric.sleepScore < 70

  if (hrvLow && fragmented) {
    return `Low HRV night (${biometric.hrv}) — dreams were more fragmented`
  }
  if (sleepLow && fragmented) {
    return `Sleep score ${biometric.sleepScore} — dream arc was ${arc}`
  }
  if (hrvLow) return `Low HRV night (${biometric.hrv}) with dream recall`
  return `Dream logged with ${biometric.sleepScore} sleep score`
}

export default function BiometricChart({ biometrics, dreams }: Props) {
  const dreamByDate = new Map(dreams.map((d) => [d.date, d]))

  const data: ChartPoint[] = biometrics
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((b) => {
      const dream = dreamByDate.get(b.date)
      return {
        date: b.date.slice(5),
        fullDate: b.date,
        hrv: b.hrv,
        sleepScore: b.sleepScore,
        restfulnessIndex: b.restfulnessIndex,
        hasDream: Boolean(dream),
        correlation: buildCorrelationText(dream, b),
      }
    })

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl h-32 text-xs"
        style={{ border: '1px dashed rgba(255,255,255,0.06)', color: 'var(--muted)' }}
      >
        Add biometric data to see HRV and sleep score overlays
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
        Health Correlation
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            domain={[20, 110]}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="hrv"
            name="HRV"
            stroke="#2dd4bf"
            strokeWidth={1.8}
            dot={{ r: 2.8, fill: '#2dd4bf', strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="sleepScore"
            name="Sleep Score"
            stroke="#a78bfa"
            strokeWidth={1.8}
            dot={{ r: 2.8, fill: '#a78bfa', strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="restfulnessIndex"
            name="Restfulness"
            stroke="#f59e0b"
            strokeDasharray="4 3"
            strokeWidth={1.2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as ChartPoint | undefined
  if (!point) return null

  return (
    <div
      className="rounded-lg px-3 py-2 text-xs space-y-1"
      style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', maxWidth: '240px' }}
    >
      <div style={{ color: '#94a3b8' }}>{point.fullDate}</div>
      <div style={{ color: '#2dd4bf' }}>HRV: {point.hrv}</div>
      <div style={{ color: '#a78bfa' }}>Sleep score: {point.sleepScore}</div>
      <div style={{ color: '#f59e0b' }}>Restfulness: {point.restfulnessIndex}</div>
      <div style={{ color: point.hasDream ? '#e2e8f0' : '#64748b' }}>{point.correlation}</div>
    </div>
  )
}
