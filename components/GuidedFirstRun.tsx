'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabaseClient'
import { accountRedirectUrl } from '@/lib/site'
import { seedDemoDreams } from '@/lib/store'

const APP_VERSION = '0.1.1'
const SEEN_KEY = `dreamscape_guided_v${APP_VERSION}`

export default function GuidedFirstRun() {
  const [show, setShow] = useState(false)
  const supabase = getSupabase()

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Only show if this version hasn't been seen before
    if (!localStorage.getItem(SEEN_KEY)) setShow(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1')
    setShow(false)
  }

  const loadDemo = async () => {
    await seedDemoDreams()
    dismiss()
  }

  const signInWithGoogle = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: accountRedirectUrl() },
    })
    if (error) console.error('sign in failed', error)
  }

  if (!show) return null

   return (
     <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" style={{ background: 'rgba(0,0,0,0.36)' }}>
       <div className="absolute left-0 right-0 rounded-t-2xl p-5 space-y-3 max-w-xl mx-auto"
         style={{ background: 'rgba(10,10,18,0.98)', borderTop: '1px solid var(--border)', bottom: '80px' }}>
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            Welcome to Dreamscape
          </div>
          <button onClick={dismiss} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Start with a gentle ritual: Dusk (evening) and Dawn (morning). Load a short demo so your charts light up immediately.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={loadDemo} className="rounded-xl px-3 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>◈</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Load demo dreams + biometrics</div>
          </button>
          <Link href="/journal" onClick={dismiss} className="rounded-xl px-3 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>☾</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Begin Dusk entry</div>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/log" onClick={dismiss} className="rounded-xl px-3 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>☀</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Record Dawn log</div>
          </Link>
          <Link href="/strata" onClick={dismiss} className="rounded-xl px-3 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>◎</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>See insights</div>
          </Link>
        </div>

        {/* Auth prompt integrated into the welcome sheet — no second popup */}
        {supabase && (
          <div className="pt-1 border-t border-white/5">
            <button
              onClick={signInWithGoogle}
              className="w-full rounded-xl px-3 py-2.5 text-xs font-medium text-left"
              style={{ background: 'rgba(167,139,250,0.14)', border: '1px solid rgba(167,139,250,0.25)', color: 'var(--violet)' }}
            >
              Sign in with Google to sync across devices
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
