import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAuth } from '@/lib/auth'
import { getUserFromRequest } from '@/lib/supabaseServer'
import { createFusionCard } from '@/lib/dream-alchemy'

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * POST /api/alchemy/fuse
 * Create an alchemical fusion from two dream symbols
 * 
 * Body:
 * {
 *   symbol1: string (user's symbol)
 *   symbol2: string (friend's symbol)
 *   friendId: string (friend's user ID)
 *   circleId?: string (optional circle context)
 * }
 */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to create fusions' }, { status: 401 })
  }

  const supabase = getAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const { symbol1, symbol2, friendId, circleId } = (await req.json()) as {
      symbol1: string
      symbol2: string
      friendId: string
      circleId?: string
    }

    // Validate inputs
    if (!symbol1 || !symbol2 || !friendId) {
      return NextResponse.json(
        { error: 'symbol1, symbol2, and friendId are required' },
        { status: 400 }
      )
    }

    const userId = user.id
    const userEmail = user.email || ''

    // Get friend's profile
    const friendResult = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', friendId)
      .single()

    if (friendResult.error || !friendResult.data) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 })
    }

    // Get current user's profile
    const userProfileResult = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', userId)
      .single()

    if (userProfileResult.error || !userProfileResult.data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Create fusion card
    const fusion = createFusionCard(
      symbol1,
      symbol2,
      userId,
      friendId,
      userProfileResult.data.display_name || userEmail,
      friendResult.data.display_name || 'Friend'
    )

    // Store fusion in database (optional - for tracking/sharing)
    const insertResult = await supabase.from('dream_fusions').insert({
      id: fusion.id,
      user1_id: userId,
      user2_id: friendId,
      symbol1: symbol1,
      symbol2: symbol2,
      fusion_name: fusion.fusionName,
      fusion_meaning: fusion.fusionMeaning,
      archetype_emoji: fusion.archetypeEmoji,
      archetype_name: fusion.archetypeName,
      circle_id: circleId || null,
      created_at: fusion.createdAt,
    })

    if (insertResult.error) {
      console.error('Failed to store fusion:', insertResult.error)
      // Still return the fusion even if storage fails
    }

    return NextResponse.json({
      ok: true,
      fusion: {
        id: fusion.id,
        symbol1: fusion.symbol1,
        symbol2: fusion.symbol2,
        user1Name: fusion.user1Name,
        user2Name: fusion.user2Name,
        fusionName: fusion.fusionName,
        fusionMeaning: fusion.fusionMeaning,
        archetypeEmoji: fusion.archetypeEmoji,
        archetypeName: fusion.archetypeName,
        shareUrl: fusion.shareUrl,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/alchemy/fuse?circleId=xxx
 * Get all fusions for a circle
 */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to view fusions' }, { status: 401 })
  }

  const supabase = getAdminClient()
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const { searchParams } = new URL(req.url)
    const circleId = searchParams.get('circleId')

    if (!circleId) {
      return NextResponse.json({ error: 'circleId is required' }, { status: 400 })
    }

    // Get all fusions for this circle
    const fusionsResult = await supabase
      .from('dream_fusions')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false })

    if (fusionsResult.error) {
      return NextResponse.json({ error: fusionsResult.error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      fusions: fusionsResult.data || [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
