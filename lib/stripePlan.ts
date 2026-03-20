import type { Plan } from '@/lib/entitlements'

const PREMIUM_STATUSES = new Set(['active', 'trialing', 'past_due'])

interface StripeListResponse<T> {
  data?: T[]
}

interface StripeSubscription {
  status?: string
}

interface StripeCustomer {
  metadata?: {
    dreamscape_plan?: string
  }
}

async function stripeJson<T>(url: string, key: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!resp.ok) {
    const details = await resp.text()
    throw new Error(`Stripe request failed (${resp.status}): ${details}`)
  }

  return resp.json() as Promise<T>
}

export function planFromSubscriptionStatus(status?: string | null): Plan {
  if (!status) return 'free'
  return PREMIUM_STATUSES.has(status) ? 'premium' : 'free'
}

export async function getPlanFromSubscriptions(customerId: string, key: string): Promise<Plan> {
  const encodedCustomerId = encodeURIComponent(customerId)
  const json = await stripeJson<StripeListResponse<StripeSubscription>>(
    `https://api.stripe.com/v1/subscriptions?customer=${encodedCustomerId}&status=all&limit=10`,
    key
  )

  const subscriptions = Array.isArray(json.data) ? json.data : []
  const hasPremium = subscriptions.some((subscription) => planFromSubscriptionStatus(subscription.status) === 'premium')
  return hasPremium ? 'premium' : 'free'
}

export async function getPlanFromCustomerMetadata(customerId: string, key: string): Promise<Plan | null> {
  const encodedCustomerId = encodeURIComponent(customerId)
  const customer = await stripeJson<StripeCustomer>(`https://api.stripe.com/v1/customers/${encodedCustomerId}`, key)
  const rawPlan = customer.metadata?.dreamscape_plan
  if (rawPlan === 'premium' || rawPlan === 'free') return rawPlan
  return null
}

export async function setCustomerPlanMetadata(customerId: string, plan: Plan, key: string): Promise<void> {
  const encodedCustomerId = encodeURIComponent(customerId)
  const body = new URLSearchParams({
    'metadata[dreamscape_plan]': plan,
  })

  await stripeJson(`https://api.stripe.com/v1/customers/${encodedCustomerId}`, key, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
}

export async function resolveServerPlan(customerId: string, key: string): Promise<Plan> {
  try {
    const plan = await getPlanFromSubscriptions(customerId, key)
    await setCustomerPlanMetadata(customerId, plan, key)
    return plan
  } catch {
    const metadataPlan = await getPlanFromCustomerMetadata(customerId, key)
    return metadataPlan ?? 'free'
  }
}
