import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
  if (!key || !priceId) {
    return NextResponse.json({
      ok: false,
      error: 'Billing is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PRICE_ID.'
    }, { status: 400 })
  }

  try {
    const origin = new URL(request.url).origin
    const body = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/account?checkout=cancel`,
    })
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
      return NextResponse.json({ ok: false, error: 'Stripe error', details: text }, { status: 500 })
    }
    const json = await resp.json()
    if (json.url) return NextResponse.redirect(json.url)
    return NextResponse.json({ ok: false, error: 'No URL from Stripe' }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
