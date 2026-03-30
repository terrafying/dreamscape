import { NextResponse } from 'next/server'
import { getUserFromRequest, getBearerToken, getAuthenticatedClient } from '@/lib/supabaseServer'

type InterpretRow = { id: string; dream_id: string; user_id: string; handle: string; text: string; created_at: string }

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in to interpret' }, { status: 401 })
  }

  const { text } = await request.json()
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 })
  }
  if (text.trim().length > 500) {
    return NextResponse.json({ error: 'Max 500 characters' }, { status: 400 })
  }

  const token = getBearerToken(request)
  if (!token) return NextResponse.json({ error: 'Auth token missing' }, { status: 401 })

  const supabase = getAuthenticatedClient(token)
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  const profileResult = await supabase
    .from('user_profiles')
    .select('handle')
    .eq('user_id', user.id)
    .single() as unknown as { data: { user_id: string; handle: string } | null; error: { message: string } | null }

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ error: 'Set up your profile first' }, { status: 400 })
  }

  const insertResult = await (supabase
    .from('dream_interpretations')
    .insert({
      dream_id: params.id,
      user_id: user.id,
      handle: profileResult.data.handle,
      text: text.trim(),
    })
    .select()
    .single()) as unknown as { data: InterpretRow | null; error: { message: string } | null }

  if (insertResult.error) {
    return NextResponse.json({ error: insertResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, interpretation: insertResult.data })
}
