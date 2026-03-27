'use client'

import { useEffect, useState } from 'react'
import type { ZeitgeistSnapshot } from '@/lib/zeitgeist'
import { buildZeitgeistInterpretation, formatZeitgeistSnapshot } from '@/lib/zeitgeist'

export default function ZeitgeistDashboard() {
  const [snapshot, setSnapshot] = useState<ZeitgeistSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [interpretation, setInterpretation] = useState<string>('')

  useEffect(() => {
    const fetchZeitgeist = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/zeitgeist/snapshot')
        if (!res.ok) throw new Error('Failed to fetch zeitgeist')
        const data = await res.json()
        setSnapshot(data)
        setInterpretation(
          buildZeitgeistInterpretation(data.topSymbols, data.trendingThemes, data.totalDreams)
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchZeitgeist()
    const interval = setInterval(fetchZeitgeist, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center text-slate-400">Loading collective dream zeitgeist...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center text-red-400">Error: {error}</div>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center text-slate-400">No dreams recorded yet</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif text-slate-100">Collective Dream Zeitgeist</h1>
        <p className="text-sm text-slate-400">What humanity is dreaming right now</p>
        <p className="text-xs text-slate-500">Updated: {snapshot.date}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{snapshot.totalDreams}</div>
          <div className="text-xs text-slate-400">Dreams Recorded</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{snapshot.uniqueDreamers}</div>
          <div className="text-xs text-slate-400">Unique Dreamers</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{snapshot.topSymbols.length}</div>
          <div className="text-xs text-slate-400">Symbols Found</div>
        </div>
      </div>

      {/* Top Symbols */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif text-slate-100">🔮 Most Common Symbols</h2>
        <div className="space-y-3">
          {snapshot.topSymbols.slice(0, 8).map((symbol, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 capitalize">{symbol.symbol}</span>
                <span className="text-xs text-slate-400">{symbol.count} dreams</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                  style={{ width: `${symbol.percentage}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">{symbol.percentage.toFixed(1)}% of all dreams</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Themes */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif text-slate-100">🌊 Trending Themes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {snapshot.trendingThemes.map((theme, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-200"
            >
              {theme}
            </div>
          ))}
        </div>
      </div>

      {/* Astrological Context */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif text-slate-100">✨ Astrological Context</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 space-y-3">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Moon Phase</div>
            <div className="text-slate-200">{snapshot.astrologicalContext.moonPhase}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Dominant Sign</div>
            <div className="text-slate-200">{snapshot.astrologicalContext.dominantSign}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Transit Note</div>
            <div className="text-slate-200 text-sm italic">{snapshot.astrologicalContext.transitNote}</div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif text-slate-100">📖 Collective Interpretation</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{interpretation}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-700">
        <p>The collective dream is a mirror of humanity's current consciousness.</p>
        <p>What symbols are you dreaming tonight?</p>
      </div>
    </div>
  )
}
