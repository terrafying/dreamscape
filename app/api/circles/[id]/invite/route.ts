import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseServer'

function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to invite members' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const maxUsesRaw = body?.max_uses
  const maxUses = typeof maxUsesRaw === 'number' && Number.isFinite(maxUsesRaw)
    ? Math.max(1, Math.min(50, Math.floor(maxUsesRaw)))
    : 5

  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const membershipResult = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('circle_id', params.id)
    .eq('user_id', user.id)
    .single() as unknown as { data: { circle_id: string } | null }

  if (!membershipResult.data) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  let createdInvite: { id: string; code: string; expires_at: string; max_uses: number; use_count: number } | null = null

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode()
    const insertResult = await supabase
      .from('circle_invites')
      .insert({
        circle_id: params.id,
        code,
        created_by: user.id,
        max_uses: maxUses,
        expires_at: expiresAt,
      })
      .select('id, code, expires_at, max_uses, use_count')
      .single() as unknown as {
      data: { id: string; code: string; expires_at: string; max_uses: number; use_count: number } | null
      error: { message: string } | null
    }

    if (!insertResult.error && insertResult.data) {
      createdInvite = insertResult.data
      break
    }

    if (!insertResult.error?.message?.toLowerCase().includes('duplicate')) {
      return NextResponse.json({ error: insertResult.error?.message ?? 'Failed to create invite' }, { status: 500 })
    }
  }

  if (!createdInvite) {
    return NextResponse.json({ error: 'Failed to generate unique invite code' }, { status: 500 })
  }

  const origin = new URL(request.url).origin
  return NextResponse.json({
    ok: true,
    invite: {
      ...createdInvite,
      link: `${origin}/invite/${createdInvite.code}`,
    },
  })
}
