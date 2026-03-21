'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { syncDreams } from '@/lib/cloudSync'
import ApiKeysPanel from '@/components/ApiKeysPanel'
import ModelDefaultsPanel from '@/components/ModelDefaultsPanel'
import BirthDataEditor from '@/components/BirthDataEditor'
import { accountRedirectUrl } from '@/lib/site'

export default function AccountPage() {
  const supabase = getSupabase()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isPremiumPlan, setIsPremiumPlan] = useState(false)
  const [billingBusy, setBillingBusy] = useState<'checkout' | 'portal' | null>(null)

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabase?.auth.getSession() ?? {}
    return data?.session?.access_token ?? null
  }

  const refreshUserMetadata = async (): Promise<void> => {
    if (!supabase) return
    const { data } = await supabase.auth.getUser()
    const stripeId = data?.user?.user_metadata?.stripe_customer_id as string | undefined
    if (stripeId) localStorage.setItem('stripe_customer_id', stripeId)
  }

  const getDevCustomerFallback = (): string => {
    if (process.env.NODE_ENV === 'production') return ''
    const customer = localStorage.getItem('stripe_customer_id')
    if (!customer) return ''
    return `?customer=${encodeURIComponent(customer)}`
  }

  const refreshPlanFromServer = async () => {
    await refreshUserMetadata()
    const accessToken = await getAccessToken()
    const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    const fallback = Object.keys(headers).length === 0 ? getDevCustomerFallback() : ''
    const response = await fetch(`/api/billing/status${fallback}`, { headers })
    const json = await response.json()
    if (json?.ok && (json.plan === 'premium' || json.plan === 'free')) {
      localStorage.setItem('dreamscape_plan', json.plan)
      setIsPremiumPlan(json.plan === 'premium')
    } else if (!response.ok) {
      localStorage.setItem('dreamscape_plan', 'free')
      setIsPremiumPlan(false)
    }
  }

  const startCheckout = async () => {
    try {
      setBillingBusy('checkout')
      await refreshUserMetadata()
      const accessToken = await getAccessToken()
      const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      const response = await fetch('/api/billing/checkout', { headers })
      const json = await response.json()
      if (json?.ok && typeof json.url === 'string') {
        window.location.href = json.url
      }
    } finally {
      setBillingBusy(null)
    }
  }

  const openBillingPortal = async () => {
    try {
      setBillingBusy('portal')
      await refreshUserMetadata()
      const accessToken = await getAccessToken()
      const authHeaders: Record<string, string> = {}
      if (accessToken) authHeaders.Authorization = `Bearer ${accessToken}`
      const fallback = Object.keys(authHeaders).length === 0 ? getDevCustomerFallback() : ''
      const response = await fetch(`/api/billing/portal${fallback}`, { headers: authHeaders })
      const json = await response.json()
      if (json?.ok && typeof json.url === 'string') {
        window.location.href = json.url
      }
    } finally {
      setBillingBusy(null)
    }
  }

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data }) => {
      setUserEmail(data.user?.email ?? null)
      if (data.user) {
        try { await syncDreams(data.user.id) } catch {}
      }
    })
  }, [supabase])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const cachedPlan = localStorage.getItem('dreamscape_plan')
    if (cachedPlan === 'premium' || cachedPlan === 'free') {
      setIsPremiumPlan(cachedPlan === 'premium')
    }

    const customer = localStorage.getItem('stripe_customer_id')
    if (!supabase && !customer) return

    void refreshPlanFromServer().catch(() => {})
  }, [])

  const signOut = async () => {
    await supabase?.auth.signOut()
    setUserEmail(null)
  }

  const signIn = async () => {
    if (!supabase || !email) return
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: accountRedirectUrl() } })
    setStatus(error ? 'error' : 'sent')
  }

  const signInWithGoogle = async () => {
    if (!supabase) return
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: accountRedirectUrl() },
    })
    if (error) setStatus('error')
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (url.searchParams.get('checkout') === 'success') {
      localStorage.setItem('dreamscape_sync_enabled', '1')
      const sessionId = url.searchParams.get('session_id')
      if (sessionId) {
        refreshUserMetadata().then(async () => {
          const accessToken = await getAccessToken()
          const headers: Record<string, string> = {}
          if (accessToken) headers.Authorization = `Bearer ${accessToken}`
          const response = await fetch(`/api/billing/success?session_id=${encodeURIComponent(sessionId)}`, { headers })
          const json = await response.json()
          if (json?.customer) localStorage.setItem('stripe_customer_id', json.customer)
          if (json?.plan === 'premium' || json?.plan === 'free') {
            localStorage.setItem('dreamscape_plan', json.plan)
            setIsPremiumPlan(json.plan === 'premium')
          }
        }).catch(() => {})
      }
    }
  }, [])

  const banner = (typeof window !== 'undefined') && new URLSearchParams(window.location.search).get('checkout') === 'success'

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-6">
      {banner && (
        <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
          Subscription active. Premium unlocked and cloud sync enabled.
        </div>
      )}
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
          <button onClick={signInWithGoogle} disabled={status==='sending'} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text)', opacity: status==='sending' ? 0.6 : 1 }}>Continue with Google</button>
          {!supabase && (
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Admin: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.</p>
          )}
        </div>
      )}

      <div className="space-y-2 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--text)' }}>Billing</p>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: isPremiumPlan ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)', color: isPremiumPlan ? '#86efac' : 'var(--muted)' }}>
            {isPremiumPlan ? 'Premium' : 'Free'}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Premium unlocks Anthropic &amp; OpenAI models, unlimited archive depth, and advanced longitudinal insights.
        </p>
        <div className="flex items-center gap-2">
          {!isPremiumPlan && (
            <button onClick={startCheckout} disabled={billingBusy !== null} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--violet)', color: '#07070f', opacity: billingBusy ? 0.6 : 1 }}>
              Upgrade to Premium
            </button>
          )}
          <button onClick={openBillingPortal} disabled={billingBusy !== null} className="px-3 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--border)', color: 'var(--muted)', opacity: billingBusy ? 0.6 : 1 }}>
            Manage Billing
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.14em' }}>Settings</h2>
        <SyncToggle />
        <ReminderSettings />
      </div>

      {/* Natal Chart */}
      <div className="space-y-3">
        <BirthDataEditor />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.14em' }}>API</h2>
        <ApiKeysPanel />
        <ModelDefaultsPanel />
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
          BYO keys are not paywalled yet (MVP). Later we’ll offer using our managed keys as a Premium feature.
        </p>
      </div>
    </div>
  )
}

