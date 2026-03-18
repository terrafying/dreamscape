'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
  {
    name: 'Deep Sleep',
    icon: '◐',
    beatHz: 2,
    carrierHz: 100,
    color: '#60a5fa',
    category: 'Delta · 0–4 Hz',
    description: 'Deep restorative sleep & cellular repair',
  },
  {
    name: 'Dream Gate',
    icon: '◑',
    beatHz: 6,
    carrierHz: 136.1,
    color: '#a78bfa',
    category: 'Theta · 4–8 Hz',
    description: 'REM access, dream recall & hypnagogia',
  },
  {
    name: '528 Hz Repair',
    icon: '✦',
    beatHz: 7,
    carrierHz: 528,
    color: '#34d399',
    category: 'Theta · Solfeggio',
    description: 'Transformation & DNA repair frequency',
  },
  {
    name: '432 Hz Calm',
    icon: '◒',
    beatHz: 10,
    carrierHz: 432,
    color: '#818cf8',
    category: 'Alpha · Natural tuning',
    description: 'Harmony, stress release & relaxation',
  },
  {
    name: '174 Hz Ground',
    icon: '◌',
    beatHz: 8,
    carrierHz: 174,
    color: '#38bdf8',
    category: 'Alpha · Solfeggio',
    description: 'Pain relief, security & foundation',
  },
  {
    name: '852 Hz Awaken',
    icon: '◈',
    beatHz: 12,
    carrierHz: 852,
    color: '#fbbf24',
    category: 'Alpha · Solfeggio',
    description: 'Intuition & spiritual awakening',
  },
] as const

type Preset = typeof PRESETS[number]

// ─── Noise types ──────────────────────────────────────────────────────────────

const NOISE_TYPES = [
  { id: 'none' as const, label: 'None' },
  { id: 'brown' as const, label: 'Brown' },
  { id: 'pink' as const, label: 'Pink' },
  { id: 'white' as const, label: 'White' },
]
type NoiseType = typeof NOISE_TYPES[number]['id']

