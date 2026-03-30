import { NextResponse } from 'next/server'
import { getUserFromRequest, getBearerToken, getAuthenticatedClient } from '@/lib/supabaseServer'
import type { VisionLog } from '@/lib/types'

type ProfileRow = { handle: string }

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Sign in to publish visions' }, { status: 401 })

  const token = getBearerToken(request)
  if (!token) return NextResponse.json({ error: 'Auth token missing' }, { status: 401 })

  const supabase = getAuthenticatedClient(token)
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const { vision } = await request.json() as { vision: VisionLog }
  if (!vision?.id || !vision?.extraction) {
    return NextResponse.json({ error: 'Invalid vision payload' }, { status: 400 })
  }

  const profileResult = await supabase
    .from('user_profiles')
    .select('handle')
    .eq('user_id', user.id)
    .single() as { data: ProfileRow | null; error: { message: string } | null }

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ error: profileResult.error?.message || 'Set up your profile first' }, { status: 400 })
  }

  const extraction = vision.extraction
  const symbols = extraction.symbols.map((item) => item.name.toLowerCase())
  const themes = extraction.themes.map((item) => item.toLowerCase())

  const upsertResult = await supabase
    .from('shared_visions')
    .upsert({
      user_id: user.id,
      vision_id: vision.id,
      vision_data: vision,
      title: extraction.title,
      distilled_intention: extraction.distilled_intention,
      symbols,
      themes,
      share_handle: profileResult.data.handle,
      board_image_url: vision.boardImageUrl || null,
    }, { onConflict: 'user_id,vision_id' })
    .select()
    .single()

  if (upsertResult.error) {
    return NextResponse.json({ error: upsertResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, vision: upsertResult.data })
}
