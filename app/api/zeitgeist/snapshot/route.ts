import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAuth } from '@/lib/auth'
import {
  analyzeCollectiveSymbols,
  identifyTrendingThemes,
  buildZeitgeistInterpretation,
  type ZeitgeistSnapshot,
} from '@/lib/zeitgeist'

export async function GET(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Get all dreams from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: dreams, error: dreamsError } = await supabase
      .from('dreams')
      .select('extraction')
      .gte('created_at', sevenDaysAgo)
      .not('extraction', 'is', null)

    if (dreamsError) {
      return NextResponse.json({ error: dreamsError.message }, { status: 500 })
    }

    if (!dreams || dreams.length === 0) {
      return NextResponse.json(
        {
          date: new Date().toISOString().split('T')[0],
          topSymbols: [],
          trendingThemes: [],
          astrologicalContext: {
            moonPhase: 'Unknown',
            dominantSign: 'Unknown',
            transitNote: 'Not enough data yet',
          },
          totalDreams: 0,
          uniqueDreamers: 0,
        },
        { status: 200 }
      )
    }

    // Extract all extractions
    const extractions = dreams
      .map((d) => d.extraction)
      .filter((e) => e !== null && e !== undefined)

    // Analyze symbols
    const topSymbols = analyzeCollectiveSymbols(extractions)
    const trendingThemes = identifyTrendingThemes(topSymbols)

    // Get astrological context from most recent dream
    const recentDream = extractions[extractions.length - 1]
    const astroContext = recentDream?.astro_context || {}

    // Count unique dreamers
    const { count: uniqueCount, error: countError } = await supabase
      .from('dreams')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)

    const uniqueDreamerCount = countError ? 0 : (uniqueCount ?? 0)

    const snapshot: ZeitgeistSnapshot = {
      date: new Date().toISOString().split('T')[0],
      topSymbols: topSymbols.slice(0, 10),
      trendingThemes,
      astrologicalContext: {
        moonPhase: astroContext.moon_phase || 'Unknown',
        dominantSign: astroContext.moon_sign || 'Unknown',
        transitNote: astroContext.transit_note || 'Collective dreams are shifting',
      },
      totalDreams: dreams.length,
      uniqueDreamers: uniqueDreamerCount || 0,
    }

    // Store snapshot
    await supabase.from('zeitgeist_snapshots').insert({
      snapshot_date: snapshot.date,
      top_symbols: snapshot.topSymbols,
      trending_themes: snapshot.trendingThemes,
      astrological_context: snapshot.astrologicalContext,
      total_dreams: snapshot.totalDreams,
    })

    return NextResponse.json(snapshot)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
