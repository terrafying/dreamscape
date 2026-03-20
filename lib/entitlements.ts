import type { LLMProvider } from '@/lib/llm'
import type { DreamLog } from '@/lib/types'
import { getSupabase } from '@/lib/supabaseClient'

export type Plan = 'free' | 'premium'

export interface Entitlements {
  plan: Plan
  freeLimits: {
    maxDreams: number
    maxWeeks: number
    advancedFeatures: string[]
  }
}

let isPlanRefreshStarted = false

function startPlanRefresh(): void {
  if (isPlanRefreshStarted || typeof window === 'undefined') return
  isPlanRefreshStarted = true

  void (async () => {
    const supabase = getSupabase()
    const session = await supabase?.auth.getSession()
    const accessToken = session?.data.session?.access_token
    const customer = localStorage.getItem('stripe_customer_id')

    const isProd = process.env.NODE_ENV === 'production'
    if (!accessToken && !customer && isProd) return

    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    const fallback = !accessToken && !isProd && customer
      ? `?customer=${encodeURIComponent(customer)}`
      : ''

    const response = await fetch(`/api/billing/status${fallback}`, { headers })
    const json = await response.json()

    if (json?.ok && (json.plan === 'free' || json.plan === 'premium')) {
      localStorage.setItem('dreamscape_plan', json.plan)
    }
  })()
    .catch(() => {
      isPlanRefreshStarted = false
    })
}

export function getEntitlements(): Entitlements {
  startPlanRefresh()
  const plan = (typeof window !== 'undefined' && localStorage.getItem('dreamscape_plan')) as Plan | null
  return {
    plan: plan || 'free',
    freeLimits: {
      maxDreams: 5,
      maxWeeks: 3,
      advancedFeatures: [
        'longitudinal-patterns',
        'dream-letters+',
        'biometric-correlations',
        'natal-integration',
      ],
    },
  }
}

export function isPremium(): boolean {
  if (process.env.NEXT_PUBLIC_PREMIUM_BYPASS === '1') return true
  const plan = getEntitlements().plan
  return plan === 'premium'
}

export function requiresPremium(provider: LLMProvider): boolean {
  return provider === 'anthropic' || provider === 'openai'
}

export function isPaywallEnforced(dreams: DreamLog[]): boolean {
  return !isPremium() && isOverFreeLimits(dreams)
}

export function weeksOfHistory(dreams: DreamLog[]): number {
  if (!dreams.length) return 0
  const dates = dreams.map((d) => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime())
  const first = dates[0].getTime()
  const last = dates[dates.length - 1].getTime()
  return Math.max(1, Math.ceil((last - first) / (7 * 86400000)))
}

export function isOverFreeLimits(dreams: DreamLog[]): boolean {
  const { freeLimits } = getEntitlements()
  const overDreams = dreams.length > freeLimits.maxDreams
  const overWeeks = weeksOfHistory(dreams) > freeLimits.maxWeeks
  return overDreams || overWeeks
}
