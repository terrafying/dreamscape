import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseServer'

type ProfileRow = { user_id: string; handle: string }

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to share a dream' }, { status: 401 })
  }

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

  const body = await request.json().catch(() => ({}))
  const dream = body?.dream
  if (!dream || typeof dream !== 'object' || typeof dream.id !== 'string') {
    return NextResponse.json({ error: 'Invalid dream data' }, { status: 400 })
  }

  const symbols: string[] = ((dream?.extraction?.symbols ?? []) as { name: string }[])
    .map((s) => (typeof s?.name === 'string' ? s.name.toLowerCase() : ''))
    .filter(Boolean)

  const [profileResult, circleResult, memberResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('user_id, handle')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('dream_circles')
      .select('id, name')
      .eq('id', params.id)
      .single(),
    supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', params.id),
  ]) as unknown as [
    { data: ProfileRow | null; error: { message: string } | null },
    { data: { id: string; name: string } | null; error: { message: string } | null },
    { data: { user_id: string }[] | null; error: { message: string } | null },
  ]

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ error: profileResult.error?.message ?? 'Set up your profile first' }, { status: 400 })
  }
  if (circleResult.error || !circleResult.data) {
    return NextResponse.json({ error: circleResult.error?.message ?? 'Circle not found' }, { status: 404 })
  }
  if (memberResult.error) {
    return NextResponse.json({ error: memberResult.error.message }, { status: 500 })
  }

  const insertResult = await supabase
    .from('circle_dreams')
    .insert({
      circle_id: params.id,
      user_id: user.id,
      dream_data: dream,
      symbols,
    })
    .select('id, circle_id, user_id, dream_data, symbols, created_at')
    .single() as unknown as {
    data: { id: string; circle_id: string; user_id: string; dream_data: unknown; symbols: string[]; created_at: string } | null
    error: { message: string } | null
  }

  if (insertResult.error || !insertResult.data) {
    return NextResponse.json({ error: insertResult.error?.message ?? 'Failed to share dream' }, { status: 500 })
  }

  const recipientIds = (memberResult.data ?? [])
    .map((m) => m.user_id)
    .filter((userId) => userId !== user.id)

  if (recipientIds.length > 0) {
    const notifications = recipientIds.map((recipientId) => ({
      user_id: recipientId,
      type: 'circle_dream',
      title: 'New circle dream',
      body: `@${profileResult.data?.handle ?? 'dreamer'} shared a dream in ${circleResult.data?.name ?? 'your circle'}`,
      metadata: {
        circle_id: params.id,
        circle_dream_id: insertResult.data?.id,
        from_user_id: user.id,
      },
    }))

    await supabase.from('notifications').insert(notifications)
  }

  return NextResponse.json({
    ok: true,
    circleDream: {
      ...insertResult.data,
      share_handle: profileResult.data.handle,
      reactions: [],
      interpretation_count: 0,
      my_reactions: [],
    },
  })
}
