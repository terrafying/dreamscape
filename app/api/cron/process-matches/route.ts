import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Cron job to process dream matches daily
 * Finds all dreams from the past 24 hours and creates matches for symbols
 * that were dreamed by 2+ people
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const targetDate = yesterday.toISOString().split('T')[0]

    // Find all dreams from yesterday
    const { data: dreams, error: dreamsError } = await supabase
      .from('dreams')
      .select('id, user_id, extraction:dream_extractions(symbols)')
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lt('created_at', `${targetDate}T23:59:59Z`)

    if (dreamsError) throw dreamsError

    if (!dreams || dreams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No dreams found for processing',
      })
    }

    // Build symbol -> dreamers map
    const symbolMap: Record<string, Set<string>> = {}

    for (const dream of dreams) {
      const extraction = (dream as any).extraction
      if (!extraction || !extraction.symbols) continue

      for (const symbol of extraction.symbols) {
        const symbolName = symbol.name
        if (!symbolMap[symbolName]) {
          symbolMap[symbolName] = new Set()
        }
        symbolMap[symbolName].add(dream.user_id)
      }
    }

    // Create matches for symbols with 2+ dreamers
    const matches = []
    for (const [symbolName, dreamerIds] of Object.entries(symbolMap)) {
      if (dreamerIds.size < 2) continue

      const dreamerArray = Array.from(dreamerIds)
      matches.push({
        symbol_name: symbolName,
        match_date: targetDate,
        dreamer_ids: dreamerArray,
        dreamer_count: dreamerArray.length,
      })
    }

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matches found',
      })
    }

    // Insert matches
    const { error: insertError } = await supabase
      .from('dream_matches')
      .upsert(matches, { onConflict: 'symbol_name,match_date' })

    if (insertError) throw insertError

    // Create notifications for each match
    for (const match of matches) {
      for (const dreamerId of match.dreamer_ids) {
        const otherDreamers = match.dreamer_ids.filter((id) => id !== dreamerId)

        const { error: notifError } = await supabase
          .from('match_notifications')
          .insert({
            user_id: dreamerId,
            symbol_name: match.symbol_name,
            matched_dreamer_ids: otherDreamers,
            matched_count: otherDreamers.length,
          })

        if (notifError && !notifError.message.includes('duplicate')) {
          console.error('Error creating notification:', notifError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      matches_created: matches.length,
      total_symbols_processed: Object.keys(symbolMap).length,
    })
  } catch (error) {
    console.error('Error processing matches:', error)
    return NextResponse.json(
      { error: 'Failed to process matches' },
      { status: 500 }
    )
  }
}
