import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
  if (!key || !priceId) {
    return NextResponse.json({
      ok: false,
      error: 'Billing is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PRICE_ID.'
    }, { status: 400 })
  }
  // NOTE: Implement Stripe Checkout creation here.
  // Redirect to a placeholder for now to avoid errors in unconfigured envs.
  return NextResponse.redirect('https://billing.stripe.com/p/login/test_123')
}
