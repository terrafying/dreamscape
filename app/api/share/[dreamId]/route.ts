import { NextResponse } from 'next/server'
import { getUserFromRequest, getBearerToken, getAuthenticatedClient } from '@/lib/supabaseServer'

type ProfileRow = { user_id: string; handle: string }
type SharedDreamRow = { id: string; user_id: string; dream_id: string; dream_data: unknown; symbols: string[]; themes: string[]; emotions: string[]; share_handle: string; created_at: string }

export async function POST(
  request: Request,
  { params }: { params: { dreamId: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to share dreams' }, { status: 401 })
  }

  const token = getBearerToken(request)
  if (!token) return NextResponse.json({ error: 'Auth token missing' }, { status: 401 })

  const supabase = getAuthenticatedClient(token)
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const profileResult = await supabase
    .from('user_profiles')
    .select('handle, sun_sign, moon_sign, rising_sign')
    .eq('user_id', user.id)
    .single() as unknown as { data: ProfileRow | null; error: { message: string } | null }

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ error: profileResult.error?.message ?? 'Set up your profile first' }, { status: 400 })
  }
  const profile = profileResult.data

  const dreamData = await request.json()
  const dream = dreamData.dream

  if (!dream || dream.id !== params.dreamId) {
    return NextResponse.json({ error: 'Invalid dream data' }, { status: 400 })
  }

  const extraction = dream.extraction ?? {}
  const symbols: string[] = (extraction.symbols ?? []).map((s: { name: string }) => s.name.toLowerCase())
  const themes: string[] = (extraction.themes ?? []).map((t: { name: string }) => t.name.toLowerCase())
  const emotions: string[] = (extraction.emotions ?? []).map((e: { name: string }) => e.name.toLowerCase())

  const upsertResult = await supabase
    .from('shared_dreams')
    .upsert({
      user_id: user.id,
      dream_id: dream.id,
      dream_data: dream,
      symbols,
      themes,
      emotions,
      share_handle: profile.handle,
    }, { onConflict: 'user_id,dream_id' })
    .select()
    .single() as unknown as { data: SharedDreamRow | null; error: { message: string } | null }

  if (upsertResult.error) {
    return NextResponse.json({ error: upsertResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sharedDream: upsertResult.data })
}
