import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseServer'

type CircleRow = {
  id: string
  name: string
  description: string
  created_by: string
  max_members: number
  created_at: string
}

type CircleMemberRow = {
  user_id: string
  role: 'creator' | 'member'
  joined_at: string
}

type CircleDreamRow = {
  id: string
  circle_id: string
  user_id: string
  dream_data: unknown
  symbols: string[]
  created_at: string
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to view this circle' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = 10
  const offset = Math.max(0, (page - 1) * limit)

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

  const [circleResult, membersResult, dreamsResult] = await Promise.all([
    supabase
      .from('dream_circles')
      .select('id, name, description, created_by, max_members, created_at')
      .eq('id', params.id)
      .single(),
    supabase
      .from('circle_members')
      .select('user_id, role, joined_at')
      .eq('circle_id', params.id)
      .order('joined_at', { ascending: true }),
    supabase
      .from('circle_dreams')
      .select('id, circle_id, user_id, dream_data, symbols, created_at')
      .eq('circle_id', params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
  ]) as unknown as [
    { data: CircleRow | null; error: { message: string } | null },
    { data: CircleMemberRow[] | null; error: { message: string } | null },
    { data: CircleDreamRow[] | null; error: { message: string } | null },
  ]

  if (circleResult.error || !circleResult.data) {
    return NextResponse.json({ error: circleResult.error?.message ?? 'Circle not found' }, { status: 404 })
  }
  if (membersResult.error) return NextResponse.json({ error: membersResult.error.message }, { status: 500 })
  if (dreamsResult.error) return NextResponse.json({ error: dreamsResult.error.message }, { status: 500 })

  const members = membersResult.data ?? []
  const memberIds = members.map(m => m.user_id)
  const profilesResult = memberIds.length
    ? await supabase
        .from('user_profiles')
        .select('user_id, handle')
        .in('user_id', memberIds) as unknown as { data: { user_id: string; handle: string }[] | null }
    : { data: [] as { user_id: string; handle: string }[] | null }

  const handleByUserId = Object.fromEntries((profilesResult.data ?? []).map(p => [p.user_id, p.handle]))
  const dreams = (dreamsResult.data ?? []).map(d => {
    const dreamPayload = d.dream_data as { id?: string; extraction?: { themes?: { name: string }[]; emotions?: { name: string }[] } }
    const themeNames = (dreamPayload?.extraction?.themes ?? []).map(t => t.name.toLowerCase())
    const emotionNames = (dreamPayload?.extraction?.emotions ?? []).map(e => e.name.toLowerCase())

    return {
      id: d.id,
      user_id: d.user_id,
      dream_id: dreamPayload?.id ?? d.id,
      dream_data: d.dream_data,
      symbols: d.symbols ?? [],
      themes: themeNames,
      emotions: emotionNames,
      share_handle: handleByUserId[d.user_id] ?? 'dreamer',
      created_at: d.created_at,
      reactions: [],
      interpretation_count: 0,
      my_reactions: [],
    }
  })

  return NextResponse.json({
    ok: true,
    circle: {
      ...circleResult.data,
      member_count: members.length,
      members: members.map(member => ({
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        handle: handleByUserId[member.user_id] ?? 'dreamer',
      })),
    },
    dreams,
    page,
    hasMore: dreams.length === limit,
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to delete circles' }, { status: 401 })
  }

  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const circleResult = await supabase
    .from('dream_circles')
    .select('id, created_by')
    .eq('id', params.id)
    .single() as unknown as { data: { id: string; created_by: string } | null; error: { message: string } | null }

  if (circleResult.error || !circleResult.data) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
  }

  if (circleResult.data.created_by !== user.id) {
    return NextResponse.json({ error: 'Only the creator can delete this circle' }, { status: 403 })
  }

  const deleteResult = await supabase
    .from('dream_circles')
    .delete()
    .eq('id', params.id) as unknown as { error: { message: string } | null }

  if (deleteResult.error) {
    return NextResponse.json({ error: deleteResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
