'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import SharedDreamCard from '@/components/SharedDreamCard'
import { apiFetch } from '@/lib/apiFetch'
import { getSupabase } from '@/lib/supabaseClient'
import { getDreams } from '@/lib/store'
import type { DreamLog, SharedDreamWithCounts } from '@/lib/types'

type CircleMember = {
  user_id: string
  handle: string
  role: 'creator' | 'member'
}

type CircleDetail = {
  id: string
  name: string
  description: string
  max_members: number
  member_count: number
  members: CircleMember[]
}

type InviteData = {
  code: string
  expires_at: string
  max_uses: number
  use_count: number
  link: string
}

function timeAgo(dateStr: string): string {
  const delta = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(delta / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CircleDetailPage() {
  const params = useParams<{ id: string }>()
  const circleId = params?.id

  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [circle, setCircle] = useState<CircleDetail | null>(null)
  const [dreams, setDreams] = useState<SharedDreamWithCounts[]>([])
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [showSharePicker, setShowSharePicker] = useState(false)
  const [shareOptions, setShareOptions] = useState<DreamLog[]>([])
  const [sharingDreamId, setSharingDreamId] = useState<string | null>(null)

  const ownerHandle = useMemo(() => circle?.members.find(m => m.role === 'creator')?.handle ?? 'dreamer', [circle])

  const load = async (nextPage = 1, append = false) => {
    if (!circleId) return
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')

    try {
      const res = await apiFetch(`/api/circles/${circleId}?page=${nextPage}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load circle')
        if (!append) {
          setCircle(null)
          setDreams([])
        }
        return
      }

      setCircle(json.circle)
      setHasMore(Boolean(json.hasMore))
      setPage(nextPage)
      setDreams((prev) => append ? [...prev, ...(json.dreams ?? [])] : (json.dreams ?? []))
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
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
          await load(1, false)
          return
        }
      }

      setSignedIn(false)
      setLoading(false)
    }

    checkAuth()
  }, [circleId])

  const handleCreateInvite = async () => {
    if (!circleId || creatingInvite) return
    setCreatingInvite(true)
    setError('')
    try {
      const res = await apiFetch(`/api/circles/${circleId}/invite`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to generate invite')
        return
      }
      setInvite(json.invite)
    } catch {
      setError('Network error')
    } finally {
      setCreatingInvite(false)
    }
  }

  const copyInvite = async () => {
    if (!invite) return
    await navigator.clipboard.writeText(`${invite.code} · ${invite.link}`)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 1800)
  }

  const openSharePicker = async () => {
    const localDreams = await getDreams()
    const options = localDreams
      .filter((d) => Boolean(d.extraction))
      .slice(0, 20)
    setShareOptions(options)
    setShowSharePicker(true)
  }

  const shareDream = async (dream: DreamLog) => {
    if (!circleId || sharingDreamId) return
    setSharingDreamId(dream.id)
    setError('')
    try {
      const res = await apiFetch(`/api/circles/${circleId}/share`, {
        method: 'POST',
        body: JSON.stringify({ dream }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to share dream')
        return
      }
      setShowSharePicker(false)
      await load(1, false)
    } catch {
      setError('Network error')
    } finally {
      setSharingDreamId(null)
    }
  }

  if (signedIn === null) return null

  if (!signedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-3">
        <h1 className="text-2xl" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>◇ Circle</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Sign in to view this circle.</p>
        <Link href="/account" className="inline-block px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--violet)', color: '#07070f' }}>
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-4">
      <Link href="/circles" className="inline-flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--muted)' }}>
        ← back to circles
      </Link>

      {error && (
        <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {circle && (
        <>
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <div>
              <h1 className="text-2xl" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{circle.name}</h1>
              {!!circle.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{circle.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
              <span>{circle.member_count}/{circle.max_members} members</span>
              <span>•</span>
              <span>created by @{ownerHandle}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateInvite}
                disabled={creatingInvite}
                className="px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: 'rgba(129,140,248,0.18)', border: '1px solid rgba(129,140,248,0.35)', color: 'var(--indigo)' }}
              >
                {creatingInvite ? 'Creating…' : 'Invite'}
              </button>

              <button
                onClick={openSharePicker}
                className="px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: 'rgba(167,139,250,0.16)', border: '1px solid rgba(167,139,250,0.35)', color: 'var(--violet)' }}
              >
                Share a Dream
              </button>
            </div>

            {invite && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Invite code
                  </span>
                  <button onClick={copyInvite} className="text-xs px-2 py-1 rounded-lg" style={{ border: '1px solid var(--border)', color: copiedInvite ? '#86efac' : 'var(--muted)' }}>
                    {copiedInvite ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-base font-mono" style={{ color: 'var(--text)', letterSpacing: '0.12em' }}>{invite.code}</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {invite.use_count}/{invite.max_uses} uses • expires {new Date(invite.expires_at).toLocaleDateString()}
                </p>
                <p className="text-[11px] break-all" style={{ color: 'var(--indigo)' }}>{invite.link}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(15,15,26,0.55)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Members</h2>
            <div className="space-y-1.5">
              {circle.members.map(member => (
                <div key={member.user_id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text)' }}>@{member.handle}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--violet)' }}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Circle Feed</h2>

            {!loading && dreams.length === 0 && (
              <div className="rounded-xl p-6 text-center text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                No dreams shared yet. Be the first.
              </div>
            )}

            {dreams.map((dream) => (
              <div key={dream.id} className="space-y-1">
                <SharedDreamCard dream={dream} myReactions={dream.my_reactions} />
                <p className="text-[10px] pl-1 font-mono" style={{ color: 'var(--muted)' }}>
                  shared {timeAgo(dream.created_at)}
                </p>
              </div>
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

            {hasMore && !loading && (
              <button
                onClick={() => load(page + 1, true)}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', color: 'var(--muted)', opacity: loadingMore ? 0.7 : 1 }}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        </>
      )}

      {!loading && !circle && !error && (
        <div className="rounded-xl p-5 text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          Circle not found.
        </div>
      )}

      {showSharePicker && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: 'rgba(7,7,15,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setShowSharePicker(false)} />
          <div className="fixed left-0 right-0 bottom-0 z-50 max-w-xl mx-auto rounded-t-2xl p-5 space-y-3" style={{ background: 'rgba(10,10,18,0.98)', borderTop: '1px solid rgba(167,139,250,0.2)', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm" style={{ color: 'var(--text)' }}>Share a Dream</h3>
              <button onClick={() => setShowSharePicker(false)} className="text-xs" style={{ color: 'var(--muted)' }}>Close</button>
            </div>

            {shareOptions.length === 0 ? (
              <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                No analyzed dreams found yet. Log a dream first, then return to share.
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-auto">
                {shareOptions.map((dream) => (
                  <button
                    key={dream.id}
                    onClick={() => shareDream(dream)}
                    disabled={sharingDreamId === dream.id}
                    className="w-full text-left rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', opacity: sharingDreamId === dream.id ? 0.6 : 1 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{dream.date}</span>
                      <span className="text-[10px]" style={{ color: 'var(--violet)' }}>
                        {sharingDreamId === dream.id ? 'Sharing…' : 'Share →'}
                      </span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                      {dream.transcript.slice(0, 120)}{dream.transcript.length > 120 ? '…' : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
