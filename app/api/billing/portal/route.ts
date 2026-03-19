import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  const { searchParams } = new URL(request.url)
  const customer = searchParams.get('customer')
  if (!key || !customer) {
    return NextResponse.json({
      ok: false,
      error: 'Missing STRIPE_SECRET_KEY or customer id'
    }, { status: 400 })
  }
  try {
    const origin = new URL(request.url).origin
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
    if (json.url) return NextResponse.redirect(json.url)
    return NextResponse.json({ ok: false, error: 'No URL from Stripe' }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
