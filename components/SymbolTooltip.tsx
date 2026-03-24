'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { findTarotCard, type TarotCard } from '@/lib/spiritual-content'

interface SymbolData {
  name: string
  meaning?: string
  category?: string
  salience?: number
  frequency?: number
}

interface SymbolTooltipProps {
  symbol: SymbolData
  children?: React.ReactNode
}

function TooltipPanel({
  symbol,
  tarot,
  onClose,
}: {
  symbol: SymbolData
  tarot: TarotCard | null
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={panelRef}
      className="rounded-xl p-4 space-y-3 animate-fade-in"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 8,
        width: 280,
        maxWidth: 'calc(100vw - 32px)',
        background: 'rgba(8, 5, 18, 0.97)',
        border: '1px solid rgba(167, 139, 250, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(139, 92, 246, 0.08)',
        zIndex: 50,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-xs font-mono uppercase tracking-widest mb-1"
            style={{ color: 'rgba(167, 139, 250, 0.5)' }}
          >
            {symbol.category || 'Symbol'}
          </div>
          <div
            className="text-sm font-medium"
            style={{ color: '#e2e8f0', fontFamily: 'Georgia, serif' }}
          >
            {symbol.name}
          </div>
        </div>
        {symbol.salience !== undefined && (
          <div
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(167, 139, 250, 0.1)',
              color: 'rgba(167, 139, 250, 0.6)',
              border: '1px solid rgba(167, 139, 250, 0.15)',
            }}
          >
            {Math.round(symbol.salience * 100)}%
          </div>
        )}
      </div>

      {symbol.meaning && (
        <p
          className="text-xs leading-relaxed"
          style={{ color: '#94a3b8', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          {symbol.meaning}
        </p>
      )}

      {tarot && (
        <div
          className="rounded-lg p-3 space-y-1.5"
          style={{
            background: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.12)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono"
              style={{ color: 'rgba(251, 191, 36, 0.7)' }}
            >
              {tarot.number}
            </span>
            <span
              className="text-sm"
              style={{ color: '#e2e8f0', fontFamily: 'Georgia, serif' }}
            >
              {tarot.name}
            </span>
          </div>
          {tarot.principle && (
            <div
              className="text-xs font-mono"
              style={{ color: 'rgba(167, 139, 250, 0.5)' }}
            >
              {tarot.principle} {tarot.arc ? `\u00b7 ${tarot.arc}` : ''}
            </div>
          )}
          <p
            className="text-xs leading-relaxed"
            style={{ color: '#64748b', fontFamily: 'Georgia, serif' }}
          >
            {tarot.meaning.length > 160 ? tarot.meaning.slice(0, 160) + '...' : tarot.meaning}
          </p>
        </div>
      )}

      {symbol.frequency !== undefined && symbol.frequency > 1 && (
        <div
          className="text-xs font-mono"
          style={{ color: 'rgba(167, 139, 250, 0.4)' }}
        >
          Appeared {symbol.frequency} times in your dreams
        </div>
      )}
    </div>
  )
}

export default function SymbolTooltip({ symbol, children }: SymbolTooltipProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const tarot = findTarotCard(symbol.name)
  const hasExtra = !!(symbol.meaning || tarot)

  const handleClose = useCallback(() => setOpen(false), [])

  if (!hasExtra) {
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full"
        style={{
          background: 'rgba(167, 139, 250, 0.08)',
          color: 'rgba(167, 139, 250, 0.7)',
          border: '1px solid rgba(167, 139, 250, 0.15)',
        }}
      >
        {children || symbol.name}
      </span>
    )
  }

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(v => !v)}
        className="text-xs px-2 py-0.5 rounded-full transition-all duration-200 cursor-pointer"
        style={{
          background: open ? 'rgba(167, 139, 250, 0.15)' : 'rgba(167, 139, 250, 0.08)',
          color: open ? '#a78bfa' : 'rgba(167, 139, 250, 0.7)',
          border: `1px solid ${open ? 'rgba(167, 139, 250, 0.35)' : 'rgba(167, 139, 250, 0.15)'}`,
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: '2px',
          textDecorationColor: 'rgba(167, 139, 250, 0.3)',
        }}
      >
        {children || symbol.name}
      </button>
      {open && (
        <TooltipPanel symbol={symbol} tarot={tarot} onClose={handleClose} />
      )}
    </span>
  )
}

export function SymbolPillList({ symbols }: { symbols: SymbolData[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {symbols.map((s) => (
        <SymbolTooltip key={s.name} symbol={s} />
      ))}
    </div>
  )
}
