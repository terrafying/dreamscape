'use client'

import { useState, useEffect } from 'react'
import type { BirthData } from '@/lib/types'
import { getBirthData, saveBirthData } from '@/lib/store'
import { getNatalPlacements } from '@/lib/astro'

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

interface BirthDataEditorProps {
  /** Render a compact summary only (no edit affordance) */
  compact?: boolean
}

export default function BirthDataEditor({ compact = false }: BirthDataEditorProps) {
  const [data, setData] = useState<BirthData | null>(null)
  const [editing, setEditing] = useState(!compact)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dateError, setDateError] = useState('')
  const [timeError, setTimeError] = useState('')

  // Form fields
  const [dateRaw, setDateRaw] = useState('')
  const [timeRaw, setTimeRaw] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    getBirthData().then((bd) => {
      setData(bd)
      if (bd) {
        setDateRaw(bd.date)
        setTimeRaw(bd.time || '')
        setLocation(bd.location)
      }
      setLoading(false)
    })
  }, [])

  const natal = data ? getNatalPlacements(data) : null

  function parseDate(raw: string): string | null {
    const s = raw.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`
    const mdy2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
    if (mdy2) return `${mdy2[3]}-${mdy2[1].padStart(2, '0')}-${mdy2[2].padStart(2, '0')}`
    return null
  }

  function parseTime(raw: string): string | null {
    const s = raw.trim()
    if (!s) return null
    if (/^\d{2}:\d{2}$/.test(s)) return s
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

  const handleSave = async () => {
    setDateError('')
    setTimeError('')
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : parseDate(dateRaw)
    if (!date) { setDateError('Use MM/DD/YYYY or YYYY-MM-DD'); return }
    if (!location.trim()) return
    const time = timeRaw ? (/^\d{2}:\d{2}$/.test(timeRaw) ? timeRaw : parseTime(timeRaw)) : undefined
    if (timeRaw && !time) { setTimeError('Use H:MM AM/PM or HH:MM'); return }

    const newData: BirthData = { date, time: time || undefined, location: location.trim() }
    setSaving(true)
    await saveBirthData(newData)
    setData(newData)
    setEditing(false)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleClear = async () => {
    await saveBirthData({ date: '2000-01-01', location: '' })
    setData(null)
    setDateRaw('')
    setTimeRaw('')
    setLocation('')
    setEditing(true)
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  }

  if (loading) return null

  // ── Natal chart summary (read-only) ────────────────────────────────
  if (!editing && natal && data) {
    return (
      <div
        className="rounded-xl px-4 py-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: 'var(--text)' }}>Natal Chart</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {data.date} · {data.time ? data.time.slice(0, 5) : '?'} · {data.location}
            </p>
          </div>
          {!compact && (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { emoji: '☀️', label: 'Sun', sign: natal.sunSign },
            { emoji: '🌙', label: 'Moon', sign: natal.moonSign },
            { emoji: '↑', label: 'Rising', sign: natal.risingSign || '–' },
          ].map(({ emoji, label, sign }) => (
            <div
              key={label}
              className="rounded-lg py-2"
              style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)' }}
            >
              <div className="text-lg">{emoji}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
              <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                {SIGN_SYMBOLS[sign] || ''} {sign}
              </div>
            </div>
          ))}
        </div>

        {saved && (
          <p className="text-xs text-center" style={{ color: '#86efac' }}>Saved ✓</p>
        )}
      </div>
    )
  }

  // ── Empty state (no birth data) ────────────────────────────────────
  if (!data && !editing) {
    return (
      <div
        className="rounded-xl px-4 py-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text)' }}>Natal Chart</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          No birth data yet. Add it to get personalized astrological context for your dreams.
        </p>
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: 'var(--violet)', color: '#07070f' }}
        >
          Add Birth Details
        </button>
      </div>
    )
  }

  // ── Edit form ──────────────────────────────────────────────────────
  return (
    <div
      className="rounded-xl px-4 py-4 space-y-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(167,139,250,0.25)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text)' }}>Natal Chart</p>
        {!compact && data && (
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            Cancel
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Birth Date *
          </label>
          <input
            type="date"
            value={dateRaw}
            onChange={(e) => { setDateRaw(e.target.value); setDateError('') }}
            max={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ ...inputStyle, borderColor: dateError ? '#f87171' : undefined, colorScheme: 'dark' }}
          />
          {dateError && <p className="text-xs" style={{ color: '#f87171' }}>{dateError}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Birth Time <span style={{ color: 'var(--muted)', fontSize: '10px' }}>(optional — needed for rising sign)</span>
          </label>
          <input
            type="time"
            value={timeRaw}
            onChange={(e) => { setTimeRaw(e.target.value); setTimeError('') }}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ ...inputStyle, borderColor: timeError ? '#f87171' : undefined, colorScheme: 'dark' }}
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
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: 'var(--violet)', color: '#07070f', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {data && !compact && (
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-xl text-xs"
            style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            Clear
          </button>
        )}
      </div>

      {saved && (
        <p className="text-xs text-center" style={{ color: '#86efac' }}>Saved ✓</p>
      )}
    </div>
  )
}
