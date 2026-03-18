'use client'

import { getMoonPhase } from '@/lib/astro'
import type { DreamLog } from '@/lib/types'

interface Props { dreams: DreamLog[] }

function getValenceColor(valence: number): string {
  if (valence > 0.5) return 'rgba(167,139,250,0.35)'
  if (valence > 0) return 'rgba(129,140,248,0.25)'
  if (valence > -0.5) return 'rgba(251,191,36,0.15)'
  return 'rgba(248,113,113,0.25)'
}

export default function LunarCalendar({ dreams }: Props) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Map dreams by date
  const dreamsByDate: Record<string, DreamLog[]> = {}
  for (const d of dreams) {
    if (!dreamsByDate[d.date]) dreamsByDate[d.date] = []
    dreamsByDate[d.date].push(d)
  }

  const cells = []
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const phase = getMoonPhase(dateStr)
    const dayDreams = dreamsByDate[dateStr] || []
    const isToday = day === today.getDate()

    // Average valence
    let avgValence = 0
    if (dayDreams.length > 0) {
      const emotions = dayDreams.flatMap((d) => d.extraction?.emotions || [])
      if (emotions.length > 0) {
        avgValence = emotions.reduce((sum, e) => sum + e.valence, 0) / emotions.length
      }
    }

    cells.push(
      <div
        key={day}
        className="flex flex-col items-center justify-start gap-0.5 rounded-lg p-1 relative"
        style={{
          aspectRatio: '1',
          background: dayDreams.length > 0 ? getValenceColor(avgValence) : 'transparent',
          border: isToday
            ? '1px solid rgba(167,139,250,0.5)'
            : '1px solid transparent',
          minHeight: '36px',
        }}
      >
        <span
          className="text-xs leading-none"
          style={{ color: isToday ? 'var(--violet)' : dayDreams.length > 0 ? 'var(--text)' : 'var(--muted)', fontSize: '10px' }}
        >
          {day}
        </span>
        <span className="text-xs leading-none" style={{ fontSize: '11px' }}>{phase.emoji}</span>
        {dayDreams.length > 0 && (
          <div
            className="absolute bottom-1 w-1 h-1 rounded-full"
            style={{ background: 'var(--violet)' }}
          />
        )}
      </div>
    )
  }

  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
          Lunar Calendar
        </div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>{monthName}</div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-mono" style={{ color: 'var(--muted)', fontSize: '9px' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {[
          { color: 'rgba(167,139,250,0.35)', label: 'Positive' },
          { color: 'rgba(251,191,36,0.2)', label: 'Mixed' },
          { color: 'rgba(248,113,113,0.25)', label: 'Difficult' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: color }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--violet)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Dream logged</span>
        </div>
      </div>
    </div>
  )
}
