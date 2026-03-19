'use client'

import { useEffect, useRef, useState } from 'react'

export default function HQVoiceButton({ onAppend, disabled }: { onAppend: (t: string) => void; disabled?: boolean }) {
  const [supported, setSupported] = useState(false)
  const [recording, setRecording] = useState(false)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => { setSupported(typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia) }, [])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []
        const fd = new FormData()
        fd.set('audio', blob, 'audio.webm')
        const res = await fetch('/api/stt', { method: 'POST', body: fd })
        if (res.ok) {
          const j = await res.json() as any
          if (j?.text) onAppend(j.text)
        }
        stream.getTracks().forEach(t => t.stop())
      }
      recRef.current = rec
      rec.start()
      setRecording(true)
    } catch (e) {
      console.warn('Mic error', e)
    }
  }

  const stop = () => { recRef.current?.stop(); recRef.current = null; setRecording(false) }

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
      title={recording ? 'Stop high-quality dictation' : 'High-quality dictation'}
      style={{
        background: recording ? 'rgba(34,197,94,0.15)' : 'rgba(45,212,191,0.12)',
        border: `1px solid ${recording ? 'rgba(34,197,94,0.4)' : 'rgba(45,212,191,0.35)'}`,
        color: recording ? '#86efac' : '#2dd4bf',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {recording ? 'Stop HQ' : 'HQ Dictate'}
    </button>
  )
}
