'use client'

import { useState, useRef, useEffect } from 'react'

interface VoiceButtonProps {
  onAppend: (text: string) => void
  disabled?: boolean
}

// SpeechRecognition types vary across browsers/TS lib versions
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
}
interface SpeechRecog {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecog
    webkitSpeechRecognition?: new () => SpeechRecog
  }
}

function getSpeechRecognition(): (new () => SpeechRecog) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export default function VoiceButton({ onAppend, disabled }: VoiceButtonProps) {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(!!getSpeechRecognition())
  }, [])
  const [recording, setRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<SpeechRecog | null>(null)

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const start = () => {
    const SR = getSpeechRecognition()
    if (!SR) return

    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-US'
    r.maxAlternatives = 1

    r.onresult = (e: SpeechRecognitionEvent) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalChunk += t
        else interimChunk += t
      }
      if (finalChunk) {
        const trimmed = finalChunk.trim()
        if (trimmed) onAppend((trimmed.endsWith('.') || trimmed.endsWith('?') || trimmed.endsWith('!') ? ' ' : ', ') + trimmed)
        setInterim('')
      } else {
        setInterim(interimChunk)
      }
    }

    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'aborted') console.warn('Speech recognition error:', e.error)
      setRecording(false)
      setInterim('')
    }

    r.onend = () => {
      setRecording(false)
      setInterim('')
    }

    r.start()
    recognitionRef.current = r
    setRecording(true)
  }

  const stop = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setRecording(false)
    setInterim('')
  }

  const toggle = () => (recording ? stop() : start())

  if (!supported) return null

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        title={recording ? 'Stop recording' : 'Dictate dream'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
        style={{
          background: recording
            ? 'rgba(248,113,113,0.15)'
            : 'rgba(167,139,250,0.1)',
          border: `1px solid ${recording ? 'rgba(248,113,113,0.4)' : 'rgba(167,139,250,0.25)'}`,
          color: recording ? '#f87171' : 'var(--violet)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {recording ? (
          <>
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: '#f87171',
                animation: 'pulse-dot 1s infinite',
              }}
            />
            Stop
          </>
        ) : (
          <>
            <MicIcon />
            Dictate
          </>
        )}
      </button>

      {interim && (
        <p
          className="text-xs italic text-right max-w-xs leading-relaxed"
          style={{ color: 'rgba(226,232,240,0.4)' }}
        >
          {interim}
        </p>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
