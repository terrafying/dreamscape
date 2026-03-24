import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getNotableTransits } from '@/lib/transits'
import type { BirthData } from '@/lib/types'

type EmailPreferenceRow = {
  user_id: string
}

type NotificationRow = {
  title: string
}

type NotificationInsert = {
  user_id: string
  type: 'transit_alert'
  title: string
  body: string
  metadata: {
    transit_type: string
    significance: 'high' | 'medium'
    alert_date: string
    link: string
  }
}

function normalizeBirthData(raw: unknown): BirthData | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const maybe = raw as Partial<BirthData>
  if (!maybe.date || typeof maybe.date !== 'string') return undefined
  if (!maybe.location || typeof maybe.location !== 'string') return undefined
  return {
    date: maybe.date,
    location: maybe.location,
    time: typeof maybe.time === 'string' ? maybe.time : undefined,
    lat: typeof maybe.lat === 'number' ? maybe.lat : undefined,
    lng: typeof maybe.lng === 'number' ? maybe.lng : undefined,
  }
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

  const today = new Date().toISOString().slice(0, 10)
  const { data: prefRows, error: prefError } = await supabase
    .from('email_preferences')
    .select('user_id, transit_alerts')
    .eq('transit_alerts', true)

  if (prefError) {
    return NextResponse.json({ ok: false, error: prefError.message }, { status: 500 })
  }

  const recipients = (prefRows ?? []) as EmailPreferenceRow[]
  let alertCount = 0

  for (const pref of recipients) {
    const userId = pref.user_id

    const { data: alreadyRows } = await supabase
      .from('notifications')
      .select('title')
      .eq('user_id', userId)
      .eq('type', 'transit_alert')
      .gte('created_at', `${today}T00:00:00Z`)

    const existingTitles = new Set(((alreadyRows ?? []) as NotificationRow[]).map((row) => row.title))

    const userResult = await supabase.auth.admin.getUserById(userId)
    if (userResult.error || !userResult.data.user) continue

    const birthData =
      normalizeBirthData(userResult.data.user.user_metadata?.birthData) ??
      normalizeBirthData(userResult.data.user.user_metadata?.birth_data)

    const alerts = getNotableTransits(today, birthData)
    if (alerts.length === 0) continue

    const payload: NotificationInsert[] = alerts
      .filter((alert) => !existingTitles.has(alert.title))
      .map((alert) => ({
        user_id: userId,
        type: 'transit_alert',
        title: alert.title,
        body: alert.body,
        metadata: {
          transit_type: alert.type,
          significance: alert.significance,
          alert_date: today,
          link: '/strata',
        },
      }))

    if (payload.length === 0) continue

    const { error: insertError } = await supabase.from('notifications').insert(payload)
    if (insertError) continue

    alertCount += payload.length
  }

  return NextResponse.json({ ok: true, alerts: alertCount })
}
