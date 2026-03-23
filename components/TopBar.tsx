'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function TopBar() {
  const pathname = usePathname()
  const [signedIn, setSignedIn] = useState(false)
  const isAccountPage = pathname === '/account'

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session?.user))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end px-4 h-12"
      style={{
        background: 'rgba(7, 7, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <Link
        href="/account"
        className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 hover:scale-105"
        style={{
          background: isAccountPage
            ? 'rgba(167,139,250,0.15)'
            : signedIn
            ? 'rgba(255,255,255,0.06)'
            : 'transparent',
          border: isAccountPage
            ? '1px solid rgba(167,139,250,0.3)'
            : signedIn
            ? '1px solid var(--border)'
            : '1px solid transparent',
          color: isAccountPage ? 'var(--violet)' : signedIn ? 'var(--text)' : 'var(--muted)',
        }}
        aria-label="Account"
      >
        {signedIn ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="5.5" r="2.5" />
            <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="5.5" r="2.5" />
            <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
          </svg>
        )}
      </Link>
    </header>
  )
}
