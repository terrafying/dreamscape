'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { VisionExtraction } from '@/lib/types'
import VisionSigil from '@/components/VisionSigil'

const POLL_INTERVAL_MS = 10_000

export default function VisionBoardCard({
  extraction,
  imageUrl,
  generating,
  onGenerate,
}: {
  extraction: VisionExtraction
  imageUrl?: string
  generating?: boolean
  onGenerate?: () => void
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoState, setVideoState] = useState<'idle' | 'starting' | 'rendering' | 'ready' | 'error'>('idle')
  const [videoError, setVideoError] = useState('')
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPoll = () => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current)
      pollTimer.current = null
    }
  }

  useEffect(() => clearPoll, [])

  const poll = useCallback((predictionId: string, cacheKeySeed: string) => {
    clearPoll()
    pollTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/visions/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ predictionId, cacheKeySeed }),
        })
        const json = await res.json() as { status?: string; videoUrl?: string; error?: string }
        if (json.status === 'succeeded' && json.videoUrl) {
          setVideoUrl(json.videoUrl)
          setVideoState('ready')
          return
        }
        if (json.status === 'failed' || json.status === 'canceled' || json.error) {
          setVideoState('error')
          setVideoError(json.error || 'Video render failed')
          return
        }
        setVideoState('rendering')
        poll(predictionId, cacheKeySeed)
      } catch {
        // Transient network hiccup — keep polling.
        setVideoState('rendering')
        poll(predictionId, cacheKeySeed)
      }
    }, POLL_INTERVAL_MS)
  }, [])

  const generateVideo = async () => {
    setVideoState('starting')
    setVideoError('')
    try {
      const res = await fetch('/api/visions/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraction }),
      })
      const json = await res.json() as {
        predictionId?: string
        status?: string
        videoUrl?: string
        cacheKeySeed?: string
        error?: string
      }
      if (json.error) {
        setVideoState('error')
        setVideoError(json.error)
        return
      }
      if (json.status === 'succeeded' && json.videoUrl) {
        // Cache hit — instant.
        setVideoUrl(json.videoUrl)
        setVideoState('ready')
        return
      }
      if (json.predictionId && json.cacheKeySeed) {
        setVideoState('rendering')
        poll(json.predictionId, json.cacheKeySeed)
      }
    } catch {
      setVideoState('error')
      setVideoError('Could not reach the video service')
    }
  }

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(15,15,26,0.72)', border: '1px solid rgba(244,201,93,0.16)' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'rgba(244,201,93,0.75)' }}>
            Vision Board
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            A future-facing image scaffolded from your symbols and ritual motifs.
          </p>
        </div>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-3 py-2 rounded-xl text-xs font-medium"
            style={{
              background: generating ? 'rgba(244,201,93,0.16)' : 'rgba(244,201,93,0.22)',
              color: generating ? 'rgba(244,201,93,0.55)' : '#f4c95d',
              border: '1px solid rgba(244,201,93,0.28)',
            }}
          >
            {generating ? 'Generating...' : imageUrl ? 'Regenerate Image' : 'Generate Image'}
          </button>
        )}
      </div>

      {imageUrl ? (
        <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={imageUrl} alt={extraction.title} className="w-full object-cover" style={{ maxHeight: 420 }} />
          <div
            className="absolute top-4 right-4 rounded-[1.25rem] p-2"
            style={{ background: 'rgba(6, 8, 16, 0.58)', border: '1px solid rgba(244,201,93,0.22)', backdropFilter: 'blur(8px)' }}
          >
            <VisionSigil recipe={extraction.sigil_recipe} size={104} className="block" />
          </div>
          <div
            className="absolute inset-x-0 bottom-0 p-4"
            style={{ background: 'linear-gradient(180deg, rgba(7,8,16,0), rgba(7,8,16,0.78))' }}
          >
            <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: 'rgba(244,201,93,0.8)' }}>
              AI Board + Deterministic Sigil Seal
            </div>
            <div className="mt-1 text-sm" style={{ color: 'rgba(248,250,252,0.94)', fontFamily: 'Georgia, serif' }}>
              {extraction.title}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            minHeight: 240,
            background: 'radial-gradient(circle at 20% 20%, rgba(244,201,93,0.12), rgba(0,0,0,0) 42%), linear-gradient(160deg, rgba(20,14,36,0.98), rgba(10,10,18,0.92))',
            border: '1px dashed rgba(244,201,93,0.24)',
          }}
        >
          <div className="text-sm" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            {extraction.distilled_intention}
          </div>
          <div className="flex justify-center">
            <div className="rounded-[1.25rem] p-2" style={{ background: 'rgba(7,9,16,0.42)', border: '1px solid rgba(244,201,93,0.18)' }}>
              <VisionSigil recipe={extraction.sigil_recipe} size={120} className="block" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {extraction.visual_motifs.map((motif) => (
              <span key={motif} className="px-2.5 py-1 rounded-full text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--muted)' }}>
                {motif}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(244,201,93,0.18)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.12em]" style={{ color: 'rgba(244,201,93,0.7)' }}>
            Living Vision — video
          </div>
          <button
            type="button"
            onClick={() => void generateVideo()}
            disabled={videoState === 'starting' || videoState === 'rendering'}
            className="px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{
              background: videoState === 'starting' || videoState === 'rendering' ? 'rgba(244,201,93,0.16)' : 'rgba(244,201,93,0.22)',
              color: videoState === 'starting' || videoState === 'rendering' ? 'rgba(244,201,93,0.55)' : '#f4c95d',
              border: '1px solid rgba(244,201,93,0.28)',
            }}
          >
            {videoState === 'starting' && 'Conjuring...'}
            {videoState === 'rendering' && 'Rendering... (minutes)'}
            {videoState === 'ready' && 'Regenerate Video'}
            {(videoState === 'idle' || videoState === 'error') && (videoUrl ? 'Regenerate Video' : 'Animate Vision')}
          </button>
        </div>
        {videoState === 'rendering' && (
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            The vision is unfolding — this takes a few minutes. You can leave this page; completed videos are kept.
          </p>
        )}
        {videoState === 'error' && (
          <p className="text-[11px]" style={{ color: 'rgba(255,120,120,0.85)' }}>{videoError}</p>
        )}
        {videoUrl && (
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            loop
            muted
            playsInline
            className="w-full rounded-xl"
            style={{ border: '1px solid rgba(255,255,255,0.08)', maxHeight: 420 }}
          />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {extraction.ritual_steps.map((step) => (
          <div key={`${step.action}-${step.timing}`} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--violet)' }}>{step.timing}</div>
            <div className="mt-1 text-sm" style={{ color: 'var(--text)' }}>{step.action}</div>
            {step.why && <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{step.why}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
