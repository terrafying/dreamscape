'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { THOTH_ARCHETYPES, type ThothArchetype } from '@/lib/thoth-tarot'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'purification' | 'invocation' | 'pathworking' | 'scrying' | 'closing' | 'done'
type Mode = 'tibetan' | 'western' | 'middle-pillar' | 'tarot'

// Middle Pillar types
type PillarStep = 'kether' | 'daath' | 'tiphareth' | 'yesod' | 'malkuth'

interface TibetanContent { mantra?: string; instruction: string }
interface WesternContent { lines?: string[]; close?: string; instruction: string }
interface PhaseConfig {
  id: Phase; label: string; duration: number; icon: string
  tibetan: TibetanContent; western: WesternContent
}

// ─── Standard Phase definitions ───────────────────────────────────────────────

const PHASES: PhaseConfig[] = [
  {
    id: 'purification',
    label: 'Purification',
    duration: 180,
    icon: '◌',
    tibetan: {
      mantra: 'OM · AH · HUM',
      instruction: 'Seven slow breaths. OM — white light purifies body. AH — red light purifies speech. HUM — blue light purifies mind. Release the mundane with each exhale.',
    },
    western: {
      instruction: 'Seven slow breaths. With each exhale, release. Hold the intention: "I release what is small in me. I purify this space. I come before my Angel with sincerity."',
    },
  },
  {
    id: 'invocation',
    label: 'Invocation',
    duration: 420,
    icon: '◇',
    tibetan: {
      mantra: 'HOLY ANGEL · KNOW ME',
      instruction: 'Repeat rhythmically as mantra — 108 times. Face East. Let the rhythm carry you deeper than the words. You are calling your own deepest nature.',
    },
    western: {
      lines: [
        'Thee I invoke, the Bornless One.',
        'Thee, that didst create the earth and the heavens.',
        'Hear me and arise.',
        'Come forth and follow me.',
      ],
      instruction: 'Face East. Hold each line fully before moving to the next. Repeat the cycle.',
    },
  },
  {
    id: 'pathworking',
    label: 'Pathworking',
    duration: 600,
    icon: '△',
    tibetan: {
      instruction: 'You stand in silver-purple lunar light. A column rises above you ending in gold warmth. You are the ascending flame. Rise slowly along the pillar. Enter the golden solar heart. Rest there. Be present and available.',
    },
    western: {
      instruction: 'Visualize yourself in the silver-violet light of Yesod, the Moon sphere. The path of Samekh opens upward — fire and water mingling. Ascend to Tiphareth, the golden solar heart. Sit in that light, receptive. Wait without effort.',
    },
  },
  {
    id: 'scrying',
    label: 'Scrying',
    duration: 300,
    icon: '◉',
    tibetan: {
      instruction: 'Gaze softly at the center point without focusing. Release all effort. Your intention is already set. Let what arises arise without grasping or pushing away.',
    },
    western: {
      instruction: 'Soft gaze into the darkness. Intention: "Show me my nature." Do not reach — receive. Record any impressions below as they arise.',
    },
  },
  {
    id: 'closing',
    label: 'Closing',
    duration: 120,
    icon: '◌',
    tibetan: {
      mantra: 'OM · AH · HUM',
      instruction: 'By this merit may all beings realize their true nature. I dedicate this practice to awakening. Carry the warmth of the solar sphere with you.',
    },
    western: {
      close: 'AEĒIOUŌ',
      instruction: 'Holy Guardian Angel, attend me through this day. This work is sealed. Carry the warmth of Tiphareth with you.',
    },
  },
]

const PHASE_IDS = PHASES.map(p => p.id) as Phase[]

// ─── Middle Pillar Centers ─────────────────────────────────────────────────────

interface PillarCenter {
  id: PillarStep
  name: string
  hebrewName: string
  tibetanSeed: string
  location: string
  color: string
  hexColor: string
  duration: number
  instruction: string
}

