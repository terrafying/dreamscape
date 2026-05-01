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

// ─── Gateway stages ───────────────────────────────────────────────────────────

interface GatewayStage {
  name: string
  beatHz: number
  carrierHz: number
  durationMin: number
  color: string
  description: string
  guidance: string[]
}

const GATEWAY_STAGES: GatewayStage[] = [
  {
    name: 'Resonant Tuning',
    beatHz: 12,
    carrierHz: 100,
    durationMin: 3,
    color: '#94a3b8',
    description: 'Prepare the energy body',
    guidance: [
      'Breathe deeply. Let the sound fill your chest.',
      'Feel your body begin to settle and align.',
      'The energy is gathering. Let it move through you.',
    ],
  },
  {
    name: 'Focus 10',
    beatHz: 8,
    carrierHz: 100,
    durationMin: 10,
    color: '#818cf8',
    description: 'Mind awake · Body asleep',
    guidance: [
      'Your body is drifting into sleep. Your mind remains alert.',
      'Let your limbs grow heavy. You are still aware.',
      'Float at the threshold between sleep and waking.',
    ],
  },
  {
    name: 'Focus 12',
    beatHz: 6,
    carrierHz: 100,
    durationMin: 10,
    color: '#a78bfa',
    description: 'Expanded awareness',
    guidance: [
      'Your awareness is expanding beyond your body.',
      'Reach outward. The boundaries are softening.',
      'Notice what exists beyond the edge of thought.',
    ],
  },
  {
    name: 'Focus 15',
    beatHz: 4,
    carrierHz: 100,
    durationMin: 10,
    color: '#c084fc',
    description: 'No time · No space',
    guidance: [
      'Time is dissolving. There is only now.',
      'Space has no meaning here. Let it go.',
      'You are pure awareness with no location.',
    ],
  },
  {
    name: 'Focus 21',
    beatHz: 2,
    carrierHz: 100,
    durationMin: 10,
    color: '#e879f9',
    description: 'Other energy systems',
    guidance: [
      'You are touching other systems of energy.',
      'Beyond time. Beyond space. Beyond the body.',
      'Receive whatever comes. You are open.',
    ],
  },
  {
    name: 'Return',
    beatHz: 10,
    carrierHz: 100,
    durationMin: 3,
    color: '#60a5fa',
    description: 'Return to waking awareness',
    guidance: [
      'Gently begin your return. Feel your body.',
      'Bring back what you found. You are returning.',
      'The world is waiting. Carry the stillness with you.',
    ],
  },
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

// ─── Gateway canvas ───────────────────────────────────────────────────────────

function GatewayCanvas({ beatHz, color, playing }: { beatHz: number; color: string; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const spawnInterval = 1000 / beatHz

    interface Ring { r: number; alpha: number }
    const rings: Ring[] = []
    let lastSpawn = 0
    let animId: number
    let running = true

    const draw = (ts: number) => {
      ctx.clearRect(0, 0, W, H)

      if (playing && ts - lastSpawn >= spawnInterval) {
        rings.push({ r: 4, alpha: 0.6 })
        lastSpawn = ts
      }

      // Center dot
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = 0.8
      ctx.fill()
      ctx.globalAlpha = 1

      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]
        ring.r += 1.8
        ring.alpha -= 0.01
        if (ring.alpha <= 0) { rings.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.globalAlpha = ring.alpha
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      if (running) animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => { running = false; cancelAnimationFrame(animId) }
  }, [beatHz, color, playing])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={280}
      style={{ display: 'block', margin: '0 auto' }}
    />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BinauralPlayer({ onPlayingChange }: { onPlayingChange?: (p: boolean) => void } = {}) {
  const onPlayingChangeRef = useRef(onPlayingChange)
  useEffect(() => { onPlayingChangeRef.current = onPlayingChange }, [onPlayingChange])

  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState<'standard' | 'gateway'>('standard')
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [volume, setVolume] = useState(0.6)
  const [noiseType, setNoiseType] = useState<NoiseType>('brown')
  const [noiseVolume, setNoiseVolume] = useState(0.35)
  const [timerMinutes, setTimerMinutes] = useState(30)
  const [elapsed, setElapsed] = useState(0)
  const [gatewayStageIdx, setGatewayStageIdx] = useState(0)
  const [gatewayElapsed, setGatewayElapsed] = useState(0)
  const [gatewayGuidanceIdx, setGatewayGuidanceIdx] = useState(0)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const leftOscRef = useRef<OscillatorNode | null>(null)
  const rightOscRef = useRef<OscillatorNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const noiseGainRef = useRef<GainNode | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gatewayTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const guidanceTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stoppingRef = useRef(false)

  const preset = PRESETS[selectedPreset]
  const gatewayStage = GATEWAY_STAGES[gatewayStageIdx]

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
    if (gatewayTickRef.current) clearInterval(gatewayTickRef.current)
    if (guidanceTickRef.current) clearInterval(guidanceTickRef.current)
    tickRef.current = null
    gatewayTickRef.current = null
    guidanceTickRef.current = null
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

    const master = ctx.createGain()
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2)
    master.connect(ctx.destination)
    masterGainRef.current = master

    const leftPan = ctx.createStereoPanner()
    leftPan.pan.value = -1
    const leftOsc = ctx.createOscillator()
    leftOsc.type = 'sine'
    leftOsc.frequency.value = p.carrierHz
    leftOsc.connect(leftPan)
    leftPan.connect(master)
    leftOsc.start()
    leftOscRef.current = leftOsc

    const rightPan = ctx.createStereoPanner()
    rightPan.pan.value = 1
    const rightOsc = ctx.createOscillator()
    rightOsc.type = 'sine'
    rightOsc.frequency.value = p.carrierHz + p.beatHz
    rightOsc.connect(rightPan)
    rightPan.connect(master)
    rightOsc.start()
    rightOscRef.current = rightOsc

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

    if (timerMin > 0) {
      tickRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1
          if (next >= timerMin * 60) {
            if (tickRef.current) clearInterval(tickRef.current)
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

  const startGatewayAudio = useCallback((beatHz: number, carrierHz: number, vol: number, nVol: number) => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    const master = ctx.createGain()
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2)
    master.connect(ctx.destination)
    masterGainRef.current = master

    const leftPan = ctx.createStereoPanner()
    leftPan.pan.value = -1
    const leftOsc = ctx.createOscillator()
    leftOsc.type = 'sine'
    leftOsc.frequency.value = carrierHz
    leftOsc.connect(leftPan)
    leftPan.connect(master)
    leftOsc.start()
    leftOscRef.current = leftOsc

    const rightPan = ctx.createStereoPanner()
    rightPan.pan.value = 1
    const rightOsc = ctx.createOscillator()
    rightOsc.type = 'sine'
    rightOsc.frequency.value = carrierHz + beatHz
    rightOsc.connect(rightPan)
    rightPan.connect(master)
    rightOsc.start()
    rightOscRef.current = rightOsc

    // Pink noise locked for gateway
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0, ctx.currentTime)
    noiseGain.gain.linearRampToValueAtTime(nVol * 0.45, ctx.currentTime + 2)
    noiseGain.connect(master)
    noiseGainRef.current = noiseGain

    const noiseBuf = buildNoiseBuffer(ctx, 'pink')
    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuf
    noiseSource.loop = true
    noiseSource.connect(noiseGain)
    noiseSource.start()
    noiseSourceRef.current = noiseSource
  }, [])

  const stop = useCallback((fadeSecs = 1.5) => {
    if (stoppingRef.current) return
    stoppingRef.current = true
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + fadeSecs)
    }
    setTimeout(() => { stopNodes(); setPlaying(false); setElapsed(0); onPlayingChangeRef.current?.(false) }, fadeSecs * 1000 + 100)
  }, [stopNodes])

  const advanceGatewayStage = useCallback((nextIdx: number) => {
    if (nextIdx >= GATEWAY_STAGES.length) {
      if (gatewayTickRef.current) clearInterval(gatewayTickRef.current)
      if (guidanceTickRef.current) clearInterval(guidanceTickRef.current)
      gatewayTickRef.current = null
      guidanceTickRef.current = null
      setGatewayStageIdx(0)
      setGatewayElapsed(0)
      setGatewayGuidanceIdx(0)
      setMode('standard')
      stop(4)
      return
    }
    const next = GATEWAY_STAGES[nextIdx]
    if (ctxRef.current && leftOscRef.current && rightOscRef.current) {
      const t = ctxRef.current.currentTime
      leftOscRef.current.frequency.setTargetAtTime(next.carrierHz, t, 2.0)
      rightOscRef.current.frequency.setTargetAtTime(next.carrierHz + next.beatHz, t, 2.0)
    }
    setGatewayStageIdx(nextIdx)
    setGatewayElapsed(0)
    setGatewayGuidanceIdx(0)
  }, [stop])

  // Gateway tick — stage advance and guidance rotation
  useEffect(() => {
    if (mode !== 'gateway' || !playing || stoppingRef.current) return
    const stage = GATEWAY_STAGES[gatewayStageIdx]
    let advanced = false

    gatewayTickRef.current = setInterval(() => {
      setGatewayElapsed(e => {
        const next = e + 1
        if (!advanced && next >= stage.durationMin * 60) {
          advanced = true
          advanceGatewayStage(gatewayStageIdx + 1)
        }
        return next
      })
    }, 1000)

    guidanceTickRef.current = setInterval(() => {
      setGatewayGuidanceIdx(i => (i + 1) % stage.guidance.length)
    }, 20_000)

    return () => {
      clearInterval(gatewayTickRef.current!)
      clearInterval(guidanceTickRef.current!)
      gatewayTickRef.current = null
      guidanceTickRef.current = null
    }
  }, [mode, playing, gatewayStageIdx, advanceGatewayStage])

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

  const beginJourney = () => {
    setGatewayStageIdx(0)
    setGatewayElapsed(0)
    setGatewayGuidanceIdx(0)
    startGatewayAudio(GATEWAY_STAGES[0].beatHz, GATEWAY_STAGES[0].carrierHz, volume, noiseVolume)
    setPlaying(true)
    onPlayingChangeRef.current?.(true)
  }

  const endJourney = () => {
    setGatewayStageIdx(0)
    setGatewayElapsed(0)
    setGatewayGuidanceIdx(0)
    stop()
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
  const gatewayProgress = gatewayElapsed / (gatewayStage.durationMin * 60)

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const carrierLabel = preset.carrierHz % 1 === 0 ? `${preset.carrierHz}` : preset.carrierHz.toFixed(1)

  return (
    <div className="space-y-6">

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['standard', 'gateway'] as const).map((m) => (
          <button
            key={m}
            onClick={() => !playing && setMode(m)}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: mode === m ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${mode === m ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
              color: mode === m ? 'var(--violet)' : 'var(--muted)',
              opacity: playing ? 0.5 : 1,
              cursor: playing ? 'default' : 'pointer',
            }}
          >
            {m === 'standard' ? '◈ Standard' : '◎ Gateway'}
          </button>
        ))}
      </div>

      {/* ── Standard mode ───────────────────────────────────────────────────── */}
      {mode === 'standard' && (
        <>
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
        </>
      )}

      {/* ── Gateway mode ────────────────────────────────────────────────────── */}
      {mode === 'gateway' && (
        <>
          {/* Canvas */}
          <GatewayCanvas
            beatHz={gatewayStage.beatHz}
            color={gatewayStage.color}
            playing={playing}
          />

          {/* Stage info */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-medium" style={{ color: gatewayStage.color }}>
                {gatewayStage.name}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                {gatewayStage.beatHz} Hz
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {gatewayStage.description}
            </div>
          </div>

          {/* Stage progress */}
          {playing && (
            <div className="space-y-1.5">
              <div className="flex justify-between" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                <span>{fmt(gatewayElapsed)}</span>
                <span>{fmt(gatewayStage.durationMin * 60)}</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: '2px', background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${gatewayProgress * 100}%`,
                    background: gatewayStage.color,
                    transition: 'width 1s linear',
                  }}
                />
              </div>
            </div>
          )}

          {/* Guidance text */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(15,15,26,0.5)', border: `1px solid ${gatewayStage.color}22`, minHeight: '60px' }}
          >
            {playing ? (
              <p
                key={`${gatewayStageIdx}-${gatewayGuidanceIdx}`}
                className="text-sm italic leading-relaxed"
                style={{ color: 'rgba(226,232,240,0.7)', animation: 'guidance-in 0.8s ease forwards' }}
              >
                {gatewayStage.guidance[gatewayGuidanceIdx]}
              </p>
            ) : (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                46 min · Resonant Tuning → Focus 10 → 12 → 15 → 21 → Return
              </p>
            )}
          </div>

          {/* Stage ladder */}
          <div className="flex items-center justify-center gap-3">
            {GATEWAY_STAGES.map((s, i) => {
              const done = i < gatewayStageIdx
              const active = i === gatewayStageIdx && playing
              return (
                <div key={s.name} className="flex flex-col items-center gap-1">
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: done ? s.color : active ? s.color : 'transparent',
                      border: `1.5px solid ${done || active ? s.color : 'var(--border)'}`,
                      opacity: done ? 0.6 : active ? 1 : 0.4,
                      boxShadow: active ? `0 0 8px ${s.color}88` : 'none',
                      transition: 'all 0.4s ease',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: active ? s.color : 'var(--muted)', opacity: active ? 1 : 0.5 }}>
                    {s.name.replace('Focus ', 'F').replace('Resonant Tuning', 'Res.').replace('Return', 'Ret.')}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Begin/End button */}
          <button
            onClick={playing ? endJourney : beginJourney}
            className="w-full py-4 rounded-2xl text-sm font-medium transition-all duration-300"
            style={{
              background: playing ? `${gatewayStage.color}18` : gatewayStage.color,
              border: `1px solid ${playing ? `${gatewayStage.color}55` : 'transparent'}`,
              color: playing ? gatewayStage.color : '#07070f',
            }}
          >
            {playing ? '◼  End Journey' : '▶  Begin Journey'}
          </button>

          {playing && (
            <p className="text-center" style={{ fontSize: '11px', color: 'var(--muted)' }}>
              ◉ Binaural beats require stereo headphones · Pink noise locked
            </p>
          )}
        </>
      )}

      {/* ── Volume (both modes) ──────────────────────────────────────────────── */}
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
          style={{ accentColor: mode === 'gateway' ? gatewayStage.color : preset.color }}
        />
      </div>

      {/* Info */}
      {mode === 'standard' && (
        <div
          className="rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: 'rgba(15,15,26,0.5)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Binaural beats deliver two slightly different frequencies — one per ear. The brain perceives the difference as a rhythmic pulse that entrains neural oscillations toward the target brainwave state. Best at low volume with stereo headphones before sleep.
        </div>
      )}

      {mode === 'gateway' && !playing && (
        <div
          className="rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: 'rgba(15,15,26,0.5)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          The Monroe Institute Gateway sequence guides consciousness through progressively deeper states using 100 Hz carrier with decreasing beat frequencies. Pink noise is used throughout. Use stereo headphones in a quiet space.
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
        @keyframes guidance-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
