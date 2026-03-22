import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseServer'

export async function GET(
  _request: Request,
  { params }: { params: { handle: string } }
) {
  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, user_id, handle, avatar_seed, sun_sign, moon_sign, rising_sign, created_at')
    .eq('handle', params.handle)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Dreamer not found' }, { status: 404 })
  }

  const [followersRes, followingRes, dreamsRes] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profile.user_id),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profile.user_id),
    supabase.from('shared_dreams').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
  ])

  return NextResponse.json({
    ok: true,
    profile: {
      ...profile,
      follower_count: followersRes.count ?? 0,
      following_count: followingRes.count ?? 0,
      shared_dream_count: dreamsRes.count ?? 0,
    },
  })
}
