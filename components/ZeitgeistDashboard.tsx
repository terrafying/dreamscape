'use client'

import { useEffect, useState } from 'react'
import type { ZeitgeistSnapshot } from '@/lib/zeitgeist'
import { buildZeitgeistInterpretation } from '@/lib/zeitgeist'

interface ZeitgeistDashboardProps {
  compact?: boolean
}

export default function ZeitgeistDashboard({ compact = false }: ZeitgeistDashboardProps) {
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
      <div className="w-full p-6">
        <div className="text-center text-slate-400">Loading collective dream zeitgeist...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="text-center text-red-400">Error: {error}</div>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="w-full p-6">
        <div className="text-center text-slate-400">No dreams recorded yet</div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {!compact && (
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif text-slate-100">Collective Dream Zeitgeist</h2>
          <p className="text-sm text-slate-400">What humanity is dreaming right now</p>
          <p className="text-xs text-slate-500">Updated: {snapshot.date}</p>
        </div>
      )}

      {/* Stats */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-center">
          <div className={`font-bold text-purple-400 ${compact ? 'text-lg' : 'text-2xl'}`}>{snapshot.totalDreams}</div>
          <div className="text-xs text-slate-400">Dreams</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-center">
          <div className={`font-bold text-purple-400 ${compact ? 'text-lg' : 'text-2xl'}`}>{snapshot.uniqueDreamers}</div>
          <div className="text-xs text-slate-400">Dreamers</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-center">
          <div className={`font-bold text-purple-400 ${compact ? 'text-lg' : 'text-2xl'}`}>{snapshot.topSymbols.length}</div>
          <div className="text-xs text-slate-400">Symbols</div>
        </div>
      </div>

      {/* Top Symbols */}
      <div className="space-y-3">
        <h3 className={`font-serif text-slate-100 ${compact ? 'text-lg' : 'text-xl'}`}>🔮 Most Common Symbols</h3>
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
      <div className="space-y-3">
        <h3 className={`font-serif text-slate-100 ${compact ? 'text-lg' : 'text-xl'}`}>🌊 Trending Themes</h3>
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {snapshot.trendingThemes.slice(0, compact ? 4 : 10).map((theme, idx) => (
            <div
              key={idx}
              className={`rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-slate-200 ${compact ? 'text-xs' : 'text-sm'}`}
            >
              {theme}
            </div>
          ))}
        </div>
      </div>

      {/* Astrological Context */}
      <div className="space-y-3">
        <h3 className={`font-serif text-slate-100 ${compact ? 'text-lg' : 'text-xl'}`}>✨ Astrological Context</h3>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 space-y-2">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Moon Phase</div>
            <div className={`text-slate-200 ${compact ? 'text-sm' : ''}`}>{snapshot.astrologicalContext.moonPhase}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Dominant Sign</div>
            <div className={`text-slate-200 ${compact ? 'text-sm' : ''}`}>{snapshot.astrologicalContext.dominantSign}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Transit Note</div>
            <div className={`text-slate-200 italic ${compact ? 'text-xs' : 'text-sm'}`}>{snapshot.astrologicalContext.transitNote}</div>
          </div>
        </div>
      </div>

      {!compact && (
        <>
          {/* Interpretation */}
          <div className="space-y-3">
            <h3 className="text-xl font-serif text-slate-100">📖 Collective Interpretation</h3>
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{interpretation}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-700">
            <p>The collective dream is a mirror of humanity's current consciousness.</p>
            <p>What symbols are you dreaming tonight?</p>
          </div>
        </>
      )}
    </div>
  )
}
