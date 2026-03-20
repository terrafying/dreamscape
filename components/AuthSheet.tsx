'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { accountRedirectUrl } from '@/lib/site'

export default function AuthSheet() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const supabase = getSupabase()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prompted = localStorage.getItem('dreamscape_auth_prompted')
    const guidedSeen = localStorage.getItem('dreamscape_guided_seen')
    // Only prompt after guided sheet has been seen to avoid stacked sheets
    if (!prompted && guidedSeen) {
      const t = setTimeout(() => setOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('dreamscape_auth_prompted', '1')
    setOpen(false)
  }

  const sendMagicLink = async () => {
    if (!supabase) { setStatus('error'); return }
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: accountRedirectUrl() } })
    if (error) setStatus('error')
    else setStatus('sent')
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
      <div className="absolute left-0 right-0 bottom-0 rounded-t-2xl p-5 space-y-3 max-w-xl mx-auto"
        style={{ background: 'rgba(10,10,18,0.98)', borderTop: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            Optional: Save your archive with an account
          </div>
          <button onClick={dismiss} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Magic link sign-in keeps your dreams synced if you switch devices. Your data stays private and portable.
        </p>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <button
            onClick={sendMagicLink}
            disabled={!email || status === 'sending'}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--violet)', color: '#07070f', opacity: !email || status === 'sending' ? 0.6 : 1 }}
          >
            {status === 'sent' ? 'Sent ✓' : status === 'sending' ? 'Sending…' : 'Send Link'}
          </button>
        </div>
        <button
          onClick={signInWithGoogle}
          disabled={status === 'sending'}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ border: '1px solid var(--border)', color: 'var(--text)', opacity: status === 'sending' ? 0.6 : 1 }}
        >
          Continue with Google
        </button>
        {status === 'sent' && (
          <div className="text-[11px] space-y-1" style={{ color: 'var(--muted)' }}>
            <div>We sent a login link to <span style={{ color: 'var(--text)' }}>{email}</span>.</div>
            <div className="flex gap-2">
              <a href="https://mail.google.com/" target="_blank" className="underline">Open Gmail</a>
              <a href="https://www.icloud.com/mail" target="_blank" className="underline">iCloud Mail</a>
              <a href="https://outlook.live.com/mail/0/inbox" target="_blank" className="underline">Outlook</a>
            </div>
          </div>
        )}
        {!supabase && (
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            Admin note: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable.
          </p>
        )}
      </div>
    </div>
  )
}
