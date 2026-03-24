'use client'

import { useState, useEffect } from 'react'
import type { DreamLog, DreamExtraction } from '@/lib/types'
import { getDreams } from '@/lib/store'
import DreamOracle from '@/components/DreamOracle'
import Link from 'next/link'

export default function ReadingPage() {
  const [dreams, setDreams] = useState<DreamLog[]>([])
  const [selected, setSelected] = useState<DreamExtraction | null>(null)
  const [revealDone, setRevealDone] = useState(false)

  useEffect(() => {
    getDreams().then((d) => {
      const withExtractions = d.filter((dr) => dr.extraction)
      setDreams(withExtractions)
      if (withExtractions.length > 0 && withExtractions[0].extraction) {
        setSelected(withExtractions[0].extraction)
      }
    })
  }, [])

  const handleSelect = (ext: DreamExtraction) => {
    setSelected(ext)
    setRevealDone(false)
  }

  return (
    <div
      className="min-h-screen px-4 pt-6 pb-28"
      style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(20, 10, 40, 0.4) 0%, transparent 70%)' }}
    >
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div
            className="text-xs font-mono uppercase tracking-widest"
            style={{ color: 'rgba(167, 139, 250, 0.4)', letterSpacing: '0.4em' }}
          >
            Dream Oracle
          </div>
          <h1
            className="text-2xl font-normal"
            style={{ color: '#b0c0e0', fontFamily: '"IM Fell English", Georgia, serif', letterSpacing: '0.15em' }}
          >
            Your Reading
          </h1>
          <p
            className="text-xs"
            style={{ color: 'rgba(148, 163, 184, 0.4)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Three cards drawn from the substance of your dreams
          </p>
        </div>

        {selected ? (
          <DreamOracle
            key={dreams.findIndex((d) => d.extraction === selected)}
            extraction={selected}
            onComplete={() => setRevealDone(true)}
          />
        ) : (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: 'rgba(15, 15, 26, 0.5)', border: '1px solid rgba(167, 139, 250, 0.12)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(148, 163, 184, 0.5)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              No dreams recorded yet.
            </p>
            <Link
              href="/log"
              className="inline-block mt-4 text-xs font-mono uppercase tracking-wider px-4 py-2 rounded-lg transition-all duration-300"
              style={{
                color: 'rgba(167, 139, 250, 0.6)',
                border: '1px solid rgba(167, 139, 250, 0.2)',
                background: 'rgba(167, 139, 250, 0.06)',
              }}
            >
              Record a dream
            </Link>
          </div>
        )}

        {revealDone && selected && (
          <div
            className="rounded-xl p-4 space-y-2"
            style={{
              background: 'rgba(15, 15, 26, 0.5)',
              border: '1px solid rgba(167, 139, 250, 0.1)',
            }}
          >
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'rgba(148, 163, 184, 0.6)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {selected.interpretation}
            </p>
            {selected.goetic_resonance && (
              <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <Link
                  href={`/invoke?spirit=${encodeURIComponent(selected.goetic_resonance.spirit)}`}
                  className="flex items-center gap-2 text-xs transition-all duration-300 hover:brightness-110"
                  style={{ color: 'rgba(167, 139, 250, 0.5)' }}
                >
                  <span>&#x2726;</span>
                  <span className="font-mono uppercase tracking-wider">Invoke {selected.goetic_resonance.spirit}</span>
                  <span style={{ color: 'rgba(167, 139, 250, 0.25)' }}>&#x203A;</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {dreams.length > 1 && (
          <div className="space-y-3">
            <div
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: 'rgba(148, 163, 184, 0.3)', letterSpacing: '0.15em' }}
            >
              Past dreams
            </div>
            <div className="space-y-2">
              {dreams.slice(0, 8).map((dream, i) => {
                const ext = dream.extraction
                if (!ext) return null
                const isActive = ext === selected
                return (
                  <button
                    key={dream.id}
                    onClick={() => handleSelect(ext)}
                    className="w-full text-left rounded-lg p-3 transition-all duration-200 cursor-pointer"
                    style={{
                      background: isActive ? 'rgba(167, 139, 250, 0.08)' : 'rgba(15, 15, 26, 0.3)',
                      border: `1px solid ${isActive ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
                        {dream.date}
                      </div>
                      {ext.symbols?.[0] && (
                        <div className="text-xs" style={{ color: 'rgba(167, 139, 250, 0.4)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                          {ext.symbols[0].name}
                        </div>
                      )}
                    </div>
                    <div
                      className="text-xs mt-1 line-clamp-1"
                      style={{ color: 'rgba(148, 163, 184, 0.3)', fontFamily: 'Georgia, serif' }}
                    >
                      {dream.transcript.slice(0, 80)}{dream.transcript.length > 80 ? '...' : ''}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
