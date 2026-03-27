import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Get all matches for today
    const { data: matches, error: matchError } = await supabase
      .from('dream_matches')
      .select('*')
      .eq('match_date', today)
      .order('dreamer_count', { ascending: false })

    if (matchError) throw matchError

    if (!matches || matches.length === 0) {
      return NextResponse.json({ matches: [], count: 0 })
    }

    // Get dreamer profiles for each match
    const enrichedMatches = []

    for (const match of matches) {
      const { data: dreamers, error: dreamerError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, handle')
        .in('id', match.dreamer_ids)

      if (dreamerError) {
        console.error('Error fetching dreamers:', dreamerError)
        continue
      }

      enrichedMatches.push({
        ...match,
        dreamers: (dreamers || []).map((d: any) => ({
          id: d.id,
          name: d.full_name || 'Anonymous',
          avatar_url: d.avatar_url,
          handle: d.handle,
        })),
      })
    }

    return NextResponse.json({
      matches: enrichedMatches,
      count: enrichedMatches.length,
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
