import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendWeeklyDigest } from '@/lib/email'
import type { DreamLog } from '@/lib/types'

type EmailPreferenceRow = {
  user_id: string
}

type UserDreamRow = {
  dream_data: DreamLog | null
  created_at: string
}

type UserProfileRow = {
  handle: string | null
  moon_sign: string | null
}

function formatWeekLabel(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${fmt.format(start)}–${fmt.format(end)}`
}

function normalizeDreams(rows: UserDreamRow[]): DreamLog[] {
  return rows
    .map((row) => row.dream_data)
    .filter((dream): dream is DreamLog => {
      return Boolean(
        dream &&
          typeof dream.id === 'string' &&
          typeof dream.date === 'string' &&
          typeof dream.transcript === 'string' &&
          typeof dream.createdAt === 'number'
      )
    })
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const incomingAuth = request.headers.get('authorization')

  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'Missing CRON_SECRET' }, { status: 500 })
  }

  if (incomingAuth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setUTCDate(weekStart.getUTCDate() - 7)
  const sinceIso = weekStart.toISOString()
  const weekLabel = formatWeekLabel(weekStart, now)

  const { data: prefRows, error: prefError } = await supabase
    .from('email_preferences')
    .select('user_id')
    .eq('weekly_digest', true)

  if (prefError) {
    return NextResponse.json({ ok: false, error: prefError.message }, { status: 500 })
  }

  const recipients = (prefRows ?? []) as EmailPreferenceRow[]
  let sent = 0

  for (const pref of recipients) {
    const userId = pref.user_id

    const { data: dreamRows, error: dreamError } = await supabase
      .from('user_dreams')
      .select('dream_data, created_at')
      .eq('user_id', userId)
      .gte('created_at', sinceIso)

    if (dreamError) continue

    const dreams = normalizeDreams((dreamRows ?? []) as UserDreamRow[])
    if (dreams.length === 0) continue

    const userResult = await supabase.auth.admin.getUserById(userId)
    const userEmail = userResult.data.user?.email
    if (userResult.error || !userEmail) continue

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('handle, moon_sign')
      .eq('user_id', userId)
      .maybeSingle()

    const typedProfile = (profile ?? null) as UserProfileRow | null

    try {
      await sendWeeklyDigest(userEmail, {
        dreams,
        userName: typedProfile?.handle ?? undefined,
        moonSign: typedProfile?.moon_sign ?? undefined,
        weekLabel,
      })

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'weekly_digest',
        title: `Your Dream Letter — ${weekLabel}`,
        body: `Your weekly dream digest is ready. We found ${dreams.length} dream${dreams.length === 1 ? '' : 's'} this week.`,
        metadata: {
          week_label: weekLabel,
          dreams_count: dreams.length,
        },
      })

      sent += 1
    } catch {
      continue
    }
  }

  return NextResponse.json({ ok: true, sent })
}
