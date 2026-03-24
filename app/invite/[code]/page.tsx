'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'
import { getSupabase } from '@/lib/supabaseClient'

type InvitePreview = {
  code: string
  expires_at: string
  max_uses: number
  use_count: number
  remaining_uses: number
  active: boolean
}

type CirclePreview = {
  id: string
  name: string
  description: string
  member_count: number
  max_members: number
}

export default function InviteRedeemPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const code = (params?.code ?? '').toUpperCase()

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [circle, setCircle] = useState<CirclePreview | null>(null)
  const [invite, setInvite] = useState<InvitePreview | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = getSupabase()
      if (supabase) {
        const [{ data: sessionData }, { data: userData }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ])
        if (sessionData?.session?.user || userData?.user) {
          setSignedIn(true)
        }
      }

      try {
        const res = await fetch(`/api/circles/join?code=${encodeURIComponent(code)}`)
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Invite not found')
          setCircle(null)
          return
        }
        setCircle(json.circle)
        setInvite(json.invite)
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [code])

  const handleJoin = async () => {
    if (!signedIn || joining) return
    setJoining(true)
    setError('')

    try {
      const res = await apiFetch('/api/circles/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Unable to join this circle')
        return
      }
      router.push(`/circles/${json.circleId}`)
    } catch {
      setError('Network error')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-10 pb-6">
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(167,139,250,0.2)' }}>
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Dream Circle Invite
          </p>
          <h1 className="text-2xl mt-1" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            {circle?.name ?? 'Join Circle'}
          </h1>
          {!!circle?.description && (
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{circle.description}</p>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-4">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--violet)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {!loading && circle && invite && (
          <div className="space-y-3">
            <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              <p>{circle.member_count}/{circle.max_members} members</p>
              <p>{invite.remaining_uses} uses left</p>
              <p>expires {new Date(invite.expires_at).toLocaleDateString()}</p>
              <p className="font-mono">code: {invite.code}</p>
            </div>

            {!invite.active && (
              <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                This invite is no longer active.
              </div>
            )}

            {invite.active && signedIn && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--violet)', color: '#07070f', opacity: joining ? 0.7 : 1 }}
              >
                {joining ? 'Joining…' : 'Join this circle'}
              </button>
            )}

            {invite.active && !signedIn && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.22)' }}>
                <p className="text-sm" style={{ color: 'var(--text)' }}>Sign in to join this circle.</p>
                <Link href="/account" className="inline-block px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.35)', color: 'var(--violet)' }}>
                  Sign in first
                </Link>
              </div>
            )}
          </div>
        )}

        {!loading && !circle && (
          <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            Invite not found.
          </div>
        )}

        {error && (
          <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
