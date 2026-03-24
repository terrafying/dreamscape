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

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to view your circles' }, { status: 401 })
  }

  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const membershipsResult = await supabase
    .from('circle_members')
    .select('circle_id, role')
    .eq('user_id', user.id) as unknown as { data: { circle_id: string; role: 'creator' | 'member' }[] | null; error: { message: string } | null }

  if (membershipsResult.error) {
    return NextResponse.json({ error: membershipsResult.error.message }, { status: 500 })
  }

  const memberships = membershipsResult.data ?? []
  const circleIds = memberships.map(m => m.circle_id)
  if (circleIds.length === 0) {
    return NextResponse.json({ ok: true, circles: [] })
  }

  const [circlesResult, memberCountsResult, activityResult] = await Promise.all([
    supabase
      .from('dream_circles')
      .select('id, name, description, created_by, max_members, created_at')
      .in('id', circleIds),
    supabase
      .from('circle_members')
      .select('circle_id')
      .in('circle_id', circleIds),
    supabase
      .from('circle_dreams')
      .select('circle_id, created_at')
      .in('circle_id', circleIds)
      .order('created_at', { ascending: false }),
  ]) as unknown as [
    { data: CircleRow[] | null; error: { message: string } | null },
    { data: { circle_id: string }[] | null; error: { message: string } | null },
    { data: { circle_id: string; created_at: string }[] | null; error: { message: string } | null },
  ]

  if (circlesResult.error) return NextResponse.json({ error: circlesResult.error.message }, { status: 500 })
  if (memberCountsResult.error) return NextResponse.json({ error: memberCountsResult.error.message }, { status: 500 })
  if (activityResult.error) return NextResponse.json({ error: activityResult.error.message }, { status: 500 })

  const roleByCircle = Object.fromEntries(memberships.map(m => [m.circle_id, m.role]))
  const memberCountByCircle: Record<string, number> = {}
  for (const row of memberCountsResult.data ?? []) {
    memberCountByCircle[row.circle_id] = (memberCountByCircle[row.circle_id] ?? 0) + 1
  }

  const lastActivityByCircle: Record<string, string> = {}
  for (const row of activityResult.data ?? []) {
    if (!lastActivityByCircle[row.circle_id]) {
      lastActivityByCircle[row.circle_id] = row.created_at
    }
  }

  const circles = (circlesResult.data ?? [])
    .map(circle => ({
      ...circle,
      my_role: roleByCircle[circle.id] ?? 'member',
      member_count: memberCountByCircle[circle.id] ?? 0,
      last_activity_at: lastActivityByCircle[circle.id] ?? circle.created_at,
    }))
    .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())

  return NextResponse.json({ ok: true, circles })
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to create a circle' }, { status: 401 })
  }

  const { name, description, max_members } = await request.json()
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Circle name must be at least 2 characters' }, { status: 400 })
  }

  const parsedDescription = typeof description === 'string' ? description.trim() : ''
  if (parsedDescription.length > 240) {
    return NextResponse.json({ error: 'Description must be 240 characters or less' }, { status: 400 })
  }

  const parsedMaxMembers = typeof max_members === 'number' && Number.isFinite(max_members)
    ? Math.max(2, Math.min(25, Math.floor(max_members)))
    : 5

  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const createCircleResult = await supabase
    .from('dream_circles')
    .insert({
      name: name.trim(),
      description: parsedDescription,
      created_by: user.id,
      max_members: parsedMaxMembers,
    })
    .select('id, name, description, created_by, max_members, created_at')
    .single() as unknown as { data: CircleRow | null; error: { message: string } | null }

  if (createCircleResult.error || !createCircleResult.data) {
    return NextResponse.json({ error: createCircleResult.error?.message ?? 'Failed to create circle' }, { status: 500 })
  }

  const addCreatorResult = await supabase
    .from('circle_members')
    .insert({ circle_id: createCircleResult.data.id, user_id: user.id, role: 'creator' }) as unknown as { error: { message: string } | null }

  if (addCreatorResult.error) {
    await supabase.from('dream_circles').delete().eq('id', createCircleResult.data.id)
    return NextResponse.json({ error: addCreatorResult.error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    circle: {
      ...createCircleResult.data,
      my_role: 'creator',
      member_count: 1,
      last_activity_at: createCircleResult.data.created_at,
    },
  })
}
