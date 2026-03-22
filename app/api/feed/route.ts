import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to browse shared dreams' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = 10
  const offset = (page - 1) * limit
  const mySymbols = (searchParams.get('mySymbols') ?? '').split(',').filter(Boolean)

  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  let query = supabase
    .from('shared_dreams')
    .select(`
      id, user_id, dream_id, dream_data, symbols, themes, emotions,
      share_handle, created_at
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: dreams, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const dreamIds = (dreams ?? []).map((d: { id: string }) => d.id)

  const [reactionsRes, interpRes] = await Promise.all([
    dreamIds.length
      ? supabase
          .from('dream_reactions')
          .select('dream_id, emoji')
          .in('dream_id', dreamIds)
      : Promise.resolve({ data: [], error: null }),
    dreamIds.length
      ? supabase
          .from('dream_interpretations')
          .select('dream_id')
          .in('dream_id', dreamIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const reactionsMap: Record<string, { emoji: string; count: number }[]> = {}
  for (const r of (reactionsRes?.data ?? []) as { dream_id: string; emoji: string }[]) {
    if (!reactionsMap[r.dream_id]) reactionsMap[r.dream_id] = []
    const existing = reactionsMap[r.dream_id].find(e => e.emoji === r.emoji)
    if (existing) existing.count++
    else reactionsMap[r.dream_id].push({ emoji: r.emoji, count: 1 })
  }

  const interpCount: Record<string, number> = {}
  for (const i of (interpRes?.data ?? []) as { dream_id: string }[]) {
    interpCount[i.dream_id] = (interpCount[i.dream_id] ?? 0) + 1
  }

  const withCounts = (dreams ?? []).map((d: {
    id: string
    user_id: string
    dream_id: string
    dream_data: unknown
    symbols: string[]
    themes: string[]
    emotions: string[]
    share_handle: string
    created_at: string
  }) => ({
    id: d.id,
    user_id: d.user_id,
    dream_id: d.dream_id,
    dream_data: d.dream_data,
    symbols: d.symbols,
    themes: d.themes,
    emotions: d.emotions,
    share_handle: d.share_handle,
    created_at: d.created_at,
    reactions: reactionsMap[d.id] ?? [],
    interpretation_count: interpCount[d.id] ?? 0,
  }))

  return NextResponse.json({
    ok: true,
    dreams: withCounts,
    page,
    hasMore: (dreams ?? []).length === limit,
  })
}
