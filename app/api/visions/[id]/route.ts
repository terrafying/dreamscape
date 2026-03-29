import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseServer'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(_request)
  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const { data: vision, error } = await supabase
    .from('shared_visions')
    .select('id, user_id, vision_id, vision_data, title, distilled_intention, symbols, themes, share_handle, board_image_url, created_at')
    .eq('id', params.id)
    .single()

  if (error || !vision) return NextResponse.json({ error: 'Vision not found' }, { status: 404 })

  const [{ data: reactions }, { data: interpretations }] = await Promise.all([
    supabase
      .from('vision_reactions')
      .select('vision_id, emoji, user_id')
      .eq('vision_id', params.id),
    supabase
      .from('vision_interpretations')
      .select('id')
      .eq('vision_id', params.id),
  ])

  const counts: Record<string, number> = {}
  const myReactions: string[] = []
  for (const reaction of (reactions || []) as { emoji: string; user_id: string }[]) {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1
    if (user && reaction.user_id === user.id) myReactions.push(reaction.emoji)
  }

  return NextResponse.json({
    ok: true,
    vision: {
      ...vision,
      reactions: Object.entries(counts).map(([emoji, count]) => ({ emoji, count })),
      interpretation_count: (interpretations || []).length,
      my_reactions: myReactions,
    },
  })
}