const TIMER_OPTIONS = [
  { label: '10m', minutes: 10 },
  { label: '20m', minutes: 20 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
  { label: '∞', minutes: 0 },
]

// ─── Noise buffer generation ──────────────────────────────────────────────────

function buildNoiseBuffer(ctx: AudioContext, type: 'brown' | 'pink' | 'white'): AudioBuffer {
  const rate = ctx.sampleRate
  const len = rate * 4 // 4s loop
  const buf = ctx.createBuffer(2, len, rate)

  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    if (type === 'white') {
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    } else if (type === 'brown') {
      let last = 0
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1
        d[i] = (last + 0.02 * w) / 1.02
        last = d[i]
        d[i] *= 3.5
      }
    } else {
      // Pink — Paul Kellett's method
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + w * 0.0555179
        b1 = 0.99332 * b1 + w * 0.0750759
        b2 = 0.96900 * b2 + w * 0.1538520
        b3 = 0.86650 * b3 + w * 0.3104856
        b4 = 0.55000 * b4 + w * 0.5329522
        b5 = -0.7616 * b5 - w * 0.0168980
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
        b6 = w * 0.115926
      }
    }
  }
  return buf
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BinauralPlayer({ onPlayingChange }: { onPlayingChange?: (p: boolean) => void } = {}) {
  const onPlayingChangeRef = useRef(onPlayingChange)
  useEffect(() => { onPlayingChangeRef.current = onPlayingChange }, [onPlayingChange])

  const [playing, setPlaying] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [volume, setVolume] = useState(0.6)
  const [noiseType, setNoiseType] = useState<NoiseType>('brown')
  const [noiseVolume, setNoiseVolume] = useState(0.35)
  const [timerMinutes, setTimerMinutes] = useState(30)
  const [elapsed, setElapsed] = useState(0)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const leftOscRef = useRef<OscillatorNode | null>(null)
  const rightOscRef = useRef<OscillatorNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const noiseGainRef = useRef<GainNode | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stoppingRef = useRef(false)

  const preset = PRESETS[selectedPreset]

  const stopNodes = useCallback(() => {
    try { leftOscRef.current?.stop() } catch { /* already stopped */ }
    try { rightOscRef.current?.stop() } catch { /* already stopped */ }
    try { noiseSourceRef.current?.stop() } catch { /* already stopped */ }
    leftOscRef.current = null
    rightOscRef.current = null
    noiseSourceRef.current = null
    noiseGainRef.current = null
    masterGainRef.current = null
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
    stoppingRef.current = false
  }, [])

  useEffect(() => () => stopNodes(), [stopNodes])

  const startAudio = useCallback((
    p: Preset,
    vol: number,
    nType: NoiseType,
    nVol: number,
    timerMin: number,
  ) => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    // Master gain — fade in
    const master = ctx.createGain()
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2)
    master.connect(ctx.destination)
    masterGainRef.current = master

    // Left ear — carrier frequency
    const leftPan = ctx.createStereoPanner()
    leftPan.pan.value = -1
    const leftOsc = ctx.createOscillator()
    leftOsc.type = 'sine'
    leftOsc.frequency.value = p.carrierHz
    leftOsc.connect(leftPan)
    leftPan.connect(master)
    leftOsc.start()
    leftOscRef.current = leftOsc

    // Right ear — carrier + beat
    const rightPan = ctx.createStereoPanner()
    rightPan.pan.value = 1
    const rightOsc = ctx.createOscillator()
    rightOsc.type = 'sine'
    rightOsc.frequency.value = p.carrierHz + p.beatHz
    rightOsc.connect(rightPan)
    rightPan.connect(master)
    rightOsc.start()
    rightOscRef.current = rightOsc

    // Background noise
    if (nType !== 'none') {
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0, ctx.currentTime)
      noiseGain.gain.linearRampToValueAtTime(nVol * 0.45, ctx.currentTime + 2)
      noiseGain.connect(master)
      noiseGainRef.current = noiseGain

      const noiseBuf = buildNoiseBuffer(ctx, nType)
      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuf
      noiseSource.loop = true
      noiseSource.connect(noiseGain)
      noiseSource.start()
      noiseSourceRef.current = noiseSource
    }

    // Timer
    if (timerMin > 0) {
      tickRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1
          if (next >= timerMin * 60) {
            if (tickRef.current) clearInterval(tickRef.current)
            // Fade out and stop
            if (masterGainRef.current && ctxRef.current && !stoppingRef.current) {
              stoppingRef.current = true
              masterGainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 3)
              setTimeout(() => { stopNodes(); setPlaying(false); setElapsed(0); onPlayingChangeRef.current?.(false) }, 3100)
            }
          }
          return next
        })
      }, 1000)
    }
  }, [stopNodes])

  const stop = useCallback((fadeSecs = 1.5) => {
    if (stoppingRef.current) return
    stoppingRef.current = true
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + fadeSecs)
    }
    setTimeout(() => { stopNodes(); setPlaying(false); setElapsed(0); onPlayingChangeRef.current?.(false) }, fadeSecs * 1000 + 100)
  }, [stopNodes])

  const toggle = () => {
    if (playing) {
      stop()
      onPlayingChangeRef.current?.(false)
    } else {
      startAudio(preset, volume, noiseType, noiseVolume, timerMinutes)
      setElapsed(0)
      setPlaying(true)
      onPlayingChangeRef.current?.(true)
    }
  }

  const selectPreset = (idx: number) => {
    const p = PRESETS[idx]
    if (playing && ctxRef.current) {
      const t = ctxRef.current.currentTime
      leftOscRef.current?.frequency.setTargetAtTime(p.carrierHz, t, 0.4)
      rightOscRef.current?.frequency.setTargetAtTime(p.carrierHz + p.beatHz, t, 0.4)
    }
    setSelectedPreset(idx)
  }

  // Live volume update
  useEffect(() => {
    if (masterGainRef.current && ctxRef.current && playing && !stoppingRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.05)
    }
  }, [volume, playing])

  // Live noise volume update
  useEffect(() => {
    if (noiseGainRef.current && ctxRef.current && playing && !stoppingRef.current) {
      noiseGainRef.current.gain.setTargetAtTime(noiseVolume * 0.45, ctxRef.current.currentTime, 0.05)
    }
  }, [noiseVolume, playing])

  const progress = timerMinutes > 0 ? elapsed / (timerMinutes * 60) : 0
  const remaining = timerMinutes > 0 ? timerMinutes * 60 - elapsed : null

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const carrierLabel = preset.carrierHz % 1 === 0 ? `${preset.carrierHz}` : preset.carrierHz.toFixed(1)

  return (
    <div className="space-y-6">

      {/* Preset grid */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Frequency Preset
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => selectPreset(i)}
              className="text-left rounded-xl p-3 transition-all"
              style={{
                background: selectedPreset === i ? `${p.color}14` : 'rgba(15,15,26,0.7)',
                border: `1px solid ${selectedPreset === i ? `${p.color}55` : 'var(--border)'}`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ color: p.color }}>{p.icon}</span>
                <span className="text-xs font-medium" style={{ color: selectedPreset === i ? p.color : 'var(--text)' }}>
                  {p.name}
                </span>
                {playing && selectedPreset === i && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: p.color, animation: 'pulse-dot 1.5s infinite' }} />
                )}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{p.category}</div>
              <div style={{ fontSize: '10px', color: 'rgba(226,232,240,0.35)', marginTop: '2px', lineHeight: 1.4 }}>
                {p.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Frequency readout */}
      <div
        className="rounded-xl p-4 flex items-center justify-around"
        style={{ background: 'rgba(15,15,26,0.8)', border: '1px solid var(--border)' }}
      >
        <div className="text-center">
          <div className="text-xl font-mono font-medium" style={{ color: preset.color }}>
            {carrierLabel} Hz
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>carrier · L + R</div>
        </div>
        <div style={{ color: 'var(--border)', fontSize: '20px' }}>+</div>
        <div className="text-center">
          <div className="text-xl font-mono font-medium" style={{ color: 'var(--muted)' }}>
            {preset.beatHz} Hz
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>beat offset · R</div>
        </div>
      </div>

      {/* Timer progress */}
      {playing && timerMinutes > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between" style={{ fontSize: '11px', color: 'var(--muted)' }}>
            <span>{fmt(elapsed)}</span>
            {remaining !== null && <span>−{fmt(remaining)}</span>}
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: '2px', background: 'var(--border)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progress * 100}%`, background: preset.color, transition: 'width 1s linear' }}
            />
          </div>
        </div>
      )}

      {/* Play button */}
      <button
        onClick={toggle}
        className="w-full py-4 rounded-2xl text-sm font-medium transition-all duration-300"
        style={{
          background: playing ? `${preset.color}18` : preset.color,
          border: `1px solid ${playing ? `${preset.color}55` : 'transparent'}`,
          color: playing ? preset.color : '#07070f',
        }}
      >
        {playing ? `◼  Stop · ${preset.name}` : `▶  Start · ${preset.name}`}
      </button>

      {playing && (
        <p className="text-center" style={{ fontSize: '11px', color: 'var(--muted)' }}>
          ◉ Binaural beats require stereo headphones
        </p>
      )}

      {/* Timer selection */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Timer
        </div>
        <div className="flex gap-2">
          {TIMER_OPTIONS.map((t) => (
            <button
              key={t.label}
              onClick={() => !playing && setTimerMinutes(t.minutes)}
              className="flex-1 py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: timerMinutes === t.minutes ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${timerMinutes === t.minutes ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
                color: timerMinutes === t.minutes ? 'var(--violet)' : 'var(--muted)',
                opacity: playing ? 0.5 : 1,
                cursor: playing ? 'default' : 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Volume */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Volume
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range" min="0" max="1" step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: preset.color }}
        />
      </div>

      {/* Background noise */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Background Noise
        </div>
        <div className="flex gap-2">
          {NOISE_TYPES.map((n) => (
            <button
              key={n.id}
              onClick={() => !playing && setNoiseType(n.id)}
              className="flex-1 py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: noiseType === n.id ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${noiseType === n.id ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
                color: noiseType === n.id ? 'var(--violet)' : 'var(--muted)',
                opacity: playing ? 0.5 : 1,
                cursor: playing ? 'default' : 'pointer',
              }}
            >
              {n.label}
            </button>
          ))}
        </div>

        {noiseType !== 'none' && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Mix</span>
            <input
              type="range" min="0" max="1" step="0.01"
              value={noiseVolume}
              onChange={(e) => setNoiseVolume(Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: 'rgba(167,139,250,0.7)' }}
            />
            <span className="text-xs font-mono w-7 text-right" style={{ color: 'var(--muted)' }}>
              {Math.round(noiseVolume * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className="rounded-xl p-3 text-xs leading-relaxed"
        style={{ background: 'rgba(15,15,26,0.5)', border: '1px solid var(--border)', color: 'var(--muted)' }}
      >
        Binaural beats deliver two slightly different frequencies — one per ear. The brain perceives the difference as a rhythmic pulse that entrains neural oscillations toward the target brainwave state. Best at low volume with stereo headphones before sleep.
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
      `}</style>
    </div>
  )
}