function SyncToggle() {
  const [enabled, setEnabled] = useState<boolean>(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    setEnabled(localStorage.getItem('dreamscape_sync_enabled') === '1')
  }, [])
  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    if (typeof window !== 'undefined') localStorage.setItem('dreamscape_sync_enabled', next ? '1' : '0')
  }
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
      <div>
        <div className="text-sm" style={{ color: 'var(--text)' }}>Cloud Sync (optional)</div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>Keep your archive synced across devices (Supabase)</div>
      </div>
      <button onClick={toggle} className="px-3 py-1.5 rounded-full text-xs" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>{enabled ? 'On' : 'Off'}</button>
    </div>
  )
}

function ReminderSettings() {
  const [evening, setEvening] = useState<string>('22:00')
  const [morning, setMorning] = useState<string>('07:30')
  const [enabled, setEnabled] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setEvening(localStorage.getItem('dreamscape_reminder_evening') || '22:00')
    setMorning(localStorage.getItem('dreamscape_reminder_morning') || '07:30')
    setEnabled(localStorage.getItem('dreamscape_reminders') === '1')
  }, [])

  const save = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem('dreamscape_reminder_evening', evening)
    localStorage.setItem('dreamscape_reminder_morning', morning)
    localStorage.setItem('dreamscape_reminders', enabled ? '1' : '0')
    // Ask for notification permission if turning on
    if (enabled && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }

  return (
    <div className="rounded-lg px-3 py-3 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: 'var(--text)' }}>Gentle Reminders</div>
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
          Evening
          <input type="time" value={evening} onChange={(e) => setEvening(e.target.value)} className="ml-auto rounded px-2 py-1 bg-transparent" style={{ border: '1px solid var(--border)', color: 'var(--text)' }} />
        </label>
        <label className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
          Morning
          <input type="time" value={morning} onChange={(e) => setMorning(e.target.value)} className="ml-auto rounded px-2 py-1 bg-transparent" style={{ border: '1px solid var(--border)', color: 'var(--text)' }} />
        </label>
      </div>
      <div className="flex justify-end">
        <button onClick={save} className="px-3 py-1.5 rounded-full text-xs" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>Save</button>
      </div>
      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
        Note: Browser notifications only fire when the app is open. For system-level reminders, we’ll add iOS/Android push later.
      </p>
    </div>
  )
}
