'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import SharedDreamCard from '@/components/SharedDreamCard'
import SharedVisionCard from '@/components/SharedVisionCard'
import type { SharedDreamWithCounts, SharedVisionWithCounts, VisionInterpretation } from '@/lib/types'
import { apiFetch } from '@/lib/apiFetch'
import { getSupabase } from '@/lib/supabaseClient'

const MODES = ['Dreams', 'Visions'] as const
type Mode = typeof MODES[number]
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

function useVisionFeed(page: number) {
  const [visions, setVisions] = useState<SharedVisionWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch(`/api/visions/feed?page=${page}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load')
        return
      }
      setVisions(page === 1 ? json.visions : (prev) => [...prev, ...json.visions])
      setHasMore(json.hasMore)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const handleReact = async (visionId: string, emoji: string) => {
    try {
      const res = await apiFetch(`/api/visions/${visionId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      })
      const json = await res.json()
      if (!res.ok) return
      setVisions((prev) => prev.map((vision) => {
        if (vision.id !== visionId) return vision
        const reactions = [...vision.reactions]
        const idx = reactions.findIndex((item) => item.emoji === emoji)
        if (json.reacted) {
          if (idx >= 0) reactions[idx].count++
          else reactions.push({ emoji, count: 1 })
        } else if (idx >= 0) {
          reactions[idx].count--
          if (reactions[idx].count <= 0) reactions.splice(idx, 1)
        }
        const myReactions = json.reacted
          ? [...vision.my_reactions, emoji]
          : vision.my_reactions.filter((item) => item !== emoji)
        return { ...vision, reactions, my_reactions: myReactions }
      }))
    } catch {}
  }

  const handleInterpret = async (visionId: string, text: string) => {
    const res = await apiFetch(`/api/visions/${visionId}/interpret`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to post note')

    setVisions((prev) => prev.map((vision) => {
      if (vision.id !== visionId) return vision
      const interpretation = json.interpretation as VisionInterpretation
      return {
        ...vision,
        interpretation_count: (vision.interpretation_count || 0) + 1,
        preview_interpretations: [interpretation, ...(vision.preview_interpretations || [])].slice(0, 2),
      }
    }))
  }

  return { visions, loading, hasMore, error, handleReact, handleInterpret }
}

export default function SharedFeedPage() {
  const [mode, setMode] = useState<Mode>('Dreams')
  const [tab, setTab] = useState<Tab>('Recent')
  const [page, setPage] = useState(1)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const { dreams, loading, hasMore, error, handleReact } = useFeed(tab, page, setPage)
  const { visions, loading: loadingVisions, hasMore: hasMoreVisions, error: visionError, handleReact: handleVisionReact, handleInterpret: handleVisionInterpret } = useVisionFeed(page)

  useEffect(() => {
    setPage(1)
  }, [mode])

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
          Sign in to browse shared dreams and future rituals from other dreamers.
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
          ◇ Community Rituals
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Shared dreams and vision rituals from dreamers like you
        </p>
      </div>

      <div
        className="flex rounded-xl p-0.5 gap-0.5"
        style={{ background: 'rgba(15,15,26,0.8)', border: '1px solid var(--border)' }}
      >
        {MODES.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: mode === m ? 'rgba(244,201,93,0.14)' : 'transparent',
              color: mode === m ? '#f4c95d' : 'var(--muted)',
              border: mode === m ? '1px solid rgba(244,201,93,0.24)' : '1px solid transparent',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'Dreams' && (
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
      )}

      {(mode === 'Dreams' ? error : visionError) && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
        >
          {mode === 'Dreams' ? error : visionError}
        </div>
      )}

      <div className="space-y-3">
        {mode === 'Dreams' && dreams.length === 0 && !loading && (
          <div
            className="rounded-xl p-6 text-center text-sm"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            {tab === 'Following'
              ? "You're not following anyone yet. Discover dreamers in the Recent tab."
              : "No shared dreams yet. Be the first to share."}
          </div>
        )}

        {mode === 'Visions' && visions.length === 0 && !loadingVisions && (
          <div
            className="rounded-xl p-6 text-center text-sm"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            No shared visions yet. Publish one from the Vision Ritual lane.
          </div>
        )}

        {mode === 'Dreams' && dreams.map(dream => (
          <SharedDreamCard
            key={dream.id}
            dream={dream}
            onReact={(emoji) => handleReact(dream.id, emoji)}
          />
        ))}

        {mode === 'Visions' && visions.map(vision => (
          <SharedVisionCard
            key={vision.id}
            vision={vision}
            signedIn={signedIn === true}
            onReact={(emoji) => handleVisionReact(vision.id, emoji)}
            onInterpret={(text) => handleVisionInterpret(vision.id, text)}
          />
        ))}

        {(mode === 'Dreams' ? loading : loadingVisions) && (
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

        {(mode === 'Dreams' ? hasMore && !loading : hasMoreVisions && !loadingVisions) && (
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
