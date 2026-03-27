'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Dreamer {
  id: string
  name: string
  avatar_url?: string
  handle: string
}

interface Match {
  id: string
  symbol_name: string
  matched_count: number
  matched_dreamers: Dreamer[]
  match_date: string
  created_at: string
  read: boolean
}

interface MatchesFeedProps {
  compact?: boolean
}

export function MatchesFeed({ compact = false }: MatchesFeedProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = await getSupabase()
      if (!supabase) return
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }

    getUser()
  }, [])

  useEffect(() => {
    if (!userId) return

    const fetchMatches = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/matches/user?userId=${userId}&limit=${compact ? 5 : 50}`
        )

        if (!response.ok) throw new Error('Failed to fetch matches')

        const data = await response.json()
        setMatches(data.matches || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
    const interval = setInterval(fetchMatches, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
        {error}
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-8 text-center">
        <p className="text-sm text-purple-300">
          No synchronicities yet. Log more dreams to find matches with other
          dreamers.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-${compact ? '3' : '4'}`}>
      {matches.map((match) => (
        <div
          key={match.id}
          className={`rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5 p-${
            compact ? '3' : '4'
          } transition-all hover:border-purple-500/40 hover:bg-purple-500/10`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className={`font-mono text-${compact ? 'sm' : 'base'} font-semibold text-purple-300`}>
                ✦ Synchronicity: {match.symbol_name}
              </h3>
              <p className={`mt-${compact ? '1' : '2'} text-${compact ? 'xs' : 'sm'} text-purple-200/70`}>
                You matched with {match.matched_count}{' '}
                {match.matched_count === 1 ? 'dreamer' : 'dreamers'} on this
                symbol
              </p>

              {/* Matched Dreamers */}
              <div className={`mt-${compact ? '2' : '3'} flex flex-wrap gap-2`}>
                {match.matched_dreamers.map((dreamer) => (
                  <Link
                    key={dreamer.id}
                    href={`/profile/${dreamer.handle}`}
                    className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs transition-colors hover:bg-purple-500/30"
                  >
                    {dreamer.avatar_url && (
                      <img
                        src={dreamer.avatar_url}
                        alt={dreamer.name}
                        className="h-5 w-5 rounded-full"
                      />
                    )}
                    <span className="text-purple-200">{dreamer.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="text-right">
              <p className={`text-${compact ? 'xs' : 'sm'} text-purple-300/50`}>
                {new Date(match.created_at).toLocaleDateString()}
              </p>
              {!match.read && (
                <div className="mt-1 h-2 w-2 rounded-full bg-pink-500" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
