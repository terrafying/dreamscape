'use client'

import { useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { syncDreams, SYNC_COMPLETE_EVENT } from '@/lib/cloudSync'

export default function AuthSyncGate() {
  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const stripeId = session.user.user_metadata?.stripe_customer_id as string | undefined
        if (stripeId) localStorage.setItem('stripe_customer_id', stripeId)
        syncDreams(session.user.id)
      }
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = () => {
      window.dispatchEvent(new CustomEvent('dreamscape:cloud-sync-ready'))
    }
    window.addEventListener(SYNC_COMPLETE_EVENT, handler)
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, handler)
  }, [])

  return null
}
