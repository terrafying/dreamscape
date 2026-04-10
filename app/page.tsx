'use client'

import Link from 'next/link'
import { getCurrentSky } from '@/lib/astro'
import GuidedFirstRun from '@/components/GuidedFirstRun'
import AuthSheet from '@/components/AuthSheet'

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
    {
      step: 'Future Casting',
      time: 'When desire asks for form',
      detail: 'Distill what you are calling in into a sigil, ritual sequence, and shareable vision board.',
      href: '/visions',
      cta: 'Open Vision Ritual',
      tint: 'rgba(192,132,252,0.14)',
      border: 'rgba(192,132,252,0.28)',
      color: '#c084fc',
    },
  ]

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-6">
      {/* One-time guided first run sheet */}
      <GuidedFirstRun />
      {/* Optional auth prompt (magic link) */}
      <AuthSheet />
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
        <p className="text-sm leading-relaxed" style={{ color: 'var(--secondary)' }}>
          Keep it simple, warm, and honest. Return nightly and each morning to trace your inner weather.
        </p>
      </div>

      <div
        className="rounded-2xl p-4 space-y-3 transition-all hover:opacity-95"
        style={{
          background: 'linear-gradient(160deg, rgba(12,10,28,0.97), rgba(20,14,38,0.90))',
          border: '1px solid rgba(167,139,250,0.30)',
          boxShadow: '0 0 40px rgba(167,139,250,0.10), inset 0 0 20px rgba(167,139,250,0.04)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ fontFamily: 'monospace', color: 'var(--violet)' }}>◇</span>
          <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--violet)' }}>
            New — Sleep Stories
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
          Your dream symbols woven into a guided cinematic narrative. Breathe, listen, and drift.
        </p>
        <Link
          href="/dreamscape"
          className="inline-block rounded-xl px-4 py-2.5 text-xs font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.35)', color: 'var(--violet)' }}
        >
          Open Sleep Stories →
        </Link>
      </div>

      <div
        className="rounded-2xl p-4 space-y-3 transition-all hover:opacity-95"
        style={{
          background: 'radial-gradient(circle at 12% 0%, rgba(244,201,93,0.12), rgba(0,0,0,0) 36%), linear-gradient(160deg, rgba(22,10,34,0.97), rgba(10,10,24,0.92))',
          border: '1px solid rgba(192,132,252,0.26)',
          boxShadow: '0 0 36px rgba(192,132,252,0.08), inset 0 0 18px rgba(244,201,93,0.05)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ fontFamily: 'monospace', color: '#f4c95d' }}>✦</span>
          <div className="text-xs uppercase tracking-[0.16em]" style={{ color: '#f4c95d' }}>
            New — Vision Ritual
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
          Speak the life you are summoning. Dreamscape condenses it into a sigil, a future-facing ritual, and an image board you can publish.
        </p>
        <Link
          href="/visions"
          className="inline-block rounded-xl px-4 py-2.5 text-xs font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(192,132,252,0.18)', border: '1px solid rgba(192,132,252,0.34)', color: '#e9d5ff' }}
        >
          Enter Vision Ritual →
        </Link>
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
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--secondary)' }}>
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
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--violet)' }}>
            Current Sky
          </div>
          {currentSky.retrogrades.length > 0 && (
            <div className="flex gap-1">
              {currentSky.retrogrades.map(r => (
                <span key={r} className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--gold)', border: '1px solid rgba(251,191,36,0.3)' }}>
                  ℞ {r}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-sm">
          <p style={{ color: 'var(--text)' }}>
            {isEveningWindow ? 'Tonight' : 'Today'}: {currentSky.moonPhaseEmoji} {currentSky.moonPhase} in {currentSky.moonSign}
          </p>
          <p style={{ color: 'var(--secondary)', fontSize: '12px' }}>
            ☀ Sun in {currentSky.sunSign}
            {currentSky.moonHouse && (
              <span style={{ color: 'var(--indigo)' }}> · ☽ House {currentSky.moonHouse}</span>
            )}
          </p>
        </div>

        {currentSky.aspects && currentSky.aspects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {currentSky.aspects.slice(0, 3).map((a, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(167,139,250,0.08)', color: 'var(--violet)', border: '1px solid rgba(167,139,250,0.2)' }}
              >
                {a.planet1} {a.aspect} {a.planet2}
              </span>
            ))}
          </div>
        )}

        {currentSky.outerPlanets && currentSky.outerPlanets.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--muted)' }}>
            {currentSky.outerPlanets.map(op => {
              const signSym = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' }[op.sign] ?? ''
              return <span key={op.planet}>{op.planet} {signSym} {op.sign}</span>
            })}
          </div>
        )}

        {currentSky.chiron && (
          <p className="text-xs" style={{ color: 'var(--gold)' }}>
            ⚷ Chiron in {currentSky.chiron.sign}
          </p>
        )}

        <p className="italic text-xs leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}>
          {currentSky.dominantTransit}
        </p>

        <p className="text-xs" style={{ color: 'var(--muted)', borderTop: '1px solid rgba(167,139,250,0.1)', paddingTop: '8px' }}>
          {isEveningWindow ? 'At waking' : 'Tomorrow night'}: {nextSky.moonPhaseEmoji} {nextSky.moonPhase} in {nextSky.moonSign}.
        </p>
      </div>

      {/* Liminal Space — Hyperfold Puzzle */}
      <Link
        href="/puzzle"
        className="block rounded-xl p-4 transition-all duration-500 hover:brightness-110"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(30, 15, 60, 0.35) 0%, rgba(15, 15, 26, 0.5) 100%)',
          border: '1px solid rgba(120, 80, 200, 0.12)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm"
            style={{ color: 'rgba(167, 139, 250, 0.5)', fontFamily: 'monospace' }}
          >&#x2B21;</span>
          <div className="flex-1">
            <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'rgba(167, 139, 250, 0.45)', letterSpacing: '0.2em' }}>
              Hyperfold Sigil
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(148, 163, 184, 0.35)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Explore the space between rooms while you sleep
            </div>
          </div>
          <span className="text-xs" style={{ color: 'rgba(167, 139, 250, 0.2)' }}>&#x203A;</span>
        </div>
      </Link>

      {/* Quick Start */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid var(--border)' }}
      >
        <div className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--muted)' }}>
          Quick Start
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <Link
            href="/journal"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>☾</div>
            <div className="text-xs mt-1" style={{ color: '#f6ad55' }}>Dusk</div>
          </Link>
          <Link
            href="/log"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(244,201,93,0.09)', color: '#f4c95d' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>☀</div>
            <div className="text-xs mt-1" style={{ color: '#f4c95d' }}>Dawn</div>
          </Link>
          <Link
            href="/dreamscape"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(167,139,250,0.06)', color: 'var(--violet)' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>◉</div>
            <div className="text-xs mt-1" style={{ color: 'var(--violet)', opacity: 0.8 }}>
              Sleep
            </div>
          </Link>
          <Link
            href="/strata"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>◈</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Strata
            </div>
          </Link>
          <Link
            href="/letters"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>✉</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Letters
            </div>
          </Link>
          <Link
            href="/invoke"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>⬡</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Invoke
            </div>
          </Link>
          <Link
            href="/shared"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>&#x25C7;</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Community
            </div>
          </Link>
          <Link
            href="/visions"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(192,132,252,0.08)', color: '#e9d5ff' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>✦</div>
            <div className="text-xs mt-1" style={{ color: '#d8b4fe' }}>
              Visions
            </div>
          </Link>
          <Link
            href="/account"
            className="rounded-lg px-3 py-3 text-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text)' }}
          >
            <div className="text-lg" style={{ fontFamily: 'monospace' }}>&#x2691;</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Account
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
