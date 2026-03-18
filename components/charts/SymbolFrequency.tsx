'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DreamLog } from '@/lib/types'

interface Props { dreams: DreamLog[] }

export default function SymbolFrequency({ dreams }: Props) {
  const counts: Record<string, number> = {}
  for (const d of dreams) {
    for (const s of d.extraction?.symbols || []) {
      counts[s.name] = (counts[s.name] || 0) + 1
    }
  }

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name: name.slice(0, 14), full: name, count }))

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl h-32 text-xs"
        style={{ border: '1px dashed rgba(255,255,255,0.06)', color: 'var(--muted)' }}
      >
        Log dreams to see recurring symbols
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
        Top Symbols
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              return (
                <div
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: '#0f0f1a', border: '1px solid #1e1e2e' }}
                >
                  <div style={{ color: '#a78bfa' }}>{payload[0].payload.full}</div>
                  <div style={{ color: '#94a3b8' }}>
                    {payload[0].value} {payload[0].value === 1 ? 'dream' : 'dreams'}
                  </div>
                </div>
              )
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? '#a78bfa' : i === 1 ? '#818cf8' : 'rgba(167,139,250,0.4)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
