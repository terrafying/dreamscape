import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/site'
import { getStripeCustomerFromUser, getUserFromRequest, isNonProdEnvironment } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  const user = await getUserFromRequest(request)
  const { searchParams } = new URL(request.url)
  const fallbackCustomer = searchParams.get('customer')
  const customer = getStripeCustomerFromUser(user) ?? (isNonProdEnvironment() ? fallbackCustomer : null)

  if (!key || !customer) {
    return NextResponse.json({
      ok: false,
      error: 'Missing STRIPE_SECRET_KEY or customer id. Sign in first.'
    }, { status: !user && !isNonProdEnvironment() ? 401 : 400 })
  }

  try {
    const origin = SITE_URL
    const body = new URLSearchParams({
      customer,
      return_url: `${origin}/account`
    })
    const resp = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json({ ok: false, error: 'Stripe error', details: text }, { status: 500 })
    }
    const json = await resp.json()
    if (json.url) return NextResponse.json({ ok: true, url: json.url })
    return NextResponse.json({ ok: false, error: 'No URL from Stripe' }, { status: 500 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
