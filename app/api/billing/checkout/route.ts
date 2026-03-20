import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/site'
import { getStripeCustomerFromUser, getUserFromRequest, isNonProdEnvironment } from '@/lib/supabaseServer'
import { getOrCreateStripeCustomer } from '@/lib/stripePlan'

export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
  if (!key) {
    return NextResponse.json({ ok: false, error: 'Billing not configured. Set STRIPE_SECRET_KEY in Vercel env vars.' }, { status: 500 })
  }
  if (!priceId) {
    return NextResponse.json({ ok: false, error: 'Billing not configured. Set NEXT_PUBLIC_STRIPE_PRICE_ID in Vercel env vars.' }, { status: 500 })
  }

  try {
    const user = await getUserFromRequest(request)
    if (!user && !isNonProdEnvironment()) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const origin = SITE_URL
    const body = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/account?checkout=cancel`,
    })

    if (user?.id) {
      body.set('client_reference_id', user.id)
      body.set('metadata[user_id]', user.id)
    }

    const existingCustomer = getStripeCustomerFromUser(user)
    if (existingCustomer) {
      body.set('customer', existingCustomer)
    } else if (user?.email && user?.id) {
      const stripeCustomer = await getOrCreateStripeCustomer(user.email as string, user.id, key)
      if (!stripeCustomer.id) throw new Error('Failed to get or create Stripe customer')
      body.set('customer', stripeCustomer.id)
    } else if (user?.email) {
      body.set('customer_email', user.email)
    }

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json({ ok: false, error: 'Stripe checkout failed', details: text }, { status: 500 })
    }
    const json = await resp.json()
    if (json.url) return NextResponse.json({ ok: true, url: json.url })
    return NextResponse.json({ ok: false, error: 'No URL from Stripe' }, { status: 500 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
