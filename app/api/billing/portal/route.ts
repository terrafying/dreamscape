import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return NextResponse.json({
      ok: false,
      error: 'Billing is not configured. Set STRIPE_SECRET_KEY.'
    }, { status: 400 })
  }
  // NOTE: Implement Stripe billing portal link creation here.
  return NextResponse.redirect('https://billing.stripe.com/p/login/test_123')
}
