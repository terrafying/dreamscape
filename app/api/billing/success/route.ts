import { NextResponse } from 'next/server'
import { resolveServerPlan } from '@/lib/stripePlan'
import { getUserFromRequest, isNonProdEnvironment, setStripeCustomerForUser } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  const user = await getUserFromRequest(request)
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  if (!key || !sessionId) {
    return NextResponse.json({ ok: false, error: 'Missing STRIPE_SECRET_KEY or session_id' }, { status: 400 })
  }
  const resp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!resp.ok) {
    const text = await resp.text()
    return NextResponse.json({ ok: false, error: 'Stripe error', details: text }, { status: 500 })
  }
  const json = await resp.json()
  const customer = typeof json.customer === 'string' ? json.customer : null
  const sessionUserId = typeof json.client_reference_id === 'string' ? json.client_reference_id : null

  if (user?.id && sessionUserId && user.id !== sessionUserId) {
    return NextResponse.json({ ok: false, error: 'Session does not belong to current user' }, { status: 403 })
  }

  if (!user && !isNonProdEnvironment()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!customer) {
    return NextResponse.json({ ok: true, customer: null, plan: 'free' })
  }

  if (user?.id) {
    await setStripeCustomerForUser(user.id, customer)
  }

  try {
    const plan = await resolveServerPlan(customer, key)
    return NextResponse.json({ ok: true, customer, plan })
  } catch {
    return NextResponse.json({ ok: true, customer, plan: 'free' })
  }
}
