'use client'

import { useEffect, useRef, useState } from 'react'
import type { BirthData, VisionExtraction, VisionLog } from '@/lib/types'
import type { LLMProvider } from '@/lib/llm'
import { apiFetch } from '@/lib/apiFetch'
import { generateId, getBirthData, getVisions, saveVision } from '@/lib/store'
import ProviderSettings from '@/components/ProviderSettings'
import VoiceButton from '@/components/VoiceButton'
import HQVoiceButton from '@/components/HQVoiceButton'
import SigilWorkbench from '@/components/SigilWorkbench'
import VisionBoardCard from '@/components/VisionBoardCard'
import ShareableVisionCard from '@/components/ShareableVisionCard'

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function VisionRitualPage() {
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [sourceProvider, setSourceProvider] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<VisionExtraction | null>(null)
  const [visions, setVisions] = useState<VisionLog[]>([])
  const [savedId, setSavedId] = useState<string | null>(null)
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [provider, setProvider] = useState<LLMProvider>('anthropic')
  const [model, setModel] = useState<string | undefined>(undefined)
  const [imageUrl, setImageUrl] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [publishMessage, setPublishMessage] = useState('')
  const [publishing, setPublishing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    getBirthData().then(setBirthData)
    getVisions().then(setVisions)
  }, [])

  const appendVoice = (text: string) => {
    setTranscript((prev) => (prev.trim() ? `${prev} ${text.trim()}` : text.trim()))
  }

  const refreshVisions = async () => {
    const next = await getVisions()
    setVisions(next)
  }

  const persistVision = async (nextExtraction: VisionExtraction, nextImageUrl?: string) => {
    const id = savedId || generateId()
    const vision: VisionLog = {
      id,
      date: new Date().toISOString().split('T')[0],
      transcript,
      extraction: nextExtraction,
      boardImageUrl: nextImageUrl || imageUrl || undefined,
      createdAt: Date.now(),
    }
    await saveVision(vision)
    setSavedId(id)
    await refreshVisions()
    return vision
  }

  const handleSubmit = async () => {
    if (!transcript.trim() || status === 'loading') return
    setStatus('loading')
    setStatusMessage('Opening the ritual...')
    setExtraction(null)
    setImageUrl('')
    setPublishMessage('')
    abortRef.current = new AbortController()
    const date = new Date().toISOString().split('T')[0]

    try {
      const res = await apiFetch('/api/visions/extract', {
        method: 'POST',
        body: JSON.stringify({ transcript, date, birthData, provider, model }),
        signal: abortRef.current.signal,
      })
      if (!res.ok || !res.body) throw new Error('Vision extraction failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const event of events) {
          if (!event.trim()) continue
          const lines = event.split('\n')
          let eventType = ''
          let dataLine = ''
          for (const line of lines) {
            if (line.startsWith('event:')) eventType = line.slice(6).trim()
            if (line.startsWith('data:')) dataLine = line.slice(5).trim()
          }
          if (!dataLine) continue
          const data = JSON.parse(dataLine) as { message?: string; provider?: string; data?: VisionExtraction }
          if (eventType === 'status') setStatusMessage(data.message || '')
          if (eventType === 'source') setSourceProvider(data.provider || null)
          if (eventType === 'extraction' && data.data) {
            setExtraction(data.data)
            setStatus('done')
            await persistVision(data.data)
          }
          if (eventType === 'error') {
            setStatus('error')
            setStatusMessage(data.message || 'Something went wrong.')
          }
        }
      }
    } catch (err) {
      if (!(err instanceof Error) || err.name !== 'AbortError') {
        setStatus('error')
        setStatusMessage('Something went wrong. Please try again.')
      }
    }
  }

  const handleGenerateImage = async () => {
    if (!extraction) return
    setGeneratingImage(true)
    try {
      const res = await apiFetch('/api/visions/generate-image', {
        method: 'POST',
        body: JSON.stringify({ extraction }),
      })
      const json = await res.json() as { imageUrl?: string; error?: string }
      if (!res.ok || !json.imageUrl) {
        setPublishMessage(json.error || 'Image generation failed.')
        return
      }
      setImageUrl(json.imageUrl)
      await persistVision(extraction, json.imageUrl)
    } finally {
      setGeneratingImage(false)
    }
  }

  const handlePublish = async () => {
    if (!extraction) return
    setPublishing(true)
    setPublishMessage('')
    try {
      const vision = await persistVision(extraction, imageUrl)
      const res = await apiFetch('/api/visions/publish', {
        method: 'POST',
        body: JSON.stringify({ vision: { ...vision, published: true } }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) {
        setPublishMessage(json.error || 'Could not publish ritual.')
        return
      }
      setPublishMessage('Published to the community feed.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-6">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.18em]" style={{ color: '#f4c95d' }}>Vision Ritual</div>
        <h1 className="text-2xl leading-tight" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
          Distill a future desire into a sigil and living image.
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          Speak in scenes, feelings, places, and symbols. We will condense the desire, design a ceremonial sigil, and shape a vision board you can keep or share.
        </p>
      </div>

      <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(15,15,26,0.72)', border: '1px solid rgba(192,132,252,0.14)' }}>
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="Describe the life, scene, relationship, work, home, or becoming you are calling in. Be specific about atmosphere and symbols."
          className="w-full rounded-2xl px-4 py-4 text-sm leading-relaxed outline-none resize-none"
          style={{ minHeight: 180, background: 'rgba(8,8,18,0.75)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)' }}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            {status === 'loading' ? statusMessage : sourceProvider ? `Generated with ${sourceProvider}` : 'Future-facing, symbolic, ceremonial.'}
          </div>
          <div className="flex items-center gap-2">
            <VoiceButton onAppend={appendVoice} disabled={status === 'loading'} pulseHint />
            <HQVoiceButton onAppend={appendVoice} disabled={status === 'loading'} />
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!transcript.trim() || status === 'loading'}
          className="w-full py-3.5 rounded-2xl text-sm font-medium"
          style={{
            background: !transcript.trim() || status === 'loading' ? 'rgba(244,201,93,0.18)' : '#f4c95d',
            color: !transcript.trim() || status === 'loading' ? 'rgba(7,7,15,0.45)' : '#07070f',
          }}
        >
          {status === 'loading' ? 'Distilling...' : 'Begin Vision Ritual ✦'}
        </button>
        <ProviderSettings onChange={(nextProvider, nextModel) => { setProvider(nextProvider); setModel(nextModel) }} />
      </div>

      {status === 'error' && (
        <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          {statusMessage || 'Something went wrong.'}
        </div>
      )}

      {extraction && (
        <div className="space-y-4">
          <SigilWorkbench extraction={extraction} />
          <VisionBoardCard extraction={extraction} imageUrl={imageUrl} generating={generatingImage} onGenerate={handleGenerateImage} />
          <ShareableVisionCard extraction={extraction} imageUrl={imageUrl} shareHandle="you" />

          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(15,15,26,0.72)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>Blockers And Reframings</div>
            {extraction.blockers.map((blocker) => (
              <div key={blocker.name} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-sm" style={{ color: 'var(--text)' }}>{blocker.name}</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{blocker.reframing}</div>
                <div className="mt-2 text-xs" style={{ color: '#f4c95d' }}>{blocker.action}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(192,132,252,0.18)', border: '1px solid rgba(192,132,252,0.28)', color: '#e9d5ff' }}
            >
              {publishing ? 'Publishing...' : 'Publish To Community'}
            </button>
            <button
              onClick={() => {
                setTranscript('')
                setStatus('idle')
                setStatusMessage('')
                setExtraction(null)
                setImageUrl('')
                setSavedId(null)
                setPublishMessage('')
              }}
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}
            >
              Start Another
            </button>
          </div>

          {publishMessage && <div className="text-sm" style={{ color: publishMessage.includes('Published') ? '#86efac' : 'var(--muted)' }}>{publishMessage}</div>}
        </div>
      )}

      {visions.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>Recent Drafts</div>
          {visions.slice(0, 3).map((vision) => (
            <button
              key={vision.id}
              onClick={() => {
                setTranscript(vision.transcript)
                setExtraction(vision.extraction || null)
                setImageUrl(vision.boardImageUrl || '')
                setSavedId(vision.id)
                setStatus(vision.extraction ? 'done' : 'idle')
              }}
              className="w-full text-left rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-sm" style={{ color: 'var(--text)' }}>{vision.extraction?.title || 'Untitled Vision'}</div>
              <div className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--muted)' }}>{vision.extraction?.distilled_intention || vision.transcript}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
