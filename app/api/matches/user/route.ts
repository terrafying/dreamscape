import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get user's match notifications
    const { data: notifications, error: notifError } = await supabase
      .from('match_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (notifError) throw notifError

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ matches: [], count: 0 })
    }

    // Get dreamer profiles for each notification
    const enrichedMatches = []

    for (const notif of notifications) {
      const { data: dreamers, error: dreamerError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, handle')
        .in('id', notif.matched_dreamer_ids)

      if (dreamerError) {
        console.error('Error fetching dreamers:', dreamerError)
        continue
      }

      enrichedMatches.push({
        id: notif.id,
        symbol_name: notif.symbol_name,
        matched_count: notif.matched_count,
        matched_dreamers: (dreamers || []).map((d: any) => ({
          id: d.id,
          name: d.full_name || 'Anonymous',
          avatar_url: d.avatar_url,
          handle: d.handle,
        })),
        match_date: notif.created_at.split('T')[0],
        created_at: notif.created_at,
        read: notif.read,
      })
    }

    return NextResponse.json({
      matches: enrichedMatches,
      count: enrichedMatches.length,
    })
  } catch (error) {
    console.error('Error fetching user matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      )
    }

    // Mark notification as read
    const { error } = await supabase
      .from('match_notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking match as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark match as read' },
      { status: 500 }
    )
  }
}
