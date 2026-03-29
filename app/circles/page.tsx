'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'
import { getSupabase } from '@/lib/supabaseClient'
import ZeitgeistDashboard from '@/components/ZeitgeistDashboard'
import { MatchesFeed } from '@/components/MatchesFeed'
import SharedVisionCard from '@/components/SharedVisionCard'
import type { SharedVisionWithCounts, VisionInterpretation } from '@/lib/types'

type CircleListItem = {
  id: string
  name: string
  description: string
  max_members: number
  member_count: number
  my_role: 'creator' | 'member'
  last_activity_at: string
}

function relativeTime(dateStr: string): string {
  const delta = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(delta / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function useVisionFeed(enabled: boolean) {
  const [visions, setVisions] = useState<SharedVisionWithCounts[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled || visions.length > 0) return

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiFetch('/api/visions/feed?page=1')
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Failed to load visions')
          return
        }
        setVisions(json.visions ?? [])
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [enabled, visions.length])

  const handleReact = async (visionId: string, emoji: string) => {
    const res = await apiFetch(`/api/visions/${visionId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    })
    const json = await res.json()
    if (!res.ok) return

    setVisions((prev) => prev.map((vision) => {
      if (vision.id !== visionId) return vision
      const reactions = [...vision.reactions]
      const index = reactions.findIndex((item) => item.emoji === emoji)
      if (json.reacted) {
        if (index >= 0) reactions[index].count++
        else reactions.push({ emoji, count: 1 })
      } else if (index >= 0) {
        reactions[index].count--
        if (reactions[index].count <= 0) reactions.splice(index, 1)
      }
      const myReactions = json.reacted
        ? [...vision.my_reactions, emoji]
        : vision.my_reactions.filter((item) => item !== emoji)
      return { ...vision, reactions, my_reactions: myReactions }
    }))
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
        interpretation_count: vision.interpretation_count + 1,
        preview_interpretations: [interpretation, ...(vision.preview_interpretations || [])].slice(0, 2),
      }
    }))
  }

  return { visions, loading, error, handleReact, handleInterpret }
}

export default function CirclesPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [circles, setCircles] = useState<CircleListItem[]>([])
  const [activeTab, setActiveTab] = useState<'circles' | 'visions' | 'zeitgeist' | 'matches'>('circles')
  const visionFeed = useVisionFeed(activeTab === 'visions' && signedIn === true)

  const loadCircles = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/circles')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load circles')
        setCircles([])
        return
      }
      setCircles(json.circles ?? [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase()
      if (supabase) {
        const [{ data: sessionData }, { data: userData }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ])
        if (sessionData?.session?.user || userData?.user) {
          setSignedIn(true)
          await loadCircles()
          return
        }
      }
      setSignedIn(false)
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setError('')

    try {
      const res = await apiFetch('/api/circles', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to create circle')
        return
      }

      setCircles(prev => [json.circle, ...prev])
      setName('')
      setDescription('')
      setShowCreate(false)
    } catch {
      setError('Network error')
    } finally {
      setCreating(false)
    }
  }

  if (signedIn === null) return null

  if (!signedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-3">
        <h1 className="text-2xl" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>◇ Dream Circles</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Sign in to create private circles and share readings with friends.
        </p>
        <Link
          href="/account"
          className="inline-block px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--violet)', color: '#07070f' }}
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>◇ Community</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Dream circles, shared visions, synchronicities, and collective zeitgeist</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setActiveTab('circles')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'circles'
              ? 'border-b-2 text-violet-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
          style={activeTab === 'circles' ? { borderColor: 'var(--violet)' } : {}}
        >
          Dream Circles
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'matches'
              ? 'border-b-2 text-violet-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
          style={activeTab === 'matches' ? { borderColor: 'var(--violet)' } : {}}
        >
          Synchronicities
        </button>
        <button
          onClick={() => setActiveTab('visions')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'visions'
              ? 'border-b-2 text-violet-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
          style={activeTab === 'visions' ? { borderColor: 'var(--violet)' } : {}}
        >
          Visions
        </button>
        <button
          onClick={() => setActiveTab('zeitgeist')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'zeitgeist'
              ? 'border-b-2 text-violet-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
          style={activeTab === 'zeitgeist' ? { borderColor: 'var(--violet)' } : {}}
        >
          Zeitgeist
        </button>
      </div>

      {/* Circles Tab */}
      {activeTab === 'circles' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreate(v => !v)}
              className="px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(167,139,250,0.16)', border: '1px solid rgba(167,139,250,0.35)', color: 'var(--violet)' }}
            >
              {showCreate ? 'Close' : 'Create Circle'}
            </button>
          </div>

          {showCreate && (
            <form
              onSubmit={handleCreate}
              className="rounded-2xl p-4 space-y-3"
              style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                  Circle name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="Moonwater Coven"
                  maxLength={48}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none min-h-[80px]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="Private dream sharing for close friends"
                  maxLength={240}
                />
              </div>

              <button
                type="submit"
                disabled={creating || name.trim().length < 2}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: creating ? 'rgba(167,139,250,0.1)' : 'var(--violet)',
                  color: creating ? 'var(--violet)' : '#07070f',
                  opacity: creating || name.trim().length < 2 ? 0.7 : 1,
                }}
              >
                {creating ? 'Creating…' : 'Create Circle'}
              </button>
            </form>
          )}

          {error && (
            <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <div className="space-y-3">
            {!loading && circles.length === 0 && (
              <div className="rounded-2xl p-6 text-center text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                Create a dream circle to share readings with close friends
              </div>
            )}

            {circles.map(circle => (
              <Link
                key={circle.id}
                href={`/circles/${circle.id}`}
                className="block rounded-2xl p-4 space-y-2 transition-all"
                style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(129,140,248,0.2)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{circle.name}</h2>
                    {!!circle.description && (
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{circle.description}</p>
                    )}
                  </div>
                  <span
                    className="text-[10px] px-2 py-1 rounded-full font-mono uppercase"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: 'rgba(251,191,36,0.85)' }}
                  >
                    {circle.my_role}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                  <span>{circle.member_count}/{circle.max_members} members</span>
                  <span>•</span>
                  <span>active {relativeTime(circle.last_activity_at)}</span>
                </div>
              </Link>
            ))}

            {loading && (
              <div className="flex justify-center py-4">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--violet)', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Synchronicities Tab */}
      {activeTab === 'matches' && (
        <MatchesFeed compact={false} />
      )}

      {activeTab === 'visions' && (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(192,132,252,0.16)' }}
          >
            <div className="text-xs uppercase tracking-[0.16em]" style={{ color: '#d8b4fe' }}>
              Vision Rituals
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Browse future-facing rituals from the community, leave notes, and open the full rite when something resonates.
            </p>
            <Link
              href="/visions"
              className="inline-block px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(244,201,93,0.12)', border: '1px solid rgba(244,201,93,0.2)', color: '#f4c95d' }}
            >
              Create a Vision Ritual
            </Link>
          </div>

          {visionFeed.error && (
            <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              {visionFeed.error}
            </div>
          )}

          {visionFeed.loading && (
            <div className="flex justify-center py-4">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--violet)', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {!visionFeed.loading && visionFeed.visions.length === 0 && !visionFeed.error && (
            <div className="rounded-2xl p-6 text-center text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              No shared visions yet. Publish one from the Vision Ritual lane.
            </div>
          )}

          {visionFeed.visions.map((vision) => (
            <SharedVisionCard
              key={vision.id}
              vision={vision}
              signedIn={signedIn === true}
              onReact={(emoji) => visionFeed.handleReact(vision.id, emoji)}
              onInterpret={(text) => visionFeed.handleInterpret(vision.id, text)}
            />
          ))}
        </div>
      )}

      {/* Zeitgeist Tab */}
      {activeTab === 'zeitgeist' && (
        <ZeitgeistDashboard compact={false} />
      )}
    </div>
  )
}
