'use client'

import { useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { syncDreams } from '@/lib/cloudSync'

export default function AuthSyncGate() {
  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await syncDreams(session.user.id)
        } catch {
          // Cloud sync is best-effort — don't block UI on failure
        }
      }
    })

    return () => data.subscription.unsubscribe()
  }, [])

  return null
}
