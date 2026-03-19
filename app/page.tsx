'use client'

import Link from 'next/link'
import { getCurrentSky } from '@/lib/astro'

function dateKey(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Home() {
  const now = new Date()
  const hour = now.getHours()
  const isEveningWindow = hour >= 18 || hour < 5
  const currentSky = getCurrentSky(dateKey(0))
  const nextSky = getCurrentSky(dateKey(1))

  const flow = [
    {
      step: 'Dusk Opening',
      time: 'Last 10 min before sleep',
      detail: 'Name what you are releasing, what you are grateful for, and the dream seed you carry inward.',
      href: '/journal',
      cta: 'Begin Dusk Entry',
      tint: 'rgba(245,158,11,0.16)',
      border: 'rgba(245,158,11,0.35)',
      color: '#f59e0b',
    },
    {
      step: 'Night Passage',
      time: 'Sleep + symbolic processing',
      detail: 'Let the psyche metabolize the day. Nothing to optimize, only to witness.',
      href: '/dreamscape',
      cta: 'Open Sleep Soundscape',
      tint: 'rgba(167,139,250,0.13)',
      border: 'rgba(167,139,250,0.28)',
      color: 'var(--violet)',
    },
    {
      step: 'Dawn Gathering',
      time: 'First 10 min after waking',
      detail: 'Catch dream fragments before they fade. Set a gentle intention for the day.',
      href: '/log',
      cta: 'Record Dawn Log',
      tint: 'rgba(244,201,93,0.15)',
      border: 'rgba(244,201,93,0.32)',
      color: '#f4c95d',
    },
  ]

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-6">
      {/* One-time guided first run sheet */}
      {/* @ts-expect-error Client component import at runtime */}
      {require('@/components/GuidedFirstRun').default()}
      {/* Optional auth prompt (magic link) */}
      {/* @ts-expect-error Client component import at runtime */}
      {require('@/components/AuthSheet').default()}
      <div
        className="rounded-2xl p-6 space-y-3"
        style={{
          background: 'radial-gradient(circle at 10% 0%, rgba(244,201,93,0.12), rgba(0,0,0,0) 40%), linear-gradient(165deg, rgba(12,12,24,0.95), rgba(26,16,42,0.82))',
          border: '1px solid rgba(167,139,250,0.3)',
        }}
      >
        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--violet)' }}>
          Dreamscape Altar
        </p>
        <h1 className="text-2xl leading-tight" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
          At dusk you close. At dawn you gather.
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          This space holds your threshold moments: the final minutes before sleep and the first moments after waking.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          Keep it simple, warm, and honest. Return nightly and each morning to trace your inner weather.
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
          Ritual Timeline
        </div>
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid var(--border)' }}
        >
          {flow.map((item, index) => (
            <Link
              key={item.step}
              href={item.href}
              className="rounded-xl p-3 block transition-all hover:opacity-90"
              style={{ background: item.tint, border: `1px solid ${item.border}` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: `${item.color}22`, color: item.color }}>
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.14em]" style={{ color: item.color }}>
                    {item.step}
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{item.time}</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {item.detail}
                  </p>
                  <p className="text-xs font-medium" style={{ color: item.color }}>
                    {item.cta}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'rgba(15,15,30,0.74)', border: '1px solid rgba(167,139,250,0.22)' }}
      >
        <div className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--violet)' }}>
          Current Sky
        </div>
        <div className="space-y-2 text-sm">
          <p style={{ color: 'var(--text)' }}>
            {isEveningWindow ? 'Tonight' : 'Today'}: {currentSky.moonPhaseEmoji} {currentSky.moonPhase}, Moon in {currentSky.moonSign}, Sun in {currentSky.sunSign}
          </p>
          <p style={{ color: 'var(--muted)' }}>
            {currentSky.retrogrades.length > 0 ? `Active retrogrades: ${currentSky.retrogrades.join(', ')}` : 'No major retrogrades active now.'}
          </p>
          <p className="italic" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}>
            {currentSky.dominantTransit}
          </p>
          <p style={{ color: 'var(--text)' }}>
            {isEveningWindow ? 'At waking' : 'Tomorrow night'}: {nextSky.moonPhaseEmoji} {nextSky.moonPhase} with Moon in {nextSky.moonSign}.
          </p>
        </div>
      </div>

      {/* Quick Start */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid var(--border)' }}
      >
        <div className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
          Quick Start
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Link
            href={isEveningWindow ? '/journal' : '/log'}
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>{isEveningWindow ? '☾' : '☀'}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {isEveningWindow ? 'Dusk Entry' : 'Dawn Log'}
            </div>
          </Link>
          <Link
            href="/strata"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>◈</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              See Insights
            </div>
          </Link>
          <Link
            href="/letters"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>◇</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Dream Letter
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
