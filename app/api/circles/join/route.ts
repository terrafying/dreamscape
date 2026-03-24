import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabaseServer'

function normalizeInviteCode(input: unknown): string {
  return typeof input === 'string' ? input.trim().toUpperCase() : ''
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET(request: Request) {
  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const code = normalizeInviteCode(searchParams.get('code'))
  if (!code || !/^[A-Z0-9]{8}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
  }

  const inviteResult = await supabase
    .from('circle_invites')
    .select('id, circle_id, expires_at, max_uses, use_count')
    .eq('code', code)
    .single() as unknown as {
    data: { id: string; circle_id: string; expires_at: string; max_uses: number; use_count: number } | null
    error: { message: string } | null
  }

  if (inviteResult.error || !inviteResult.data) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  const [circleResult, membersResult] = await Promise.all([
    supabase
      .from('dream_circles')
      .select('id, name, description, max_members, created_at')
      .eq('id', inviteResult.data.circle_id)
      .single(),
    supabase
      .from('circle_members')
      .select('circle_id')
      .eq('circle_id', inviteResult.data.circle_id),
  ]) as unknown as [
    { data: { id: string; name: string; description: string; max_members: number; created_at: string } | null; error: { message: string } | null },
    { data: { circle_id: string }[] | null; error: { message: string } | null },
  ]

  if (circleResult.error || !circleResult.data) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
  }
  if (membersResult.error) {
    return NextResponse.json({ error: membersResult.error.message }, { status: 500 })
  }

  const now = Date.now()
  const expiresAtMs = new Date(inviteResult.data.expires_at).getTime()
  const active = expiresAtMs > now && inviteResult.data.use_count < inviteResult.data.max_uses

  return NextResponse.json({
    ok: true,
    invite: {
      id: inviteResult.data.id,
      code,
      expires_at: inviteResult.data.expires_at,
      max_uses: inviteResult.data.max_uses,
      use_count: inviteResult.data.use_count,
      remaining_uses: Math.max(0, inviteResult.data.max_uses - inviteResult.data.use_count),
      active,
    },
    circle: {
      ...circleResult.data,
      member_count: (membersResult.data ?? []).length,
    },
  })
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to join a circle' }, { status: 401 })
  }

  const { code: rawCode } = await request.json().catch(() => ({}))
  const code = normalizeInviteCode(rawCode)
  if (!code || !/^[A-Z0-9]{8}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const inviteResult = await supabase
    .from('circle_invites')
    .select('id, circle_id, max_uses, use_count, expires_at')
    .eq('code', code)
    .single() as unknown as {
    data: { id: string; circle_id: string; max_uses: number; use_count: number; expires_at: string } | null
    error: { message: string } | null
  }

  if (inviteResult.error || !inviteResult.data) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  const invite = inviteResult.data
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
  }
  if (invite.use_count >= invite.max_uses) {
    return NextResponse.json({ error: 'Invite has reached max uses' }, { status: 400 })
  }

  const [existingMembershipResult, circleResult, membersResult] = await Promise.all([
    supabase
      .from('circle_members')
      .select('circle_id')
      .eq('circle_id', invite.circle_id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('dream_circles')
      .select('id, name, max_members')
      .eq('id', invite.circle_id)
      .single(),
    supabase
      .from('circle_members')
      .select('circle_id')
      .eq('circle_id', invite.circle_id),
  ]) as unknown as [
    { data: { circle_id: string } | null },
    { data: { id: string; name: string; max_members: number } | null; error: { message: string } | null },
    { data: { circle_id: string }[] | null; error: { message: string } | null },
  ]

  if (existingMembershipResult.data) {
    return NextResponse.json({ ok: true, circleId: invite.circle_id, alreadyJoined: true })
  }

  if (circleResult.error || !circleResult.data) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
  }
  if (membersResult.error) {
    return NextResponse.json({ error: membersResult.error.message }, { status: 500 })
  }

  const memberCount = (membersResult.data ?? []).length
  if (memberCount >= circleResult.data.max_members) {
    return NextResponse.json({ error: 'This circle is full' }, { status: 400 })
  }

  const addMemberResult = await supabase
    .from('circle_members')
    .insert({
      circle_id: invite.circle_id,
      user_id: user.id,
      role: 'member',
    }) as unknown as { error: { message: string } | null }

  if (addMemberResult.error) {
    return NextResponse.json({ error: addMemberResult.error.message }, { status: 500 })
  }

  const updateInviteResult = await supabase
    .from('circle_invites')
    .update({ use_count: invite.use_count + 1, redeemed_by: user.id })
    .eq('id', invite.id)
    .eq('use_count', invite.use_count) as unknown as { error: { message: string } | null }

  if (updateInviteResult.error) {
    return NextResponse.json({ error: updateInviteResult.error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    circleId: invite.circle_id,
    circleName: circleResult.data.name,
  })
}
