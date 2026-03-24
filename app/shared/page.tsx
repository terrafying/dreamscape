'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import SharedDreamCard from '@/components/SharedDreamCard'
import type { SharedDreamWithCounts } from '@/lib/types'
import { apiFetch } from '@/lib/apiFetch'
import { getSupabase } from '@/lib/supabaseClient'

const TABS = ['Recent', 'Following'] as const
type Tab = typeof TABS[number]

function useFeed(tab: Tab, page: number, setPage: (p: number) => void) {
  const [dreams, setDreams] = useState<SharedDreamWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [mySymbols, setMySymbols] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const endpoint = tab === 'Following' ? '/api/feed/friends' : '/api/feed'
      const params = new URLSearchParams({ page: String(page) })
      if (mySymbols.length > 0) params.set('mySymbols', mySymbols.join(','))
      const res = await apiFetch(`${endpoint}?${params}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to load'); return }
      setDreams(page === 1 ? json.dreams : prev => [...prev, ...json.dreams])
      setHasMore(json.hasMore)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [tab, page, mySymbols.join(',')])

  useEffect(() => { setPage(1); setDreams([]) }, [tab])

  useEffect(() => {
    load()
  }, [load])

  const handleReact = async (dreamId: string, emoji: string) => {
    try {
      const res = await apiFetch(`/api/dreams/${dreamId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      })
      const json = await res.json()
      if (!res.ok) return

      setDreams(prev => prev.map(d => {
        if (d.id !== dreamId) return d
        const reactions = [...d.reactions]
        const idx = reactions.findIndex(r => r.emoji === emoji)
        if (json.reacted) {
          if (idx >= 0) reactions[idx].count++
          else reactions.push({ emoji, count: 1 })
        } else {
          if (idx >= 0) {
            reactions[idx].count--
            if (reactions[idx].count <= 0) reactions.splice(idx, 1)
          }
        }
        const myReactions = json.reacted
          ? [...(d as SharedDreamWithCounts).my_reactions, emoji]
          : (d as SharedDreamWithCounts).my_reactions.filter((e: string) => e !== emoji)
        return { ...d, reactions, my_reactions: myReactions }
      }))
    } catch {}
  }

  return { dreams, loading, hasMore, error, handleReact }
}

export default function SharedFeedPage() {
  const [tab, setTab] = useState<Tab>('Recent')
  const [page, setPage] = useState(1)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const { dreams, loading, hasMore, error, handleReact } = useFeed(tab, page, setPage)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase()
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session?.user) {
          setSignedIn(true)
          return
        }
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          setSignedIn(true)
          return
        }
      }
      const syncEnabled = typeof window !== 'undefined' && localStorage.getItem('dreamscape_sync_enabled') === '1'
      setSignedIn(syncEnabled)
    }
    checkAuth()
  }, [])

  if (signedIn === null) return null

  if (!signedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
          ◇ Community Dreams
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
          Sign in to browse shared dreams and connect with other dreamers.
        </p>
        <Link
          href="/account"
          className="mt-4 inline-block px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--violet)', color: '#07070f' }}
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
          ◇ Community Dreams
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Shared dreams from dreamers like you
        </p>
      </div>

      <div
        className="flex rounded-xl p-0.5 gap-0.5"
        style={{ background: 'rgba(15,15,26,0.8)', border: '1px solid var(--border)' }}
      >
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: tab === t ? 'rgba(167,139,250,0.15)' : 'transparent',
              color: tab === t ? 'var(--violet)' : 'var(--muted)',
              border: tab === t ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
        >
          {error}
        </div>
      )}

      <div className="space-y-3">
        {dreams.length === 0 && !loading && (
          <div
            className="rounded-xl p-6 text-center text-sm"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            {tab === 'Following'
              ? "You're not following anyone yet. Discover dreamers in the Recent tab."
              : "No shared dreams yet. Be the first to share."}
          </div>
        )}

        {dreams.map(dream => (
          <SharedDreamCard
            key={dream.id}
            dream={dream}
            onReact={(emoji) => handleReact(dream.id, emoji)}
          />
        ))}

        {loading && (
          <div className="flex justify-center py-4">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--violet)', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-3 rounded-xl text-sm"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            Load more
          </button>
        )}
      </div>
    </div>
  )
}
