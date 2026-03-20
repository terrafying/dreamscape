'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabaseClient'

export default function Paywall({
  title,
  message,
  cta,
  onSwitchGroq,
}: {
  title?: string
  message?: string
  cta?: string
  onSwitchGroq?: () => void
}) {
  const supabase = getSupabase()
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const session = await supabase?.auth.getSession()
    const accessToken = session?.data?.session?.access_token
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  }

  const getDevCustomerFallback = (): string => {
    if (process.env.NODE_ENV === 'production') return ''
    const customer = localStorage.getItem('stripe_customer_id')
    if (!customer) return ''
    return `?customer=${encodeURIComponent(customer)}`
  }

  const startCheckout = async () => {
    try {
      setBusy('checkout')
      setNeedsAuth(false)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/billing/checkout', { headers })
      if (response.status === 401) {
        setNeedsAuth(true)
        return
      }
      const json = await response.json()
      if (json?.ok && typeof json.url === 'string') {
        window.location.href = json.url
      }
    } finally {
      setBusy(null)
    }
  }

  const openBillingPortal = async () => {
    try {
      setBusy('portal')
      const headers = await getAuthHeaders()
      const fallback = Object.keys(headers).length === 0 ? getDevCustomerFallback() : ''
      const response = await fetch(`/api/billing/portal${fallback}`, { headers })
      const json = await response.json()
      if (json?.ok && typeof json.url === 'string') {
        window.location.href = json.url
      }
    } finally {
      setBusy(null)
    }
  }

  if (onSwitchGroq) {
    return (
      <div
        className="rounded-2xl p-5 space-y-3 text-center"
        style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid rgba(167,139,250,0.28)' }}
      >
        <div className="text-xs uppercase tracking-widest mx-auto w-fit" style={{ color: 'rgba(167,139,250,0.6)', letterSpacing: '0.18em' }}>
          Premium
        </div>
        <div className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
          {title ?? 'Anthropic & OpenAI require premium'}
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {message ?? 'Switch to Groq for free, fast inference — or upgrade to unlock Claude and GPT models.'}
        </p>
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onSwitchGroq}
            className="w-full px-4 py-2.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-85"
            style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: 'var(--violet)' }}
          >
            {cta ?? 'Switch to Groq (free)'}
          </button>
          {needsAuth ? (
            <Link
              href="/account"
              className="px-4 py-2 rounded-xl text-xs font-medium text-center"
              style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: 'var(--violet)' }}
            >
              Sign in to upgrade →
            </Link>
          ) : (
            <button
              onClick={startCheckout}
              disabled={busy === 'checkout'}
              className="px-4 py-2 rounded-xl text-xs transition-opacity"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)', opacity: busy === 'checkout' ? 0.5 : 1 }}
            >
              Upgrade to premium →
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-3 text-center"
      style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
    >
      <div className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
        {title}
      </div>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {message || 'Longitudinal patterns, biometric correlations, and advanced letters unlock after your first few weeks. Support your practice and keep your inner archive growing.'}
      </p>
      <div className="flex items-center justify-center gap-2 pt-1">
        {needsAuth ? (
          <Link
            href="/account"
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: 'var(--violet)' }}
          >
            Sign in to upgrade →
          </Link>
        ) : (
          <button
            onClick={startCheckout}
            disabled={busy !== null}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: 'var(--violet)', color: '#07070f', opacity: busy ? 0.6 : 1 }}
          >
            {cta}
          </button>
        )}
        <button
          onClick={openBillingPortal}
          disabled={busy !== null}
          className="px-3 py-2 rounded-full text-xs"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)', opacity: busy ? 0.6 : 1 }}
        >
          Manage
        </button>
      </div>
    </div>
  )
}
