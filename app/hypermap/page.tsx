'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import HypermapSliceCanvas from '@/components/hypermap/HypermapSliceCanvas'
import { getDirectionalNeighbor } from '@/lib/hypermap/navigation'
import { buildVistaPrompt, roomLabelsForSeed } from '@/lib/hypermap/procedural'
import { EDGES_TESSERACT, VERTS_TESSERACT } from '@/lib/geometry4d'
import { planeLabel, SO4_PLANES } from '@/lib/manifold'
import { apiFetch } from '@/lib/apiFetch'

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function readSeed(): number {
  if (typeof window === 'undefined') return 1
  const q = new URLSearchParams(window.location.search).get('seed')
  if (q) {
    const n = Number.parseInt(q, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return Math.floor(Math.random() * 0x7fffffff)
}

export default function HypermapPage() {
  const [seed, setSeed] = useState<number | null>(null)
  const [currentVertex, setCurrentVertex] = useState(0)
  const [plane, setPlane] = useState(2)
  const [slice, setSlice] = useState(0)
  const [yaw, setYaw] = useState(0)
  const [vistaUrl, setVistaUrl] = useState<string | null>(null)
  const [vistaStatus, setVistaStatus] = useState<string>('')

  useEffect(() => {
    setSeed(readSeed())
  }, [])

  const roomLabels = useMemo(() => (seed == null ? [] : roomLabelsForSeed(seed)), [seed])

  const vistaPrompt = useMemo(() => {
    if (seed == null) return ''
    return buildVistaPrompt({
      seed,
      vertexIndex: currentVertex,
      plane,
      slice,
      roomName: roomLabels[currentVertex] ?? `Room ${currentVertex}`,
    })
  }, [seed, currentVertex, plane, slice, roomLabels])

  const goPortal = useCallback((next: number) => {
    if (next === currentVertex) return
    setCurrentVertex(next)
    setVistaUrl(null)
  }, [currentVertex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (seed == null) return
      const k = e.key.toLowerCase()
      if (k === 'q') {
        e.preventDefault()
        setSlice((s) => clamp(s - 0.14, -1.2, 1.2))
        return
      }
      if (k === 'e') {
        e.preventDefault()
        setSlice((s) => clamp(s + 0.14, -1.2, 1.2))
        return
      }
      if (k === 'r') {
        e.preventDefault()
        setPlane((p) => (p + 1) % SO4_PLANES.length)
        return
      }
      const dir =
        k === 'w' || k === 'arrowup'
          ? 'w'
          : k === 's' || k === 'arrowdown'
            ? 's'
            : k === 'a' || k === 'arrowleft'
              ? 'a'
              : k === 'd' || k === 'arrowright'
                ? 'd'
                : null
      if (!dir) return
      e.preventDefault()
      const next = getDirectionalNeighbor(
        VERTS_TESSERACT,
        EDGES_TESSERACT,
        currentVertex,
        plane,
        slice,
        yaw,
        dir,
      )
      if (next !== null) goPortal(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [seed, currentVertex, plane, slice, yaw, goPortal])

  const newMap = () => {
    const s = Math.floor(Math.random() * 0x7fffffff)
    setSeed(s)
    setCurrentVertex(0)
    setSlice(0)
    setPlane(2)
    setYaw(0)
    setVistaUrl(null)
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/hypermap?seed=${s}`)
    }
  }

  const renderVista = async () => {
    if (!vistaPrompt) return
    setVistaStatus('Rendering…')
    setVistaUrl(null)
    try {
      const res = await apiFetch('/api/hypermap/vista', {
        method: 'POST',
        body: JSON.stringify({ prompt: vistaPrompt }),
      })
      const data = (await res.json()) as { ok?: boolean; dataUrl?: string; error?: string }
      if (!res.ok) {
        setVistaStatus(data.error || 'Request failed')
        return
      }
      if (data.dataUrl) {
        setVistaUrl(data.dataUrl)
        setVistaStatus('')
      }
    } catch {
      setVistaStatus('Network error')
    }
  }

  if (seed == null) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10" style={{ color: 'var(--muted)' }}>
        Loading map…
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-28 space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
          Slice Atlas
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Procedural 4D tesseract: you see one 2D slice; <strong style={{ color: 'var(--text)' }}>portals</strong> move along
          edges, <strong style={{ color: 'var(--text)' }}>Q / E</strong> shear the W slice, <strong style={{ color: 'var(--text)' }}>R</strong>{' '}
          cycles the rotation plane ({planeLabel(plane)}). Drag on the canvas to turn the view.
        </p>
        <p className="text-xs" style={{ color: 'rgba(150, 160, 190, 0.85)' }}>
          Seed <code className="text-[10px]">{seed}</code>{' '}
          <button type="button" className="underline ml-2 text-[10px]" style={{ color: 'var(--violet)' }} onClick={newMap}>
            New map
          </button>
        </p>
      </header>

      <HypermapSliceCanvas
        currentVertex={currentVertex}
        plane={plane}
        slice={slice}
        roomLabels={roomLabels}
        yaw={yaw}
        onYawDelta={(d) => setYaw((y) => y + d)}
        onPickNeighbor={goPortal}
      />

      <div
        className="rounded-xl px-3 py-2 text-xs font-mono space-y-1"
        style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid var(--border)' }}
      >
        <div>
          Plane {planeLabel(plane)} · slice {slice >= 0 ? '+' : ''}
          {slice.toFixed(2)} · vertex {currentVertex}
        </div>
        <div style={{ color: 'var(--muted)' }}>Room: {roomLabels[currentVertex] ?? '—'}</div>
      </div>

      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
        WASD / arrows: fold toward a portal · Q/E: slice · R: next rotation plane · drag: rotate view
      </p>

      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(12,12,22,0.95)', border: '1px solid rgba(167,139,250,0.2)' }}
      >
        <div className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(167,139,250,0.55)' }}>
          Vista (Nano Banana · Vercel AI Gateway)
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(200,205,230,0.9)' }}>
          Uses <code className="text-[10px]">google/gemini-2.5-flash-image</code> via AI Gateway. Set{' '}
          <code className="text-[10px]">AI_GATEWAY_API_KEY</code> locally; on Vercel, OIDC auth applies automatically.
        </p>
        <button
          type="button"
          onClick={renderVista}
          className="w-full py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.35)', color: 'var(--violet)' }}
        >
          Generate vista for this slice
        </button>
        {vistaStatus ? <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>{vistaStatus}</p> : null}
        {vistaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vistaUrl} alt="Generated vista" className="w-full rounded-xl border border-white/10" />
        ) : null}
      </div>
    </div>
  )
}
