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

export function getEntitlements(): Entitlements {
  // Placeholder: read from localStorage; default to free
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
  return getEntitlements().plan === 'premium'
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
