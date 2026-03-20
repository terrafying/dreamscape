import { NextResponse } from 'next/server'
import { resolveServerPlan } from '@/lib/stripePlan'

export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  const { searchParams } = new URL(request.url)
  const customer = searchParams.get('customer')
  if (!key || !customer) {
    return NextResponse.json({ ok: false, error: 'Missing STRIPE_SECRET_KEY or customer id' }, { status: 400 })
  }

  try {
    const plan = await resolveServerPlan(customer, key)
    return NextResponse.json({ ok: true, customer, plan })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
