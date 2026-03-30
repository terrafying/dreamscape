import { NextResponse } from 'next/server'
import { getUserFromRequest, getBearerToken, getAuthenticatedClient } from '@/lib/supabaseServer'

type ReactionRow = { id: string }

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to react' }, { status: 401 })
  }

  const { emoji } = await request.json()
  const valid = ['💭', '🔮', '💜']
  if (!valid.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
  }

  const token = getBearerToken(request)
  if (!token) return NextResponse.json({ error: 'Auth token missing' }, { status: 401 })

  const supabase = getAuthenticatedClient(token)
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const existingResult = await supabase
    .from('dream_reactions')
    .select('id')
    .eq('dream_id', params.id)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single() as unknown as { data: ReactionRow | null }

  if (existingResult.data) {
    await supabase.from('dream_reactions').delete().eq('id', existingResult.data.id)
    return NextResponse.json({ ok: true, reacted: false })
  } else {
    await supabase.from('dream_reactions').insert({
      dream_id: params.id,
      user_id: user.id,
      emoji,
    })
    return NextResponse.json({ ok: true, reacted: true })
  }
}
