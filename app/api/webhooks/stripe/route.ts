import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { planFromSubscriptionStatus, resolveServerPlan, setCustomerPlanMetadata } from '@/lib/stripePlan'

type StripeEvent = {
  type?: string
  data?: {
    object?: {
      customer?: string
      status?: string
    }
  }
}

function parseStripeSignatures(header: string): { timestamp: string; signatures: string[] } | null {
  const entries = header.split(',').map((part) => part.trim())
  const timestamp = entries.find((entry) => entry.startsWith('t='))?.slice(2)
  const signatures = entries.filter((entry) => entry.startsWith('v1=')).map((entry) => entry.slice(3))
  if (!timestamp || signatures.length === 0) return null
  return { timestamp, signatures }
}

function isValidStripeSignature(payload: string, header: string, secret: string): boolean {
  const parsed = parseStripeSignatures(header)
  if (!parsed) return false

  const timestampMs = Number(parsed.timestamp) * 1000
  if (!Number.isFinite(timestampMs)) return false
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false

  const expected = createHmac('sha256', secret).update(`${parsed.timestamp}.${payload}`, 'utf8').digest('hex')
  const expectedBuffer = Buffer.from(expected, 'utf8')

  return parsed.signatures.some((signature) => {
    const candidate = Buffer.from(signature, 'utf8')
    if (candidate.length !== expectedBuffer.length) return false
    return timingSafeEqual(candidate, expectedBuffer)
  })
}

function getCustomerId(event: StripeEvent): string | null {
  const customer = event.data?.object?.customer
  return typeof customer === 'string' && customer.length > 0 ? customer : null
}

export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!key || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: 'Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET' },
      { status: 400 }
    )
  }

  const rawBody = await request.text()
  const signatureHeader = request.headers.get('stripe-signature')
  if (!signatureHeader || !isValidStripeSignature(rawBody, signatureHeader, webhookSecret)) {
    return NextResponse.json({ ok: false, error: 'Invalid Stripe signature' }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(rawBody) as StripeEvent
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const customerId = getCustomerId(event)
  if (!customerId) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'No customer id on event' })
  }

  try {
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const plan = planFromSubscriptionStatus(event.data?.object?.status)
      await setCustomerPlanMetadata(customerId, plan, key)
      return NextResponse.json({ ok: true, customer: customerId, plan })
    }

    if (event.type === 'checkout.session.completed') {
      const plan = await resolveServerPlan(customerId, key)
      return NextResponse.json({ ok: true, customer: customerId, plan })
    }

    return NextResponse.json({ ok: true, ignored: true, event: event.type ?? 'unknown' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
