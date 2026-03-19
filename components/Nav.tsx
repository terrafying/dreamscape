'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: 'Altar', icon: '✦' },
  { href: '/journal', label: 'Dusk', icon: '☾' },
  { href: '/log', label: 'Dawn', icon: '☀' },
  { href: '/strata', label: 'Strata', icon: '◈' },
  { href: '/letters', label: 'Letters', icon: '◇' },
  { href: '/dreamscape', label: 'Sleep', icon: '◉' },
  { href: '/invoke', label: 'Invoke', icon: '⬡' },
]

export default function Nav() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        background: 'rgba(7, 7, 15, 0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map((tab) => {
        const active = path === tab.href || path.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200"
            style={{
              color: active ? 'var(--text)' : 'var(--muted)',
              background: active ? 'linear-gradient(180deg, rgba(167,139,250,0.15), rgba(167,139,250,0.04))' : 'transparent',
            }}
          >
            <span className="text-lg leading-none" style={{ fontFamily: 'monospace' }}>
              {tab.icon}
            </span>
            <span
              className="text-xs font-medium tracking-wider uppercase"
              style={{ fontSize: '10px', letterSpacing: '0.1em' }}
            >
              {tab.label}
            </span>
            {active && (
              <span
                className="absolute bottom-0 w-8 h-0.5 rounded-full"
                style={{ background: 'var(--violet)' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
