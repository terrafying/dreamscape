import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabaseServer'

export async function GET(
  request: Request,
  { params }: { params: { dreamId: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to find similar dreams' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 20)

  const supabase = (await import('@/lib/supabaseClient')).getSupabase() as any
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const { data: dream } = await supabase
    .from('shared_dreams')
    .select('symbols, themes, emotions')
    .eq('id', params.dreamId)
    .single()

  if (!dream) {
    return NextResponse.json({ error: 'Dream not found' }, { status: 404 })
  }

  const mySymbols = new Set((dream as { symbols: string[] }).symbols.map(s => s.toLowerCase()))
  const myThemes = new Set((dream as { themes: string[] }).themes.map(t => t.toLowerCase()))

  const { data: candidates, error } = await supabase
    .from('shared_dreams')
    .select(`
      id, user_id, dream_id, dream_data, symbols, themes, emotions,
      share_handle, created_at
    `)
    .neq('id', params.dreamId)
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type ScoredDream = {
    id: string; user_id: string; dream_id: string; dream_data: unknown
    symbols: string[]; themes: string[]; emotions: string[]
    share_handle: string; created_at: string; similarity: number
  }
  const scored = (candidates ?? []).map((d: {
    id: string
    user_id: string
    dream_id: string
    dream_data: unknown
    symbols: string[]
    themes: string[]
    emotions: string[]
    share_handle: string
    created_at: string
  }) => {
    let symbolScore = 0
    for (const s of d.symbols) {
      if (mySymbols.has(s.toLowerCase())) symbolScore++
    }
    const symbolNorm = d.symbols.length > 0 ? symbolScore / d.symbols.length : 0

    let themeScore = 0
    for (const t of d.themes) {
      if (myThemes.has(t.toLowerCase())) themeScore++
    }
    const themeNorm = d.themes.length > 0 ? themeScore / d.themes.length : 0

    const total = symbolNorm * 0.6 + themeNorm * 0.4
    return { ...d, similarity: Math.round(total * 100) / 100 }
  })

  scored.sort((a: ScoredDream, b: ScoredDream) => b.similarity - a.similarity)
  const top: ScoredDream[] = scored.slice(0, limit)

  const topIds = top.map(d => d.id)
  const [reactionsRes, interpRes, myReactionsRes] = await Promise.all([
    topIds.length
      ? supabase.from('dream_reactions').select('dream_id, emoji').in('dream_id', topIds)
      : Promise.resolve({ data: [], error: null }),
    topIds.length
      ? supabase.from('dream_interpretations').select('dream_id').in('dream_id', topIds)
      : Promise.resolve({ data: [], error: null }),
    topIds.length && user
      ? supabase.from('dream_reactions').select('dream_id, emoji').in('dream_id', topIds).eq('user_id', user.id)
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

  const withCounts = top.map((d: typeof top[0]) => ({
    ...d,
    reactions: reactionsMap[d.id] ?? [],
    interpretation_count: interpCount[d.id] ?? 0,
    my_reactions: (myReactionsRes?.data ?? [])
      .filter((r: { dream_id: string }) => r.dream_id === d.id)
      .map((r: { emoji: string }) => r.emoji),
  }))

  return NextResponse.json({ ok: true, dreams: withCounts })
}