const PILLAR_CENTERS: PillarCenter[] = [
  {
    id: 'kether',
    name: 'Kether',
    hebrewName: 'AHIH',
    tibetanSeed: 'AH',
    location: 'Crown',
    color: 'rgba(240,240,255,',
    hexColor: '#f0f0ff',
    duration: 90,
    instruction: 'Above the crown of your head, a sphere of brilliant white light. Vibrate AHIH (or AH) and feel it blaze. This is the divine crown — your highest nature, pure existence.',
  },
  {
    id: 'daath',
    name: 'Daath',
    hebrewName: 'YHVH ELOHIM',
    tibetanSeed: 'OM',
    location: 'Throat',
    color: 'rgba(180,180,255,',
    hexColor: '#b4b4ff',
    duration: 90,
    instruction: 'At the throat, a sphere of lavender light. Vibrate YHVH ELOHIM (or OM). The sphere of hidden knowledge, the abyss-bridge — your voice carries divine intelligence.',
  },
  {
    id: 'tiphareth',
    name: 'Tiphareth',
    hebrewName: 'YHVH ELOAH VE-DAATH',
    tibetanSeed: 'HRIH',
    location: 'Heart',
    color: 'rgba(255,200,80,',
    hexColor: '#ffc850',
    duration: 120,
    instruction: 'At the heart, a blazing sun of golden light. Vibrate YHVH ELOAH VE-DAATH (or HRIH). This is Tiphareth — the heart of the Tree, the solar self, the seat of the HGA.',
  },
  {
    id: 'yesod',
    name: 'Yesod',
    hebrewName: 'SHADDAI EL CHAI',
    tibetanSeed: 'OM',
    location: 'Sacral',
    color: 'rgba(167,139,250,',
    hexColor: '#a78bfa',
    duration: 90,
    instruction: 'At the sacral center, a sphere of silver-violet lunar light. Vibrate SHADDAI EL CHAI (or OM). Yesod — the foundation, the dream body, the astral gate.',
  },
  {
    id: 'malkuth',
    name: 'Malkuth',
    hebrewName: 'ADONAI HA-ARETZ',
    tibetanSeed: 'TAM',
    location: 'Feet / Earth',
    color: 'rgba(161,98,7,',
    hexColor: '#a16207',
    duration: 90,
    instruction: 'At the soles of the feet, a sphere of earthy russet-olive-black light descends into the ground. Vibrate ADONAI HA-ARETZ (or TAM). The kingdom — your body, the earth, the completed work.',
  },
]

// ─── Tarot Phase Config ───────────────────────────────────────────────────────

function getTarotPhases(archetype: ThothArchetype): PhaseConfig[] {
  return [
    {
      id: 'purification',
      label: 'Entry',
      duration: 120,
      icon: '◇',
      tibetan: {
        instruction: `Breathe and settle. You are about to enter the path of ${archetype.name} — ${archetype.hebrewLetter}. ${archetype.dreamResonance}`,
      },
      western: {
        instruction: `Breathe and settle. You are about to enter the path of ${archetype.name} — ${archetype.hebrewLetter}. ${archetype.dreamResonance}`,
      },
    },
    {
      id: 'pathworking',
      label: 'Threshold',
      duration: 480,
      icon: '△',
      tibetan: {
        instruction: `You stand before a gate marked with the letter ${archetype.hebrewLetter}. The gate opens. Enter. The archetype of ${archetype.name} rises before you. ${archetype.meaning} Remain open. Receive what is shown.`,
      },
      western: {
        instruction: `You stand before a gate marked with the letter ${archetype.hebrewLetter}. The gate opens. Enter. The archetype of ${archetype.name} rises before you. ${archetype.meaning} Remain open. Receive what is shown.`,
      },
    },
    {
      id: 'scrying',
      label: 'Return',
      duration: 300,
      icon: '◉',
      tibetan: {
        instruction: `You are returning from the path of ${archetype.name}. Record what you received — symbols, feelings, words, images. Nothing is too small.`,
      },
      western: {
        instruction: `You are returning from the path of ${archetype.name}. Record what you received — symbols, feelings, words, images. Nothing is too small.`,
      },
    },
    {
      id: 'closing',
      label: 'Closing',
      duration: 60,
      icon: '◌',
      tibetan: {
        mantra: 'OM · AH · HUM',
        instruction: 'Dedicate the merit. The path is sealed. Carry the teaching forward.',
      },
      western: {
        close: 'AEĒIOUŌ',
        instruction: 'This work is sealed. Carry what you received into your life.',
      },
    },
  ]
}

// ─── PathworkCanvas (Yesod→Tiphareth) ────────────────────────────────────────

