'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import BinauralPlayer from '@/components/BinauralPlayer'
import BreathworkPlayer from '@/components/BreathworkPlayer'
import { getDreams } from '@/lib/store'
import type { DreamLog } from '@/lib/types'
import { apiFetch } from '@/lib/apiFetch'

const VOICE_PRESETS = {
  luna: {
    label: 'Luna',
    desc: 'Soft, slow, deep',
    rate: 0.75,
    pitch: 0.90,
    voiceHints: ['Samantha', 'Karen', 'Moira', 'Google US English Female', 'Microsoft Aria', 'Zira'],
    langHint: 'en',
    genderHint: 'female',
  },
  ember: {
    label: 'Ember',
    desc: 'Warm, moderate',
    rate: 0.85,
    pitch: 0.95,
    voiceHints: ['Daniel', 'David', 'Google US English Male', 'Microsoft David'],
    langHint: 'en',
    genderHint: 'male',
  },
  mist: {
    label: 'Mist',
    desc: 'Barely a whisper',
    rate: 0.65,
    pitch: 1.05,
    voiceHints: ['Samantha', 'Karen', 'Moira', 'Google US English Female', 'Microsoft Zira'],
    langHint: 'en',
    genderHint: 'female',
  },
} as const
type VoicePresetKey = keyof typeof VOICE_PRESETS

// ─── Speech hook ──────────────────────────────────────────────────────────────

function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [preset, setPresetState] = useState<VoicePresetKey>('luna')
  const [volume, setVolumeState] = useState(0.85)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('dreamscape_voice_preset') as VoicePresetKey | null
    if (saved && saved in VOICE_PRESETS) setPresetState(saved)
    const savedVol = localStorage.getItem('dreamscape_voice_volume')
    if (savedVol) setVolumeState(parseFloat(savedVol))
  }, [])

  const pickVoice = useCallback((hints: readonly string[], langHint: string, genderHint: string): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined') return null
    const voices = window.speechSynthesis.getVoices()
    for (const name of hints) {
      const v = voices.find((v) => v.name.includes(name))
      if (v) return v
    }
    const gender = genderHint === 'female'
      ? voices.find((v) => v.lang.startsWith(langHint) && (v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male')))
      : voices.find((v) => v.lang.startsWith(langHint) && v.name.toLowerCase().includes('male'))
    if (gender) return gender
    return voices.find((v) => v.lang.startsWith(langHint + '-US')) ?? voices.find((v) => v.lang.startsWith(langHint)) ?? null
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const cfg = VOICE_PRESETS[preset]
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = cfg.rate
    utt.pitch = cfg.pitch
    utt.volume = volume
    const voice = pickVoice(cfg.voiceHints, cfg.langHint, cfg.genderHint)
    if (voice) utt.voice = voice
    utt.onstart = () => { setSpeaking(true); setPaused(false) }
    utt.onend = () => { setSpeaking(false); setPaused(false) }
    utt.onerror = () => { setSpeaking(false); setPaused(false) }
    utterRef.current = utt
    window.speechSynthesis.speak(utt)
  }, [preset, volume, pickVoice])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }, [])

  const togglePause = useCallback(() => {
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
    } else {
      window.speechSynthesis.pause()
      setPaused(true)
    }
  }, [paused])

  const setPreset = (p: VoicePresetKey) => {
    setPresetState(p)
    localStorage.setItem('dreamscape_voice_preset', p)
  }

  const setVolume = (v: number) => {
    setVolumeState(v)
    localStorage.setItem('dreamscape_voice_volume', String(v))
    if (utterRef.current) utterRef.current.volume = v
  }

  useEffect(() => () => { window.speechSynthesis?.cancel() }, [])

  return { speaking, paused, preset, volume, speak, stop, togglePause, setPreset, setVolume }
}

const TABS = [
  { id: 'stories',    label: 'Stories',    icon: '◇' },
  { id: 'breathwork', label: 'Breathwork', icon: '◎' },
  { id: 'binaural',   label: 'Binaural',   icon: '◈' },
] as const
type Tab = typeof TABS[number]['id']

// ─── Speaking icon (animated bars) ───────────────────────────────────────────

function SpeakingIcon({ active }: { active: boolean }) {
  return (
    <span
      className="flex items-end gap-px"
      style={{ height: '14px' }}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: '3px',
            borderRadius: '2px',
            background: 'var(--violet)',
            height: active ? `${[8, 14, 6][i]}px` : '5px',
            animation: active ? `wave-bar 0.9s ease-in-out ${i * 0.15}s infinite alternate` : 'none',
          }}
        />
      ))}
    </span>
  )
}

