import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseServer'

type FollowRow = { follower_id: string; following_id: string }

export async function POST(
  _request: Request,
  { params }: { params: { handle: string } }
) {
  const user = await getUserFromRequest(_request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to follow' }, { status: 401 })
  }

  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const targetResult = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('handle', params.handle)
    .single() as unknown as { data: { user_id: string } | null }

  if (!targetResult.data || targetResult.data.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot follow this user' }, { status: 400 })
  }
  const targetUserId = targetResult.data.user_id

  const existingResult = await supabase
    .from('follows')
    .select('follower_id, following_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single() as unknown as { data: FollowRow | null }

  if (existingResult.data) {
    await supabase.from('follows').delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
    return NextResponse.json({ ok: true, following: false })
  } else {
    await supabase.from('follows').insert({
      follower_id: user.id,
      following_id: targetUserId,
    })
    return NextResponse.json({ ok: true, following: true })
  }
}
