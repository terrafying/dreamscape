'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

// Consolidate to max 5 bottom entries. Keep primary ritual flow visible.
// Primary tabs: Altar (/), Dusk (/journal), Dawn (/log), Strata (/strata), More (overflow)
const primaryTabs = [
  { href: '/', label: 'Altar', icon: '✦' },
  { href: '/journal', label: 'Dusk', icon: '☾' },
  { href: '/log', label: 'Dawn', icon: '☀' },
  { href: '/strata', label: 'Strata', icon: '◈' },
]

const overflowTabs = [
  { href: '/letters', label: 'Letters', icon: '◇' },
  { href: '/dreamscape', label: 'Sleep', icon: '◉' },
  { href: '/invoke', label: 'Invoke', icon: '⬡' },
]

export default function Nav() {
  const path = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
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
        {[...primaryTabs, { href: '#more', label: 'More', icon: '⋯' }].map((tab) => {
          const isMore = tab.href === '#more'
          const active = !isMore && (path === tab.href || path.startsWith(tab.href + '/'))
          const onClick = (e: React.MouseEvent) => {
            if (isMore) {
              e.preventDefault()
              setMoreOpen((v) => !v)
            }
          }
          const Comp = isMore ? 'a' : Link
          const props = isMore ? { href: '#more' } : { href: tab.href }
          return (
            <Comp
              key={tab.href}
              {...(props as any)}
              onClick={onClick as any}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200"
              style={{
                color: active ? 'var(--text)' : 'var(--muted)',
                background: active
                  ? 'linear-gradient(180deg, rgba(167,139,250,0.15), rgba(167,139,250,0.04))'
                  : 'transparent',
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
            </Comp>
          )
        })}
      </nav>

      {/* More menu as a lightweight bottom sheet */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          onClick={() => setMoreOpen(false)}
          style={{ background: 'rgba(0,0,0,0.3)' }}
        >
          <div
            className="absolute left-0 right-0 bottom-0 rounded-t-2xl p-4 space-y-1"
            style={{
              background: 'rgba(10,10,18,0.98)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2">
              <div className="text-sm uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                More
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="px-2 py-1 text-sm rounded"
                style={{ color: 'var(--muted)' }}
                aria-label="Close more menu"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {overflowTabs.map((tab) => {
                const active = path === tab.href || path.startsWith(tab.href + '/')
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMoreOpen(false)}
                    className="rounded-xl px-3 py-4 flex flex-col items-center gap-2 transition-colors"
                    style={{
                      background: active
                        ? 'linear-gradient(180deg, rgba(167,139,250,0.12), rgba(167,139,250,0.04))'
                        : 'rgba(255,255,255,0.02)',
                      color: active ? 'var(--text)' : 'var(--muted)'
                    }}
                  >
                    <div className="text-lg" style={{ fontFamily: 'monospace' }}>{tab.icon}</div>
                    <div className="text-xs uppercase tracking-wider" style={{ letterSpacing: '0.08em' }}>
                      {tab.label}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