// ─── Story tab ────────────────────────────────────────────────────────────────

interface Chapter { title: string; body: string }

function parseChapters(text: string): Chapter[] {
  const chapters: Chapter[] = []
  const parts = text.split(/Chapter\s+[I]{1,3}\s*:/i)
  for (let i = 1; i < parts.length; i++) {
    const colonIdx = parts[i].indexOf(':')
    if (colonIdx === -1) { chapters.push({ title: `Chapter ${i}`, body: parts[i].trim() }); continue }
    const title = parts[i].slice(0, colonIdx).trim()
    const body = parts[i].slice(colonIdx + 1).trim()
    chapters.push({ title: title || `Chapter ${i}`, body })
  }
  if (chapters.length === 0) chapters.push({ title: '', body: text.trim() })
  return chapters
}

// ─── Ambient backdrop canvas ────────────────────────────────────────────────

function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const tRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = 400 * dpr
    canvas.height = 200 * dpr
    canvas.style.width = '400px'
    canvas.style.height = '200px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const draw = () => {
      const w = 400, h = 200
      const t = tRef.current
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2, cy = h / 2
      const r1 = 70 + 20 * Math.sin(t * 0.4)
      const r2 = 110 + 30 * Math.sin(t * 0.3 + 1.2)
      const r3 = 160 + 40 * Math.sin(t * 0.25 + 2.5)
      const grad1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1)
      grad1.addColorStop(0, 'rgba(167,139,250,0.14)')
      grad1.addColorStop(1, 'rgba(167,139,250,0)')
      const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r2)
      grad2.addColorStop(0, 'rgba(96,165,250,0.08)')
      grad2.addColorStop(1, 'rgba(96,165,250,0)')
      const grad3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r3)
      grad3.addColorStop(0, 'rgba(244,201,93,0.05)')
      grad3.addColorStop(1, 'rgba(244,201,93,0)')
      ctx.fillStyle = grad1; ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = grad2; ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = grad3; ctx.beginPath(); ctx.arc(cx, cy, r3, 0, Math.PI * 2); ctx.fill()
      tRef.current += 0.016
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div className="w-full flex justify-center mb-5">
      <canvas
        ref={canvasRef}
        className="rounded-3xl opacity-70"
        style={{ display: 'block', filter: 'blur(1px)' }}
        aria-hidden
      />
    </div>
  )
}

const STORY_KEY = 'dreamscape_story'

