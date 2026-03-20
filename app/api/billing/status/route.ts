import { NextResponse } from 'next/server'
import { resolveServerPlan, findStripeCustomerByEmail } from '@/lib/stripePlan'
import { getStripeCustomerFromUser, getUserFromRequest, isNonProdEnvironment } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  const user = await getUserFromRequest(request)
  const { searchParams } = new URL(request.url)
  const fallbackCustomer = searchParams.get('customer')

  let customer = getStripeCustomerFromUser(user)
  if (!customer && isNonProdEnvironment()) customer = fallbackCustomer
  if (!customer && user?.email && key) {
    const stripeCustomer = await findStripeCustomerByEmail(user.email, key)
    if (stripeCustomer?.id) customer = stripeCustomer.id
  }

  if (!key || !customer) {
    return NextResponse.json(
      { ok: false, error: 'Missing STRIPE_SECRET_KEY or customer id. Sign in first.' },
      { status: !user && !isNonProdEnvironment() ? 401 : 400 }
    )
  }

  try {
    const plan = await resolveServerPlan(customer, key)
    return NextResponse.json({ ok: true, customer, plan })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
