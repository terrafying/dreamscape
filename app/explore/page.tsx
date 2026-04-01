'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import HyperShadowCanvas from '@/components/explore/HyperShadowCanvas'
import {
  EXPLORE_STORAGE_KEY,
  buildExploreChambers,
  parseAttunedIds,
  serializeAttunedIds,
  type ExploreChamber,
} from '@/lib/dreamscape-explore'
import { getDreams, getVisions } from '@/lib/store'

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`
}

export default function ExplorePage() {
  const [chambers, setChambers] = useState<ExploreChamber[]>([])
  const [loading, setLoading] = useState(true)
  const [attuned, setAttuned] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<ExploreChamber | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [dreams, visions] = await Promise.all([getDreams(), getVisions()])
        if (cancelled) return
        setChambers(buildExploreChambers(dreams, visions))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setAttuned(parseAttunedIds(localStorage.getItem(EXPLORE_STORAGE_KEY)))
  }, [])

  const persist = useCallback((next: Set<string>) => {
    setAttuned(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPLORE_STORAGE_KEY, serializeAttunedIds(next))
    }
  }, [])

  const attune = useCallback(
    (id: string) => {
      const next = new Set(attuned)
      next.add(id)
      persist(next)
    },
    [attuned, persist],
  )

  const clearAll = useCallback(() => {
    persist(new Set())
  }, [persist])

  const total = chambers.length
  const done = useMemo(() => chambers.filter((c) => attuned.has(c.id)).length, [chambers, attuned])
  const complete = total > 0 && done === total

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28 space-y-6">
      <header className="space-y-3">
        <div className="flex items-start gap-4">
          <HyperShadowCanvas size={96} className="shrink-0 rounded-2xl opacity-90" />
          <div className="min-w-0 pt-1">
            <h1
              className="text-2xl font-medium tracking-tight"
              style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
            >
              Liminal Atlas
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Each chamber is a symbol from your dreams or visions. You only ever walk a slice—what
              feels like rooms is one pattern seen from different angles.
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed pl-0.5" style={{ color: 'rgba(150, 160, 190, 0.75)' }}>
          Hyperdimensional flavor, not hyperdimensional controls: the small lattice above is a shadow of
          a tesseract—purely atmospheric. For the interactive fold puzzle, see{' '}
          <Link href="/puzzle" className="underline underline-offset-2" style={{ color: 'var(--violet)' }}>
            Hyperfold Sigil
          </Link>
          .
        </p>
      </header>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Loading symbols…
        </p>
      ) : (
        <>
          <div
            className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: 'rgba(15,15,26,0.85)', border: '1px solid var(--border)' }}
          >
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Attunement
              </div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>
                {done} / {total} thresholds
              </div>
            </div>
            <div
              className="h-2 flex-1 max-w-[140px] rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${total ? (done / total) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, rgba(167,139,250,0.9), rgba(96,165,250,0.7))',
                }}
              />
            </div>
          </div>

          {complete && (
            <div
              className="rounded-2xl px-4 py-4 text-center space-y-2"
              style={{
                background: 'linear-gradient(145deg, rgba(167,139,250,0.12), rgba(15,15,26,0.95))',
                border: '1px solid rgba(167,139,250,0.25)',
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.35em]" style={{ color: 'rgba(167,139,250,0.7)' }}>
                Atlas complete
              </div>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                You have attuned to every threshold in this pass. The pattern can shift when new dreams
                arrive—return after you log more.
              </p>
            </div>
          )}

          <ul className="grid gap-3">
            {chambers.map((c) => {
              const isDone = attuned.has(c.id)
              const ring = hsl(c.hue, 0.42, 0.52)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActive(c)}
                    className="w-full text-left rounded-2xl px-4 py-4 transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      background: 'rgba(12,12,22,0.9)',
                      border: `1px solid ${isDone ? 'rgba(167,139,250,0.35)' : 'var(--border)'}`,
                      boxShadow: isDone ? `0 0 24px ${ring}22` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[10px] font-mono"
                        style={{
                          border: `1px solid ${ring}`,
                          color: ring,
                          opacity: isDone ? 1 : 0.65,
                        }}
                        aria-hidden
                      >
                        {isDone ? '✓' : '◇'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                          {c.symbolName}
                        </div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                          {c.sourceSummary}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] w-full py-2 text-center"
            style={{ color: 'rgba(150, 160, 190, 0.45)' }}
          >
            Clear attunements
          </button>
        </>
      )}

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(4, 4, 12, 0.82)', backdropFilter: 'blur(12px)' }}
          role="dialog"
          aria-modal
          aria-labelledby="explore-chamber-title"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, rgba(18,16,32,0.98) 0%, rgba(8,8,16,0.99) 100%)',
              border: '1px solid rgba(167,139,250,0.2)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex justify-center">
              <HyperShadowCanvas size={72} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(167,139,250,0.5)' }}>
                {active.sourceKind === 'vision' ? 'Vision symbol' : 'Dream symbol'}
              </div>
              <h2 id="explore-chamber-title" className="text-xl font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                {active.symbolName}
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {active.sourceSummary}
              </p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(220, 224, 240, 0.92)' }}>
              {active.meaning}
            </p>
            {active.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {active.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(167,139,250,0.1)', color: 'rgba(200,190,240,0.85)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  attune(active.id)
                  setActive(null)
                }}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: 'rgba(167,139,250,0.2)',
                  border: '1px solid rgba(167,139,250,0.4)',
                  color: 'var(--violet)',
                }}
              >
                {attuned.has(active.id) ? 'Stay attuned' : 'Attune to this threshold'}
              </button>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--muted)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
