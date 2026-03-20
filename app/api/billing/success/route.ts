import { NextResponse } from 'next/server'
import { resolveServerPlan } from '@/lib/stripePlan'

export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
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

  if (!customer) {
    return NextResponse.json({ ok: true, customer: null, plan: 'free' })
  }

  try {
    const plan = await resolveServerPlan(customer, key)
    return NextResponse.json({ ok: true, customer, plan })
  } catch {
    return NextResponse.json({ ok: true, customer, plan: 'free' })
  }
}
