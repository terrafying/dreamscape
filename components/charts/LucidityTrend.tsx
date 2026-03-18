'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { DreamLog } from '@/lib/types'

interface Props { dreams: DreamLog[] }

export default function LucidityTrend({ dreams }: Props) {
  const data = dreams
    .filter((d) => d.extraction?.lucidity !== undefined)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((d) => ({
      date: d.date.slice(5),
      lucidity: d.extraction!.lucidity,
    }))

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl h-32 text-xs"
        style={{ border: '1px dashed rgba(255,255,255,0.06)', color: 'var(--muted)' }}
      >
        Log dreams to see lucidity trends
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
        Lucidity Trend
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="lucidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tickFormatter={(v) => ['–', '½', 'L', 'LL'][v] || v}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null
              const labels = ['Non-lucid', 'Semi-lucid', 'Lucid', 'Fully lucid']
              return (
                <div
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: '#0f0f1a', border: '1px solid #1e1e2e' }}
                >
                  <div style={{ color: '#94a3b8' }}>{label}</div>
                  <div style={{ color: '#818cf8' }}>{labels[payload[0].value]}</div>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="lucidity"
            stroke="#818cf8"
            strokeWidth={1.5}
            fill="url(#lucidGrad)"
            dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
