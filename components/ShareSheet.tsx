'use client'

import { useState } from 'react'
import type { DreamLog } from '@/lib/types'
import { apiFetch } from '@/lib/apiFetch'
import { SITE_URL } from '@/lib/site'

interface Props {
  dream: DreamLog
  onClose: () => void
  onShared?: (sharedId: string) => void
}

export default function ShareSheet({ dream, onClose, onShared }: Props) {
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sharedOutside, setSharedOutside] = useState(false)
  const [sharedId, setSharedId] = useState<string | null>(null)

  const handleShareOutside = async () => {
    const idToShare = sharedId || dream.id
    const text = `A dream from dreamscape.quest:\n"${dream.transcript.slice(0, 200)}..."\n\nExplore at ${SITE_URL}/dream/${idToShare}`
    if (navigator.share) {
      try {
        await navigator.share({ text, url: `${SITE_URL}/dream/${idToShare}` })
        setSharedOutside(true)
      } catch { }
    } else {
      await navigator.clipboard.writeText(text)
      setSharedOutside(true)
    }
  }

  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    setError('')
    try {
      const res = await apiFetch(`/api/share/${dream.id}`, {
        method: 'POST',
        body: JSON.stringify({ dream }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to share'); return }
      setDone(true)
      const newSharedId = json.sharedDream?.id ?? dream.id
      setSharedId(newSharedId)
      onShared?.(newSharedId)
    } catch {
      setError('Network error')
    } finally {
      setSharing(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(7,7,15,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl p-5 space-y-4 max-w-xl mx-auto"
        style={{
          background: 'rgba(10,10,18,0.98)',
          borderTop: '1px solid rgba(167,139,250,0.2)',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium" style={{ color: 'var(--text)' }}>Share Dream</h2>
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--muted)' }}>Close</button>
        </div>

        {done ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span style={{ color: '#86efac' }}>✓</span>
              <p className="text-sm" style={{ color: '#86efac' }}>Dream shared to the community!</p>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Others can now see your dream symbols and interpretation in the community feed.
            </p>
            {!sharedOutside ? (
              <button
                onClick={handleShareOutside}
                className="w-full py-3 rounded-xl text-sm font-medium"
                style={{ border: '1px solid rgba(167,139,250,0.3)', color: 'var(--text)', background: 'rgba(167,139,250,0.08)' }}
              >
                Share Outside Dreamscape
              </button>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <span style={{ color: '#86efac' }}>✓</span>
                <p className="text-sm" style={{ color: '#86efac' }}>Link copied!</p>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--violet)', color: '#07070f' }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="rounded-xl p-3 text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'rgba(226,232,240,0.6)' }}
            >
              <p className="leading-relaxed">{dream.transcript.slice(0, 150)}{dream.transcript.length > 150 ? '…' : ''}</p>
            </div>

            {error && (
              <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
            )}

            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Your dream will be shared publicly with your handle. You can unshare it later.
            </p>

            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{
                background: sharing ? 'rgba(167,139,250,0.1)' : 'var(--violet)',
                color: sharing ? 'var(--violet)' : '#07070f',
                opacity: sharing ? 0.6 : 1,
              }}
            >
              {sharing ? 'Sharing…' : 'Share to Community'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
