'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { accountRedirectUrl } from '@/lib/site'

export default function AuthSheet() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const supabase = getSupabase()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prompted = localStorage.getItem('dreamscape_auth_prompted')
    const guidedSeen = localStorage.getItem('dreamscape_guided_seen')
    if (!prompted && guidedSeen) {
      const t = setTimeout(() => setOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('dreamscape_auth_prompted', '1')
    setOpen(false)
  }

  const signInWithGoogle = async () => {
    if (!supabase) { setStatus('error'); return }
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: accountRedirectUrl() },
    })
    if (error) setStatus('error')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" style={{ background: 'rgba(0,0,0,0.36)' }}>
      <div className="absolute left-0 right-0 bottom-0 rounded-t-2xl p-5 space-y-4 max-w-xl mx-auto"
        style={{ background: 'rgba(10,10,18,0.98)', borderTop: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            Optional: Save your archive with an account
          </div>
          <button onClick={dismiss} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Sign in to sync your dreams across devices and unlock premium features. Your data stays private and portable.
        </p>
        <button
          onClick={signInWithGoogle}
          disabled={status === 'sending'}
          className="w-full px-4 py-3 rounded-lg text-sm font-medium"
          style={{ background: 'var(--violet)', color: '#07070f', opacity: status === 'sending' ? 0.6 : 1 }}
        >
          {status === 'sending' ? 'Signing in…' : 'Sign up with Google'}
        </button>
        <p className="text-[11px] text-center" style={{ color: 'var(--muted)' }}>
          <a href="/account" className="underline hover:opacity-70">Or use email on the account page</a>
        </p>
        {!supabase && (
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            Admin note: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable.
          </p>
        )}
      </div>
    </div>
  )
}
