import type { DreamLog } from '@/lib/types'

// Simple local entitlements and metering.
// In production, back this with server-side checks tied to user auth + billing.

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

  const customer = localStorage.getItem('stripe_customer_id')
  if (!customer) return

  void fetch(`/api/billing/status?customer=${encodeURIComponent(customer)}`)
    .then((response) => response.json())
    .then((json) => {
      if (json?.ok && (json.plan === 'free' || json.plan === 'premium')) {
        localStorage.setItem('dreamscape_plan', json.plan)
      }
    })
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
  const localBypass = typeof window !== 'undefined' && localStorage.getItem('dreamscape_premium_bypass') === '1'
  return getEntitlements().plan === 'premium' || localBypass
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
