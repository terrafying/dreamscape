'use client'

import { useEffect } from 'react'

export default function PuzzleDebugPanel() {
  useEffect(() => {
    // Expose a simple debug API for tests and manual debugging
    ;(window as any).puzzle = (window as any).puzzle || {}
    ;(window as any).puzzle.debug = {
      navigateTo: (id: string) => window.dispatchEvent(new CustomEvent('puzzle-debug', { detail: { action: 'navigateTo', id } })),
      retryPath: () => window.dispatchEvent(new CustomEvent('puzzle-debug', { detail: { action: 'retryPath' } })),
      dumpState: () => window.dispatchEvent(new CustomEvent('puzzle-debug', { detail: { action: 'dumpState' } })),
    }
  }, [])

  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 50, display: 'grid', gap: 6 }}>
      <button onClick={() => window.dispatchEvent(new CustomEvent('puzzle-debug', { detail: { action: 'dumpState' } }))}
        className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text)', border: '1px solid var(--border)' }}>
        Dump State
      </button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('puzzle-debug', { detail: { action: 'retryPath' } }))}
        className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text)', border: '1px solid var(--border)' }}>
        Retry Path
      </button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('puzzle-debug', { detail: { action: 'navigateTo', id: 'node-0' } }))}
        className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text)', border: '1px solid var(--border)' }}>
        Go to node-0
      </button>
    </div>
  )
}