function StoryTab() {
  const [dreams, setDreams] = useState<DreamLog[]>([])
  const [storyText, setStoryText] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeChapter, setActiveChapter] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [cardStatus, setCardStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [cardImage, setCardImage] = useState('')
  const [cardTitle, setCardTitle] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const { speaking, paused, preset, volume, speak, stop, togglePause, setPreset, setVolume } = useSpeech()

  useEffect(() => { getDreams().then(setDreams) }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(STORY_KEY)
    if (saved) {
      try {
        const { text, chapters: savedChapters } = JSON.parse(saved)
        if (text && savedChapters?.length) {
          setStoryText(text)
          setChapters(savedChapters)
        }
      } catch {
        localStorage.removeItem(STORY_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onBeforeUnload = () => abortRef.current?.abort()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const generate = async () => {
    if (loading) { abortRef.current?.abort(); return }
    setLoading(true)
    setStoryText('')
    setChapters([])
    setActiveChapter(0)
    setStatus('')
    if (typeof window !== 'undefined') localStorage.removeItem(STORY_KEY)
    abortRef.current = new AbortController()

    try {
      const birth = typeof window !== 'undefined' ? localStorage.getItem('dreamscape_birth') : null
      const res = await apiFetch('/api/story', {
        method: 'POST',
        body: JSON.stringify({
          dreams,
          birthData: birth ? JSON.parse(birth) : null,
          date: new Date().toISOString().split('T')[0],
        }),
        signal: abortRef.current.signal,
      })

      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })

        const events = buf.split('\n\n')
        buf = events.pop() ?? ''

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
          try {
            const payload = JSON.parse(dataLine)
            if (eventType === 'status' && payload.message) setStatus(payload.message)
            if (eventType === 'story' && payload.text) {
              setStoryText(payload.text)
              const parsed = parseChapters(payload.text)
              setChapters(parsed)
              setActiveChapter(0)
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORY_KEY, JSON.stringify({ text: payload.text, chapters: parsed }))
              }
            }
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') setStatus('Generation failed')
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  const generateCard = async () => {
    if (cardStatus === 'generating') return
    setCardStatus('generating')
    setCardImage('')
    setCardTitle('')
    try {
      const res = await apiFetch('/api/generate-card', {
        method: 'POST',
        body: JSON.stringify({ dreams, storyTitle: chapters[0]?.title }),
      })
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const events = buf.split('\n\n')
        buf = events.pop() ?? ''
        for (const event of events) {
          if (!event.trim()) continue
          let eventType = '', dataLine = ''
          for (const line of event.split('\n')) {
            if (line.startsWith('event:')) eventType = line.slice(6).trim()
            if (line.startsWith('data:')) dataLine = line.slice(5).trim()
          }
          if (!dataLine) continue
          try {
            const payload = JSON.parse(dataLine)
            if (payload.title) setCardTitle(payload.title)
            if (payload.base64) setCardImage(payload.base64)
          } catch { /* skip */ }
        }
      }
      if (cardImage) setCardStatus('done')
      else setCardStatus('error')
    } catch {
      setCardStatus('error')
    }
  }

  const hasDreams = dreams.length > 0
  const fullText = chapters.map(c => c.body).join(' ')

  return (
    <div className="space-y-5">
      <AmbientCanvas />

      <div
        className="rounded-xl p-4 text-sm leading-relaxed"
        style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--muted)' }}
      >
        <span className="font-medium" style={{ color: 'var(--violet)' }}>Sleep Stories — </span>
        Your dream symbols, woven into a guided narrative.
      </div>

      {!hasDreams && (
        <div
          className="rounded-xl p-4 text-xs text-center"
          style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--muted)' }}
        >
          Log a dream first — your story draws from your own symbols.
        </div>
      )}

      <button
        onClick={generate}
        disabled={!hasDreams && !loading}
        className="w-full py-4 rounded-2xl text-sm font-medium transition-all duration-300"
        style={{
          background: loading ? 'rgba(167,139,250,0.12)' : hasDreams ? 'var(--violet)' : 'rgba(167,139,250,0.08)',
          border: `1px solid ${loading ? 'rgba(167,139,250,0.4)' : hasDreams ? 'transparent' : 'rgba(167,139,250,0.2)'}`,
          color: loading ? 'var(--violet)' : hasDreams ? '#07070f' : 'var(--muted)',
          cursor: !hasDreams && !loading ? 'default' : 'pointer',
        }}
      >
        {loading ? `◼  Stop · ${status || 'weaving your story...'}` : '◇  Weave a Sleep Story'}
      </button>

      {chapters.length > 0 && (
        <>
          {chapters.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => setActiveChapter(i)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all"
                  style={{
                    background: activeChapter === i ? 'rgba(167,139,250,0.2)' : 'rgba(15,15,26,0.6)',
                    border: `1px solid ${activeChapter === i ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
                    color: activeChapter === i ? 'var(--violet)' : 'var(--muted)',
                  }}
                >
                  {ch.title || `Part ${i + 1}`}
                </button>
              ))}
            </div>
          )}

          <div
            className="rounded-2xl p-6 text-center space-y-4"
            style={{
              background: 'linear-gradient(160deg, rgba(12,10,28,0.95), rgba(20,14,38,0.88))',
              border: '1px solid rgba(167,139,250,0.25)',
              boxShadow: '0 0 40px rgba(167,139,250,0.08), inset 0 0 30px rgba(167,139,250,0.04)',
            }}
          >
            {chapters[activeChapter]?.title && (
              <div
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: 'rgba(167,139,250,0.6)', letterSpacing: '0.2em' }}
              >
                {chapters[activeChapter].title}
              </div>
            )}
            <p
              className="leading-relaxed"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                color: 'rgba(226,232,240,0.92)',
                lineHeight: '1.9',
                letterSpacing: '0.01em',
              }}
            >
              {chapters[activeChapter]?.body}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!speaking ? (
              <button
                onClick={() => speak(fullText)}
                className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90"
                style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: 'var(--violet)' }}
              >
                <SpeakingIcon active={false} />
                Read Aloud
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
                  style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', color: 'var(--violet)' }}
                >
                  {paused
                    ? <><span style={{ fontSize: '14px' }}>▶</span> Resume</>
                    : <><SpeakingIcon active /><span>Pause</span></>}
                </button>
                <button
                  onClick={stop}
                  className="px-4 py-3 rounded-xl text-sm transition-opacity hover:opacity-70"
                  style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
                >
                  ◼ Stop
                </button>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-1.5">
              {(Object.keys(VOICE_PRESETS) as VoicePresetKey[]).map((key) => {
                const p = VOICE_PRESETS[key]
                return (
                  <button
                    key={key}
                    onClick={() => setPreset(key)}
                    className="flex-1 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      background: preset === key ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${preset === key ? 'rgba(167,139,250,0.35)' : 'var(--border)'}`,
                      color: preset === key ? 'var(--violet)' : 'var(--muted)',
                    }}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs" style={{ color: 'var(--muted)', fontSize: '10px' }}>Vol</span>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1"
                style={{ accentColor: 'var(--violet)', cursor: 'pointer' }}
              />
              <span className="text-xs font-mono" style={{ color: 'var(--muted)', fontSize: '10px', minWidth: '24px', textAlign: 'right' }}>
                {Math.round(volume * 100)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: 'rgba(167,139,250,0.15)' }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(167,139,250,0.3)' }}>Dream Card</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(167,139,250,0.15)' }} />
            </div>

            {cardStatus === 'done' && cardImage ? (
              <div className="space-y-2">
                <div
                  className="rounded-2xl overflow-hidden relative"
                  style={{ boxShadow: '0 0 30px rgba(167,139,250,0.15)' }}
                >
                  <img
                    src={`data:image/png;base64,${cardImage}`}
                    alt={cardTitle || 'Dream Card'}
                    className="w-full block"
                  />
                </div>
                {cardTitle && (
                  <p className="text-xs text-center font-mono uppercase tracking-widest" style={{ color: 'rgba(167,139,250,0.6)', letterSpacing: '0.15em' }}>
                    {cardTitle}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = `data:image/png;base64,${cardImage}`
                      a.download = `dream-card-${Date.now()}.png`
                      a.click()
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: 'var(--violet)' }}
                  >
                    ⬇ Save Card
                  </button>
                  <button
                    onClick={generateCard}
                    className="px-4 py-2 rounded-xl text-xs transition-opacity hover:opacity-70"
                    style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
                  >
                    ↻ New
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={generateCard}
                disabled={cardStatus === 'generating'}
                className="w-full py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: cardStatus === 'generating' ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.10)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  color: cardStatus === 'generating' ? 'rgba(167,139,250,0.4)' : 'var(--violet)',
                  cursor: cardStatus === 'generating' ? 'wait' : 'pointer',
                  opacity: cardStatus === 'generating' ? 0.6 : 1,
                }}
              >
                {cardStatus === 'generating' ? '◌ Rendering...' : '✦ Generate Dream Card'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DreamscapePage() {
  const [tab, setTab] = useState<Tab>('stories')
  const [breathPlaying, setBreathPlaying] = useState(false)
  const [binauralPlaying, setBinauralPlaying] = useState(false)

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-4 space-y-5">
      <div className="space-y-1">
        <h1
          className="text-2xl font-medium tracking-tight"
          style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
        >
          Sleep
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Guided stories, breathwork & binaural frequencies for deep sleep.
        </p>
      </div>

      {tab !== 'breathwork' && breathPlaying && (
        <button
          onClick={() => setTab('breathwork')}
          className="w-full rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm transition-all"
          style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)' }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--violet)', animation: 'pulse-banner 1.5s infinite' }} />
          <span style={{ color: 'var(--violet)' }}>Breathwork active</span>
          <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>tap to control →</span>
        </button>
      )}
      {tab !== 'binaural' && binauralPlaying && (
        <button
          onClick={() => setTab('binaural')}
          className="w-full rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm transition-all"
          style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.3)' }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#60a5fa', animation: 'pulse-banner 1.5s infinite' }} />
          <span style={{ color: '#60a5fa' }}>Binaural beats active</span>
          <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>tap to control →</span>
        </button>
      )}

      <div
        className="flex rounded-xl p-0.5 gap-0.5"
        style={{ background: 'rgba(15,15,26,0.8)', border: '1px solid var(--border)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
            style={{
              background: tab === t.id ? 'rgba(167,139,250,0.15)' : 'transparent',
              color: tab === t.id ? 'var(--violet)' : 'var(--muted)',
              border: tab === t.id ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{t.icon}</span>
            {t.label}
            {t.id === 'breathwork' && breathPlaying && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--violet)' }} />
            )}
            {t.id === 'binaural' && binauralPlaying && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#60a5fa' }} />
            )}
          </button>
        ))}
      </div>

      {tab === 'stories' && <StoryTab />}
      <div style={{ display: tab === 'breathwork' ? 'block' : 'none' }}>
        <BreathworkPlayer onPlayingChange={setBreathPlaying} />
      </div>
      <div style={{ display: tab === 'binaural' ? 'block' : 'none' }}>
        <BinauralPlayer onPlayingChange={setBinauralPlaying} />
      </div>

      <style>{`
        @keyframes pulse-banner {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
        @keyframes wave-bar {
          from { transform: scaleY(0.4); opacity: 0.7; }
          to   { transform: scaleY(1.0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
