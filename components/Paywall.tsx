'use client'

import Link from 'next/link'

export default function Paywall({ title = 'Go deeper with Dreamscape Premium', message, cta = 'Unlock Premium' }: { title?: string; message?: string; cta?: string }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-3 text-center"
      style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
    >
      <div className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
        {title}
      </div>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {message || 'Longitudinal patterns, biometric correlations, and advanced letters unlock after your first few weeks. Support your practice and keep your inner archive growing.'}
      </p>
      <div className="flex items-center justify-center gap-2 pt-1">
        <Link
          href="/api/billing/checkout"
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'var(--violet)', color: '#07070f' }}
        >
          {cta}
        </Link>
        <Link
          href="/api/billing/portal"
          className="px-3 py-2 rounded-full text-xs"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Manage
        </Link>
      </div>
    </div>
  )
}
