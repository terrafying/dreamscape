'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import NotificationBell from '@/components/NotificationBell'

function isEveningHour(): boolean {
  const h = new Date().getHours()
  return h >= 18 || h < 5
}

export default function Nav() {
  const path = usePathname()
  const [isEvening, setIsEvening] = useState(() => isEveningHour())

  useEffect(() => {
    const tick = () => setIsEvening(isEveningHour())
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  const ritualTab = isEvening
    ? { href: '/journal', label: 'Dusk', icon: '☾' }
    : { href: '/log', label: 'Dawn', icon: '☀' }

  const tabs = [
    { href: '/', label: 'Altar', icon: '✦' },
    ritualTab,
    { href: '/reading', label: 'Reading', icon: '✧' },
    { href: '/dreamscape', label: 'Sleep', icon: '◉' },
    { href: '/strata', label: 'Strata', icon: '◈' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        background: 'rgba(7, 7, 15, 0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Primary navigation"
    >
      <div className="flex min-w-0 flex-1 items-stretch">
        {tabs.map((tab) => {
          const active = path === tab.href || path.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all duration-300 group"
              style={{
                color: active ? 'var(--violet)' : 'var(--muted)',
              }}
            >
              <div 
                className="flex items-center justify-center transition-all duration-300 rounded-lg"
                style={{
                  width: '40px',
                  height: '40px',
                  background: active ? 'rgba(167,139,250,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(167,139,250,0.5)' : 'none',
                }}
              >
                <span className="text-lg leading-none group-hover:scale-110 transition-transform" style={{ fontFamily: 'monospace' }}>
                  {tab.icon}
                </span>
              </div>
              <span
                className="text-xs font-medium tracking-wider uppercase"
                style={{ fontSize: '9px', letterSpacing: '0.1em' }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
      <div style={{ borderLeft: '1px solid var(--border)' }}>
        <NotificationBell />
      </div>
    </nav>
  )
}