function PathworkCanvas({ phase, progress }: { phase: Phase; progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)
  const starsRef = useRef<Array<{ x: number; y: number; r: number; spd: number }>>([])

  useEffect(() => {
    starsRef.current = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.6 + 0.2,
      spd: Math.random() * 5 + 2,
    }))
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width, H = canvas.height, cx = W / 2
    tRef.current += 0.01
    const t = tRef.current

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#05031a'
    ctx.fillRect(0, 0, W, H)

    const isPathworking = phase === 'pathworking'
    const isScrying = phase === 'scrying'
    const isClosing = phase === 'closing'
    const isActive = isPathworking || isClosing
    const dimmed = phase === 'idle' || phase === 'purification' || phase === 'invocation'

    if (!isScrying) {
      for (const s of starsRef.current) {
        const a = (dimmed ? 0.06 : 0.18) + Math.sin(t / s.spd) * 0.05
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,190,255,${a})`
        ctx.fill()
      }

      const yy = H * 0.77
      const ty = H * 0.23
      const pathTop = ty + 28
      const pathBottom = yy - 24

      const pG = ctx.createLinearGradient(cx, pathBottom, cx, pathTop)
      pG.addColorStop(0, `rgba(180,130,255,${isActive ? 0.45 : 0.1})`)
      pG.addColorStop(0.5, `rgba(220,190,255,${isActive ? 0.2 : 0.05})`)
      pG.addColorStop(1, `rgba(255,200,80,${isActive ? 0.45 : 0.1})`)
      ctx.strokeStyle = pG; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(cx, pathBottom); ctx.lineTo(cx, pathTop); ctx.stroke()

      const yPulse = dimmed ? 0.12 : 0.55 + Math.sin(t * 1.9) * 0.25
      const yGlow = ctx.createRadialGradient(cx, yy, 0, cx, yy, 52)
      yGlow.addColorStop(0, `rgba(160,100,255,${yPulse * 0.45})`)
      yGlow.addColorStop(1, 'rgba(100,50,180,0)')
      ctx.fillStyle = yGlow
      ctx.beginPath(); ctx.arc(cx, yy, 52, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx, yy, 24, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(180,120,255,${isActive ? 0.8 : 0.22})`
      ctx.lineWidth = 1.5; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, yy, 8, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(210,170,255,${isActive ? 0.7 : 0.18})`; ctx.fill()
      ctx.font = '8px monospace'
      ctx.fillStyle = `rgba(180,130,255,${isActive ? 0.65 : 0.22})`
      ctx.textAlign = 'center'
      ctx.fillText('YESOD · MOON', cx, yy + 38)

      const tPulse = dimmed ? 0.12 : 0.6 + Math.sin(t * 1.4) * 0.25
      const tGlow = ctx.createRadialGradient(cx, ty, 0, cx, ty, 64)
      tGlow.addColorStop(0, `rgba(255,200,80,${tPulse * 0.55})`)
      tGlow.addColorStop(1, 'rgba(180,120,0,0)')
      ctx.fillStyle = tGlow
      ctx.beginPath(); ctx.arc(cx, ty, 64, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx, ty, 30, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,200,80,${isActive ? 0.9 : 0.22})`
      ctx.lineWidth = 1.5; ctx.stroke()

      const cs = 10
      ctx.save(); ctx.translate(cx, ty); ctx.rotate(t * 0.18)
      ctx.beginPath()
      ctx.moveTo(-cs, 0); ctx.lineTo(cs, 0)
      ctx.moveTo(0, -cs); ctx.lineTo(0, cs)
      ctx.strokeStyle = `rgba(255,240,180,${isActive ? 0.85 : 0.18})`
      ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

      ctx.beginPath(); ctx.arc(cx, ty, 10, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,220,120,${isActive ? 0.8 : 0.18})`; ctx.fill()
      ctx.font = '8px monospace'
      ctx.fillStyle = `rgba(255,200,80,${isActive ? 0.65 : 0.22})`
      ctx.textAlign = 'center'
      ctx.fillText('TIPHARETH · SUN', cx, ty - 40)

      if (isPathworking || isClosing) {
        const p = isClosing ? 1 : progress
        const sY = pathBottom + p * (pathTop - pathBottom)
        const sp = 0.75 + Math.sin(t * 3) * 0.25
        const sGlow = ctx.createRadialGradient(cx, sY, 0, cx, sY, 16)
        sGlow.addColorStop(0, `rgba(255,255,200,${sp * 0.9})`)
        sGlow.addColorStop(0.5, `rgba(255,220,100,${sp * 0.5})`)
        sGlow.addColorStop(1, 'rgba(255,180,60,0)')
        ctx.fillStyle = sGlow
        ctx.beginPath(); ctx.arc(cx, sY, 16, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(cx, sY, 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,240,${sp})`; ctx.fill()
      }
    } else {
      const sp = 0.25 + Math.sin(t * 0.7) * 0.12
      const sGlow = ctx.createRadialGradient(cx, H / 2, 0, cx, H / 2, 40)
      sGlow.addColorStop(0, `rgba(180,160,255,${sp * 0.5})`)
      sGlow.addColorStop(1, 'rgba(80,60,160,0)')
      ctx.fillStyle = sGlow
      ctx.beginPath(); ctx.arc(cx, H / 2, 40, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx, H / 2, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(220,200,255,${0.45 + Math.sin(t * 0.7) * 0.25})`; ctx.fill()
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [phase, progress])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={360}
      style={{ width: 280, height: 360, display: 'block', margin: '0 auto' }}
    />
  )
}

// ─── Middle Pillar Canvas ──────────────────────────────────────────────────────

function MiddlePillarCanvas({ activeStep }: { activeStep: PillarStep | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height, cx = W / 2
    tRef.current += 0.008

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#05031a'
    ctx.fillRect(0, 0, W, H)

    // Center positions (y as fraction of height)
    const positions: Record<PillarStep, number> = {
      kether: 0.08,
      daath: 0.28,
      tiphareth: 0.50,
      yesod: 0.72,
      malkuth: 0.90,
    }

    // Draw central pillar
    ctx.beginPath()
    ctx.moveTo(cx, H * 0.08)
    ctx.lineTo(cx, H * 0.90)
    ctx.strokeStyle = 'rgba(200,180,255,0.08)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    PILLAR_CENTERS.forEach(center => {
      const isActive = center.id === activeStep
      const y = H * positions[center.id]
      const r = isActive ? 28 : 16
      const pulse = isActive ? 0.6 + Math.sin(tRef.current * 2) * 0.3 : 0.12

      // Glow
      const hexColor = center.hexColor
      const [cr, cg, cb] = [
        parseInt(hexColor.slice(1, 3), 16),
        parseInt(hexColor.slice(3, 5), 16),
        parseInt(hexColor.slice(5, 7), 16),
      ]
      const glow = ctx.createRadialGradient(cx, y, 0, cx, y, r * 2.5)
      glow.addColorStop(0, `rgba(${cr},${cg},${cb},${pulse * 0.5})`)
      glow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
      ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(cx, y, r * 2.5, 0, Math.PI * 2); ctx.fill()

      // Sphere ring
      ctx.beginPath(); ctx.arc(cx, y, r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${isActive ? 0.9 : 0.25})`
      ctx.lineWidth = isActive ? 2 : 1
      ctx.stroke()

      // Center dot
      ctx.beginPath(); ctx.arc(cx, y, r * 0.35, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${isActive ? 0.9 : 0.2})`
      ctx.fill()

      // Label
      ctx.font = `${isActive ? 9 : 7}px monospace`
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${isActive ? 0.8 : 0.3})`
      ctx.textAlign = 'center'
      ctx.fillText(isActive ? `${center.name} · ${center.hebrewName}` : center.name, cx, y + r + 14)
    })

    frameRef.current = requestAnimationFrame(draw)
  }, [activeStep])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={360}
      style={{ width: 280, height: 360, display: 'block', margin: '0 auto' }}
    />
  )
}

