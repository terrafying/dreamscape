import { createClient, type User } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAuthClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function isNonProdEnvironment(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization')
  if (!authorization) return null
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

export async function getUserFromRequest(request: Request): Promise<User | null> {
  const token = getBearerToken(request)
  if (!token) return null

  const client = getAuthClient()
  if (!client) return null

  const { data, error } = await client.auth.getUser(token)
  if (error) return null
  return data.user ?? null
}

export function getStripeCustomerFromUser(user: User | null): string | null {
  const raw = user?.user_metadata?.stripe_customer_id
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

export async function setStripeCustomerForUser(userId: string, customerId: string): Promise<boolean> {
  const admin = getAdminClient()
  if (!admin) return false

  const existing = await admin.auth.admin.getUserById(userId)
  if (existing.error || !existing.data.user) return false

  const currentMetadata = existing.data.user.user_metadata ?? {}
  const nextMetadata = {
    ...currentMetadata,
    stripe_customer_id: customerId,
  }

  const updated = await admin.auth.admin.updateUserById(userId, {
    user_metadata: nextMetadata,
  })

  return !updated.error
}
