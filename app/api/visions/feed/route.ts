import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Sign in to browse shared visions' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = 10
  const offset = (page - 1) * limit

  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const { data: visions, error } = await supabase
    .from('shared_visions')
    .select('id, user_id, vision_id, vision_data, title, distilled_intention, symbols, themes, share_handle, board_image_url, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const visionIds = (visions || []).map((vision: { id: string }) => vision.id)
  const [reactionsRes, interpretationsRes, myReactionsRes] = await Promise.all([
    visionIds.length > 0
      ? supabase.from('vision_reactions').select('vision_id, emoji').in('vision_id', visionIds)
      : Promise.resolve({ data: [], error: null }),
    visionIds.length > 0
      ? supabase.from('vision_interpretations').select('id, vision_id, handle, text, created_at').in('vision_id', visionIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    visionIds.length > 0
      ? supabase.from('vision_reactions').select('vision_id, emoji').in('vision_id', visionIds).eq('user_id', user.id)
      : Promise.resolve({ data: [], error: null }),
  ])

  const reactionsMap: Record<string, { emoji: string; count: number }[]> = {}
  for (const reaction of (reactionsRes.data || []) as { vision_id: string; emoji: string }[]) {
    if (!reactionsMap[reaction.vision_id]) reactionsMap[reaction.vision_id] = []
    const existing = reactionsMap[reaction.vision_id].find((item) => item.emoji === reaction.emoji)
    if (existing) existing.count++
    else reactionsMap[reaction.vision_id].push({ emoji: reaction.emoji, count: 1 })
  }

  const interpretationCountMap: Record<string, number> = {}
  const previewInterpretationsMap: Record<string, { id: string; vision_id: string; handle: string; text: string; created_at: string }[]> = {}
  for (const interpretation of (interpretationsRes.data || []) as { id: string; vision_id: string; handle: string; text: string; created_at: string }[]) {
    interpretationCountMap[interpretation.vision_id] = (interpretationCountMap[interpretation.vision_id] || 0) + 1
    if (!previewInterpretationsMap[interpretation.vision_id]) previewInterpretationsMap[interpretation.vision_id] = []
    if (previewInterpretationsMap[interpretation.vision_id].length < 2) {
      previewInterpretationsMap[interpretation.vision_id].push(interpretation)
    }
  }

  const enriched = (visions || []).map((vision: {
    id: string
    user_id: string
    vision_id: string
    vision_data: unknown
    title: string
    distilled_intention: string
    symbols: string[]
    themes: string[]
    share_handle: string
    board_image_url?: string
    created_at: string
  }) => ({
    ...vision,
    reactions: reactionsMap[vision.id] || [],
    interpretation_count: interpretationCountMap[vision.id] || 0,
    preview_interpretations: previewInterpretationsMap[vision.id] || [],
    my_reactions: (myReactionsRes.data || [])
      .filter((reaction: { vision_id: string }) => reaction.vision_id === vision.id)
      .map((reaction: { emoji: string }) => reaction.emoji),
  }))

  return NextResponse.json({ ok: true, visions: enriched, page, hasMore: (visions || []).length === limit })
}