// ─── Tarot Canvas ─────────────────────────────────────────────────────────────

function TarotCanvas({ archetype, phase }: { archetype: ThothArchetype; phase: Phase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)
  const isActive = phase === 'pathworking'

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2
    tRef.current += 0.005

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#05031a'
    ctx.fillRect(0, 0, W, H)

    const pulse = isActive
      ? 0.5 + Math.sin(tRef.current * 1.5) * 0.4
      : 0.2 + Math.sin(tRef.current * 0.6) * 0.1

    // Outer ring
    ctx.beginPath(); ctx.arc(cx, cy, W * 0.42, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(167,139,250,${isActive ? 0.35 : 0.12})`
    ctx.lineWidth = 1; ctx.stroke()

    // Inner ring, slowly rotating
    const ringR = W * 0.3
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tRef.current * 0.05)
    ctx.beginPath()
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const x = Math.cos(a) * ringR
      const y = Math.sin(a) * ringR
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(200,180,255,${isActive ? pulse * 0.5 : 0.12})`
      ctx.fill()
    }
    ctx.restore()

    // Large central archetype number
    ctx.font = `bold ${W * 0.18}px Georgia`
    ctx.fillStyle = `rgba(255,200,80,${pulse * 0.6})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(archetype.number), cx, cy - H * 0.06)

    // Hebrew letter
    ctx.font = `${W * 0.09}px Georgia`
    ctx.fillStyle = `rgba(200,180,255,${pulse * 0.5})`
    ctx.fillText(archetype.hebrewLetter, cx, cy + H * 0.08)

    // Name
    ctx.font = `${W * 0.055}px monospace`
    ctx.fillStyle = `rgba(167,139,250,${isActive ? 0.8 : 0.35})`
    ctx.fillText(archetype.name.toUpperCase(), cx, cy + H * 0.22)

    // Element / planet badge
    const badge = archetype.element ?? archetype.planet ?? ''
    if (badge) {
      ctx.font = `${W * 0.042}px monospace`
      ctx.fillStyle = `rgba(167,139,250,${isActive ? 0.45 : 0.2})`
      ctx.fillText(badge.toUpperCase(), cx, cy + H * 0.31)
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [archetype, isActive])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={360}
      style={{ width: 280, height: 360, display: 'block', margin: '0 auto' }}
    />
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ALL_ARCHETYPES = Object.values(THOTH_ARCHETYPES).sort((a, b) => a.number - b.number)

export default function PathworkPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [mode, setMode] = useState<Mode>('tibetan')
  const [timeLeft, setTimeLeft] = useState(0)
  const [progress, setProgress] = useState(0)
  const [scryingNotes, setScryingNotes] = useState('')
  const [paused, setPaused] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)

  // Middle Pillar state
  const [pillarStepIdx, setPillarStepIdx] = useState(0)
  const [pillarTimeLeft, setPillarTimeLeft] = useState(0)

  // Tarot state
  const [selectedArchetype, setSelectedArchetype] = useState<ThothArchetype>(THOTH_ARCHETYPES[6]) // The Lovers
  const [showArchetypeList, setShowArchetypeList] = useState(false)
  const [tarotPhases, setTarotPhases] = useState<PhaseConfig[]>([])

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)
  const sessionStartRef = useRef(0)

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('pathwork-sessions') || '[]')
      setSessionCount(s.length)
    } catch {}
  }, [])

  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  // Get phases for current mode
  const getActivePhases = (): PhaseConfig[] => {
    if (mode === 'tarot') return tarotPhases
    return PHASES
  }

  function startPhase(p: Phase) {
    const phases = getActivePhases()
    const cfg = phases.find(c => c.id === p)
    if (!cfg) return
    clearTimer()
    durationRef.current = cfg.duration
    setPhase(p); setTimeLeft(cfg.duration); setProgress(0); setPaused(false)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const n = Math.max(0, prev - 1)
        setProgress(1 - n / durationRef.current)
        return n
      })
    }, 1000)
  }

  function advancePhase(currentPhase: Phase) {
    const phases = getActivePhases()
    const ids = phases.map(p => p.id) as Phase[]
    const idx = ids.indexOf(currentPhase)
    const next = ids[idx + 1]
    if (!next) {
      finishSession()
    } else {
      startPhase(next)
    }
  }

  function finishSession() {
    clearTimer()
    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode,
      scrying_notes: scryingNotes,
      tarot_card: mode === 'tarot' ? selectedArchetype.name : undefined,
      duration: Math.floor((Date.now() - sessionStartRef.current) / 1000),
    }
    try {
      const existing = JSON.parse(localStorage.getItem('pathwork-sessions') || '[]')
      localStorage.setItem('pathwork-sessions', JSON.stringify([session, ...existing].slice(0, 90)))
      setSessionCount(existing.length + 1)
    } catch {}
    setPhase('done')
  }

  function beginSession() {
    sessionStartRef.current = Date.now()
    setScryingNotes('')

    if (mode === 'middle-pillar') {
      setPillarStepIdx(0)
      setPillarTimeLeft(PILLAR_CENTERS[0].duration)
      startPillarTimer(0)
      setPhase('pathworking')
      return
    }

    if (mode === 'tarot') {
      const phases = getTarotPhases(selectedArchetype)
      setTarotPhases(phases)
      // slight delay so state updates first
      setTimeout(() => {
        durationRef.current = phases[0].duration
        setPhase(phases[0].id)
        setTimeLeft(phases[0].duration)
        setProgress(0)
        setPaused(false)
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            const n = Math.max(0, prev - 1)
            setProgress(1 - n / durationRef.current)
            return n
          })
        }, 1000)
      }, 50)
      return
    }

    startPhase('purification')
  }

  function startPillarTimer(stepIdx: number) {
    clearTimer()
    const center = PILLAR_CENTERS[stepIdx]
    if (!center) { finishSession(); return }
    setPillarTimeLeft(center.duration)
    timerRef.current = setInterval(() => {
      setPillarTimeLeft(prev => {
        const n = Math.max(0, prev - 1)
        if (n === 0) {
          clearInterval(timerRef.current!)
        }
        return n
      })
    }, 1000)
  }

  function advancePillar() {
    const next = pillarStepIdx + 1
    if (next >= PILLAR_CENTERS.length) {
      finishSession()
    } else {
      setPillarStepIdx(next)
      startPillarTimer(next)
    }
  }

  function togglePause() {
    if (paused) {
      timerRef.current = setInterval(() => {
        if (mode === 'middle-pillar') {
          setPillarTimeLeft(prev => Math.max(0, prev - 1))
        } else {
          setTimeLeft(prev => {
            const n = Math.max(0, prev - 1)
            setProgress(1 - n / durationRef.current)
            return n
          })
        }
      }, 1000)
      setPaused(false)
    } else {
      clearTimer(); setPaused(true)
    }
  }

  useEffect(() => () => clearTimer(), [])

  // Auto-advance standard phases (not scrying, not tarot return)
  useEffect(() => {
    if (timeLeft === 0 && phase !== 'idle' && phase !== 'done' && phase !== 'scrying') {
      const t = setTimeout(() => advancePhase(phase), 2000)
      return () => clearTimeout(t)
    }
  }, [timeLeft, phase])

  const activePhases = getActivePhases()
  const cfg = activePhases.find(p => p.id === phase)
  const phaseIdx = activePhases.map(p => p.id).indexOf(phase)
  const instruction = cfg
    ? (mode === 'tibetan' || mode === 'tarot' ? cfg.tibetan.instruction : cfg.western.instruction)
    : null
  const mantra = cfg && mode === 'tibetan' ? cfg.tibetan.mantra : undefined
  const westernLines = cfg && mode === 'western' ? cfg.western.lines : undefined
  const westernClose = cfg && mode === 'western' ? cfg.western.close : undefined

  function fmt(s: number) {
    const m = Math.floor(Math.abs(s) / 60)
    const sec = Math.abs(s) % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const totalDuration = PHASES.reduce((sum, p) => sum + p.duration, 0)
  const totalMin = Math.round(totalDuration / 60)

  const pillarCenter = PILLAR_CENTERS[pillarStepIdx]
  const activePillarStep = mode === 'middle-pillar' && phase === 'pathworking'
    ? pillarCenter?.id ?? null
    : null

  // Mode descriptions for idle card
  const modeDescriptions: Record<Mode, string> = {
    tibetan: 'Tibetan mantra tradition',
    western: 'Western Hermetic tradition',
    'middle-pillar': 'Sephirothic body meditation',
    tarot: 'Thoth Tarot gate pathworking',
  }

  return (
    <div className="max-w-sm mx-auto px-4 pt-8 pb-28 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            Pathwork
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {sessionCount > 0
              ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''} completed`
              : 'Daily practice · ascent on the Tree'}
          </p>
        </div>
        {/* Mode toggle */}
        <div
          className="flex flex-wrap gap-0.5 rounded-lg p-0.5"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          {([
            { id: 'tibetan', label: 'TIB' },
            { id: 'western', label: 'WST' },
            { id: 'middle-pillar', label: 'MPL' },
            { id: 'tarot', label: 'TAR' },
          ] as Array<{ id: Mode; label: string }>).map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setPhase('idle') }}
              disabled={phase !== 'idle' && phase !== 'done'}
              className="px-2 py-1 rounded text-[10px] transition-all font-mono"
              style={{
                background: mode === m.id ? 'rgba(139,92,246,0.25)' : 'transparent',
                color: mode === m.id ? 'var(--violet)' : 'var(--muted)',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas — always visible */}
      {mode === 'middle-pillar'
        ? <MiddlePillarCanvas activeStep={activePillarStep} />
        : mode === 'tarot'
        ? <TarotCanvas archetype={selectedArchetype} phase={phase} />
        : <PathworkCanvas phase={phase} progress={progress} />
      }

      {/* Idle state */}
      {phase === 'idle' && (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(8,5,18,0.9)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            {/* Standard mode: show phase list */}
            {(mode === 'tibetan' || mode === 'western') && (
              <>
                <div className="space-y-2">
                  {PHASES.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                      <span style={{ color: 'rgba(139,92,246,0.5)', fontFamily: 'monospace', minWidth: '12px' }}>{p.icon}</span>
                      <span className="flex-1">{p.label}</span>
                      <span className="opacity-50 font-mono">{fmt(p.duration)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 text-xs" style={{ color: 'var(--muted)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
                  ~{totalMin} min total · {modeDescriptions[mode]}
                </div>
              </>
            )}

            {/* Middle Pillar: show center list */}
            {mode === 'middle-pillar' && (
              <>
                <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'rgba(139,92,246,0.5)' }}>
                  Five Centers
                </div>
                <div className="space-y-2">
                  {PILLAR_CENTERS.map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.hexColor, opacity: 0.7 }} />
                      <span className="flex-1">{c.name} · {c.location}</span>
                      <span className="font-mono opacity-60" style={{ color: c.hexColor }}>{c.hebrewName}</span>
                      <span className="opacity-50 font-mono">{fmt(c.duration)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 text-xs" style={{ color: 'var(--muted)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
                  ~{Math.round(PILLAR_CENTERS.reduce((s, c) => s + c.duration, 0) / 60)} min total · Sephirothic body meditation
                </div>
              </>
            )}

            {/* Tarot: archetype selector */}
            {mode === 'tarot' && (
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.5)' }}>
                  Select Path Gate
                </div>
                <button
                  onClick={() => setShowArchetypeList(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(139,92,246,0.25)', color: 'var(--text)' }}
                >
                  <span style={{ fontFamily: 'Georgia, serif' }}>
                    {selectedArchetype.number}. {selectedArchetype.name}
                  </span>
                  <span style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: '11px' }}>
                    {selectedArchetype.hebrewLetter} ▾
                  </span>
                </button>
                {showArchetypeList && (
                  <div
                    className="max-h-56 overflow-y-auto rounded-xl"
                    style={{ background: 'rgba(8,5,18,0.97)', border: '1px solid rgba(139,92,246,0.2)' }}
                  >
                    {ALL_ARCHETYPES.map(a => (
                      <button
                        key={a.number}
                        onClick={() => { setSelectedArchetype(a); setShowArchetypeList(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="text-xs font-mono w-4 text-right" style={{ color: 'rgba(255,200,80,0.5)' }}>{a.number}</span>
                        <span className="text-sm flex-1" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{a.name}</span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{a.hebrewLetter}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div
                  className="rounded-lg px-3 py-2 text-xs italic leading-relaxed"
                  style={{ background: 'rgba(5,2,12,0.6)', color: 'var(--muted)', fontFamily: 'Georgia, serif' }}
                >
                  {selectedArchetype.dreamResonance}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={beginSession}
            className="w-full py-4 rounded-2xl text-sm font-medium transition-all duration-300"
            style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.35)',
              color: 'var(--violet)',
              fontFamily: 'monospace',
              letterSpacing: '0.15em',
            }}
          >
            △ BEGIN SESSION
          </button>
        </div>
      )}

      {/* ─── Middle Pillar active ─── */}
      {mode === 'middle-pillar' && phase === 'pathworking' && pillarCenter && (
        <div className="space-y-4">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {PILLAR_CENTERS.map((c, i) => (
              <div
                key={c.id}
                className="w-2 h-2 rounded-full transition-all duration-500"
                style={{
                  background: i < pillarStepIdx ? c.hexColor : i === pillarStepIdx ? c.hexColor : 'rgba(139,92,246,0.12)',
                  opacity: i < pillarStepIdx ? 0.5 : 1,
                  boxShadow: i === pillarStepIdx ? `0 0 8px ${c.hexColor}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Active center header */}
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: pillarCenter.hexColor + 'aa' }}
              >
                {pillarCenter.location} · {pillarStepIdx + 1} of {PILLAR_CENTERS.length}
              </div>
              <div className="text-lg font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                {pillarCenter.name}
              </div>
            </div>
            <div
              className="text-2xl font-mono tabular-nums"
              style={{ color: pillarTimeLeft < 15 ? pillarCenter.hexColor : 'var(--muted)' }}
            >
              {fmt(pillarTimeLeft)}
            </div>
          </div>

          {/* Content */}
          <div
            className="rounded-xl px-4 py-4 space-y-3"
            style={{ background: 'rgba(5,3,14,0.85)', border: `1px solid ${pillarCenter.hexColor}22` }}
          >
            <div className="text-center py-2">
              <div
                className="text-xl tracking-widest"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: pillarCenter.hexColor, letterSpacing: '0.3em' }}
              >
                {`${pillarCenter.tibetanSeed} · ${pillarCenter.hebrewName}`}
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              {pillarCenter.instruction}
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="px-4 py-2.5 rounded-xl text-xs font-mono tracking-widest transition-all"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.18)',
                color: 'var(--muted)',
              }}
            >
              {paused ? '▶ RESUME' : '‖ PAUSE'}
            </button>
            <button
              onClick={advancePillar}
              className="flex-1 py-2.5 rounded-xl text-xs font-mono tracking-widest transition-all"
              style={{
                background: pillarTimeLeft === 0 ? 'rgba(255,200,80,0.12)' : 'rgba(139,92,246,0.12)',
                border: `1px solid ${pillarTimeLeft === 0 ? 'rgba(255,200,80,0.4)' : 'rgba(139,92,246,0.3)'}`,
                color: pillarTimeLeft === 0 ? 'rgba(255,200,80,0.9)' : 'var(--violet)',
              }}
            >
              {pillarStepIdx >= PILLAR_CENTERS.length - 1
                ? '◼ COMPLETE'
                : `NEXT: ${PILLAR_CENTERS[pillarStepIdx + 1]?.name.toUpperCase()} →`}
            </button>
          </div>
        </div>
      )}

      {/* ─── Standard and Tarot active phases ─── */}
      {phase !== 'idle' && phase !== 'done' && mode !== 'middle-pillar' && cfg && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="flex items-center gap-1.5">
            {activePhases.map((p, i) => (
              <div
                key={p.id}
                className="flex-1 h-0.5 rounded-full transition-all duration-500"
                style={{
                  background: i < phaseIdx
                    ? 'rgba(139,92,246,0.6)'
                    : i === phaseIdx
                    ? 'rgba(255,200,80,0.8)'
                    : 'rgba(139,92,246,0.12)',
                }}
              />
            ))}
          </div>

          {/* Phase header + timer */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.6)' }}>
                {cfg.icon} Phase {phaseIdx + 1} of {activePhases.length}
              </div>
              <div className="text-lg font-medium" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                {cfg.label}
              </div>
            </div>
            <div
              className="text-2xl font-mono tabular-nums"
              style={{ color: timeLeft < 20 ? 'rgba(255,200,80,0.9)' : 'var(--muted)' }}
            >
              {fmt(timeLeft)}
            </div>
          </div>

          {/* Content */}
          <div
            className="rounded-xl px-4 py-4 space-y-3"
            style={{ background: 'rgba(5,3,14,0.85)', border: '1px solid rgba(139,92,246,0.12)' }}
          >
            {mantra && (
              <div className="text-center py-2">
                <div
                  className="text-base tracking-widest"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(200,180,255,0.9)', letterSpacing: '0.3em' }}
                >
                  {mantra}
                </div>
              </div>
            )}
            {westernLines && (
              <div className="space-y-2 py-1">
                {westernLines.map((line, i) => (
                  <p
                    key={i}
                    className="text-sm text-center italic"
                    style={{ fontFamily: 'Georgia, serif', color: 'rgba(180,160,255,0.85)', lineHeight: 1.8 }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
            {westernClose && (
              <div className="text-center pt-1">
                <span
                  className="text-xl tracking-widest"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'rgba(200,180,255,0.9)', letterSpacing: '0.4em' }}
                >
                  {westernClose}
                </span>
              </div>
            )}
            {instruction && (
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {instruction}
              </p>
            )}
          </div>

          {/* Scrying notes */}
          {phase === 'scrying' && (
            <textarea
              value={scryingNotes}
              onChange={e => setScryingNotes(e.target.value)}
              placeholder="Record impressions, images, words, felt sense..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'rgba(3,1,10,0.9)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: 'var(--text)',
                fontFamily: 'Georgia, serif',
              }}
              data-no-swipe
            />
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="px-4 py-2.5 rounded-xl text-xs font-mono tracking-widest transition-all"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.18)',
                color: 'var(--muted)',
              }}
            >
              {paused ? '▶ RESUME' : '‖ PAUSE'}
            </button>
            <button
              onClick={() => advancePhase(phase)}
              className="flex-1 py-2.5 rounded-xl text-xs font-mono tracking-widest transition-all"
              style={{
                background: timeLeft === 0 ? 'rgba(255,200,80,0.12)' : 'rgba(139,92,246,0.12)',
                border: `1px solid ${timeLeft === 0 ? 'rgba(255,200,80,0.4)' : 'rgba(139,92,246,0.3)'}`,
                color: timeLeft === 0 ? 'rgba(255,200,80,0.9)' : 'var(--violet)',
              }}
            >
              {phase === 'closing'
                ? '◼ SEAL & CLOSE'
                : `NEXT: ${activePhases[phaseIdx + 1]?.label?.toUpperCase() ?? 'CLOSE'} →`}
            </button>
          </div>
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && (
        <div className="space-y-4">
          <div
            className="rounded-2xl px-5 py-5 space-y-4"
            style={{ background: 'rgba(8,5,18,0.9)', border: '1px solid rgba(255,200,80,0.2)' }}
          >
            <div
              className="text-sm font-medium"
              style={{ color: 'rgba(255,200,80,0.85)', fontFamily: 'Georgia, serif' }}
            >
              Session complete.
              {mode === 'tarot' && ` Path of ${selectedArchetype.name} walked.`}
              {mode === 'middle-pillar' && ' The Middle Pillar is established.'}
            </div>
            {scryingNotes && (
              <div className="space-y-1.5">
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.5)' }}>
                  Notes
                </div>
                <p
                  className="text-sm italic leading-relaxed"
                  style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}
                >
                  {scryingNotes}
                </p>
              </div>
            )}
            {mode === 'tarot' && (
              <div className="text-xs italic" style={{ color: 'rgba(139,92,246,0.5)', fontFamily: 'Georgia, serif' }}>
                {selectedArchetype.meaning}
              </div>
            )}
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(139,92,246,0.5)' }}>
              Record any impressions that continue to surface through the day.
            </p>
          </div>
          <button
            onClick={() => { setPhase('idle'); setScryingNotes(''); setPillarStepIdx(0) }}
            className="w-full py-3 rounded-xl text-xs font-mono tracking-widest transition-all"
            style={{
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.18)',
              color: 'var(--muted)',
            }}
          >
            ↩ NEW SESSION
          </button>
        </div>
      )}
    </div>
  )
}
