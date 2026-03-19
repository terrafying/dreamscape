'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function AccountPage() {
  const supabase = getSupabase()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
  }, [supabase])

  const signOut = async () => {
    await supabase?.auth.signOut()
    setUserEmail(null)
  }

  const signIn = async () => {
    if (!supabase || !email) return
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: (typeof window !== 'undefined' ? window.location.origin : '') + '/account' } })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-4">
      <h1 className="text-2xl" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>Account</h1>
      {userEmail ? (
        <div className="space-y-2">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Signed in as <span style={{ color: 'var(--text)' }}>{userEmail}</span></p>
          <button onClick={signOut} className="px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>Sign out</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Sign in with a magic link to sync your data.</p>
          <div className="flex gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <button onClick={signIn} disabled={!email || status==='sending'} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--violet)', color: '#07070f', opacity: !email || status==='sending' ? 0.6 : 1 }}>{status==='sent' ? 'Sent ✓' : status==='sending' ? 'Sending…' : 'Send Link'}</button>
          </div>
          {!supabase && (
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Admin: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.</p>
          )}
        </div>
      )}
    </div>
  )
}
