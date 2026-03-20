'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function Paywall({ title = 'Go deeper with Dreamscape Premium', message, cta = 'Unlock Premium' }: { title?: string; message?: string; cta?: string }) {
  const supabase = getSupabase()
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null)

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const session = await supabase?.auth.getSession()
    const accessToken = session?.data.session?.access_token
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
      const headers = await getAuthHeaders()
      const response = await fetch('/api/billing/checkout', { headers })
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
        <button
          onClick={startCheckout}
          disabled={busy !== null}
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'var(--violet)', color: '#07070f', opacity: busy ? 0.6 : 1 }}
        >
          {cta}
        </button>
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
