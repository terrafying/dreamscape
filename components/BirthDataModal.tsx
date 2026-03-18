'use client'

import { useState } from 'react'
import type { BirthData } from '@/lib/types'

interface BirthDataModalProps {
  onSave: (data: BirthData) => void
  onDismiss: () => void
}

// Parse loose date input → YYYY-MM-DD
function parseDate(raw: string): string | null {
  const s = raw.trim()
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // MM/DD/YYYY or M/D/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`
  // MM-DD-YYYY
  const mdy2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (mdy2) return `${mdy2[3]}-${mdy2[1].padStart(2, '0')}-${mdy2[2].padStart(2, '0')}`
  return null
}

// Parse loose time input → HH:MM (24h)
function parseTime(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  // HH:MM already
  if (/^\d{2}:\d{2}$/.test(s)) return s
  // H:MM or HH:MM with optional AM/PM
  const match = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
  if (match) {
    let h = parseInt(match[1], 10)
    const m = match[2]
    const meridiem = match[3]?.toLowerCase()
    if (meridiem === 'pm' && h < 12) h += 12
    if (meridiem === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m}`
  }
  return null
}

export default function BirthDataModal({ onSave, onDismiss }: BirthDataModalProps) {
  const [dateRaw, setDateRaw] = useState('')
  const [timeRaw, setTimeRaw] = useState('')
  const [location, setLocation] = useState('')
  const [dateError, setDateError] = useState('')
  const [timeError, setTimeError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setDateError('')
    setTimeError('')

    const date = parseDate(dateRaw)
    if (!date) {
      setDateError('Use MM/DD/YYYY or YYYY-MM-DD')
      return
    }
    if (!location.trim()) return

    const time = timeRaw ? parseTime(timeRaw) : undefined
    if (timeRaw && !time) {
      setTimeError('Use H:MM AM/PM or HH:MM')
      return
    }

    onSave({ date, time: time || undefined, location: location.trim() })
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{
        background: 'rgba(7,7,15,0.85)',
        backdropFilter: 'blur(8px)',
        paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 34px))'
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5 max-h-[85dvh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid rgba(167,139,250,0.25)' }}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-medium" style={{ color: 'var(--text)' }}>
            ✦ Birth Chart
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Optional. Adds natal chart context to every dream analysis — revealing how the current sky touches your personal astrology.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Birth Date *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={dateRaw}
              onChange={(e) => { setDateRaw(e.target.value); setDateError('') }}
              placeholder="MM/DD/YYYY"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ ...inputStyle, borderColor: dateError ? '#f87171' : undefined }}
              autoComplete="off"
            />
            {dateError && <p className="text-xs" style={{ color: '#f87171' }}>{dateError}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Birth Time{' '}
              <span style={{ color: 'var(--muted)', fontSize: '10px' }}>(optional — needed for rising sign)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={timeRaw}
              onChange={(e) => { setTimeRaw(e.target.value); setTimeError('') }}
              placeholder="4:30 AM"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ ...inputStyle, borderColor: timeError ? '#f87171' : undefined }}
              autoComplete="off"
            />
            {timeError && <p className="text-xs" style={{ color: '#f87171' }}>{timeError}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Birth Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, NY"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: 'var(--violet)', color: '#07070f' }}
            >
              Save Chart
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
