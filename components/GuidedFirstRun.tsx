'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { seedDemoDreams } from '@/lib/store'
import { saveBiometricDataBatch } from '@/lib/biometrics'
import { getAppleHealthSampleData } from '@/lib/integrations/health'

export default function GuidedFirstRun() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem('dreamscape_guided_seen')
    if (!seen) setShow(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem('dreamscape_guided_seen', new Date().toISOString())
    setShow(false)
  }

  const loadDemo = async () => {
    await seedDemoDreams()
    const days = [0, -1, -2].map((o) => {
      const d = new Date(); d.setDate(d.getDate() + o)
      return d.toISOString().split('T')[0]
    })
    await saveBiometricDataBatch(getAppleHealthSampleData(days))
    dismiss()
    // Soft navigate: let user continue
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" style={{ background: 'rgba(0,0,0,0.36)' }}>
      <div className="absolute left-0 right-0 bottom-0 rounded-t-2xl p-5 space-y-3 max-w-xl mx-auto"
        style={{ background: 'rgba(10,10,18,0.98)', borderTop: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            Welcome to Dreamscape
          </div>
          <button onClick={dismiss} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Start with a gentle ritual: Dusk (evening) and Dawn (morning). Load a short demo so your charts light up immediately.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={loadDemo} className="rounded-xl px-3 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>◈</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Load demo dreams + biometrics</div>
          </button>
          <Link href="/journal" onClick={dismiss} className="rounded-xl px-3 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>☾</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Begin Dusk entry</div>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/log" onClick={dismiss} className="rounded-xl px-3 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>☀</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Record Dawn log</div>
          </Link>
          <Link href="/strata" onClick={dismiss} className="rounded-xl px-3 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>◎</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>See insights</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
