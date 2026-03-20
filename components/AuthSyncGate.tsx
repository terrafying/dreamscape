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
        setTimeout(async () => {
          try {
            const { data: refreshed } = await supabase.auth.getUser()
            const stripeId = refreshed?.user?.user_metadata?.stripe_customer_id
            if (stripeId) localStorage.setItem('stripe_customer_id', stripeId)
            await syncDreams(session.user.id)
          } catch {
          }
        }, 0)
      }
    })

    return () => data.subscription.unsubscribe()
  }, [])

  return null
}
