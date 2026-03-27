'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'
import { getSupabase } from '@/lib/supabaseClient'
import ZeitgeistDashboard from '@/components/ZeitgeistDashboard'

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

export default function CirclesPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [circles, setCircles] = useState<CircleListItem[]>([])
  const [activeTab, setActiveTab] = useState<'circles' | 'zeitgeist'>('circles')

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
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Dream circles & collective zeitgeist</p>
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

      {/* Zeitgeist Tab */}
      {activeTab === 'zeitgeist' && (
        <ZeitgeistDashboard compact={false} />
      )}
    </div>
  )
}
