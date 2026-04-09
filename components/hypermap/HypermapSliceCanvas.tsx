'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { Vec4 } from '@/lib/geometry4d'
import { EDGES_TESSERACT, VERTS_TESSERACT, proj3to2 } from '@/lib/geometry4d'
import { buildAdjacency } from '@/lib/manifold'
import { relativeProjection } from '@/lib/hypermap/projection'

/**
 * proj4→3 yields O(1) coordinates; without a large screen scale, every vertex
 * collapses to the center (only "You" was visible). Match puzzle world feel ~ROOM_SCALE*35.
 */
function sliceCanvasZoom(canvasWidth: number): number {
  return 520 * (canvasWidth / 400)
}

interface HypermapSliceCanvasProps {
  currentVertex: number
  plane: number
  slice: number
  roomLabels: string[]
  yaw: number
  onYawDelta: (delta: number) => void
  onPickNeighbor: (neighborIndex: number) => void
}

export default function HypermapSliceCanvas({
  currentVertex,
  plane,
  slice,
  roomLabels,
  yaw,
  onYawDelta,
  onPickNeighbor,
}: HypermapSliceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const neighbors = useRef<number[]>([])
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    lastX: number
    dragging: boolean
  } | null>(null)

  const draw = useCallback(
    (ambient: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2
      const scale = sliceCanvasZoom(w)
      const verts = VERTS_TESSERACT as Vec4[]
      const adj = buildAdjacency(verts, EDGES_TESSERACT)
      const nbr = adj.get(currentVertex) ?? []
      neighbors.current = nbr

      const cos = Math.cos(-yaw)
      const sin = Math.sin(-yaw)

      const toScreen = (p3: [number, number, number]): [number, number] => {
        let [sx, sy] = proj3to2(p3, 3.6, scale, cx, cy)
        const dx = sx - cx
        const dz = sy - cy
        sx = cx + dx * cos - dz * sin
        sy = cy + dx * sin + dz * cos
        return [sx, sy]
      }

      ctx.fillStyle = '#050810'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(120, 175, 235, 0.55)'
      ctx.lineWidth = 1.5
      for (const [a, b] of EDGES_TESSERACT) {
        const pa = relativeProjection(verts, currentVertex, a, plane, slice, ambient)
        const pb = relativeProjection(verts, currentVertex, b, plane, slice, ambient)
        const [xa, ya] = toScreen(pa)
        const [xb, yb] = toScreen(pb)
        ctx.beginPath()
        ctx.moveTo(xa, ya)
        ctx.lineTo(xb, yb)
        ctx.stroke()
      }

      for (const i of nbr) {
        const p3 = relativeProjection(verts, currentVertex, i, plane, slice, ambient)
        const [sx, sy] = toScreen(p3)
        ctx.beginPath()
        ctx.arc(sx, sy, 18, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(124, 87, 255, 0.35)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(210, 190, 255, 0.85)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.fillStyle = 'rgba(200, 210, 240, 0.85)'
        ctx.font = '10px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(roomLabels[i] ?? `${i}`, sx, sy + 4)
      }

      ctx.beginPath()
      ctx.arc(cx, cy, 10, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fill()
      ctx.fillStyle = 'rgba(30, 40, 60, 0.95)'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('You', cx, cy + 4)
    },
    [currentVertex, plane, slice, roomLabels, yaw],
  )

  useEffect(() => {
    let stopped = false
    let raf = 0
    const tick = () => {
      if (stopped) return
      draw(performance.now() * 0.001)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [draw])

  const pickPortalAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = clientX - rect.left
    const sy = clientY - rect.top
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = sx * scaleX
    const y = sy * scaleY
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const scale = sliceCanvasZoom(canvas.width)
    const cos = Math.cos(-yaw)
    const sin = Math.sin(-yaw)
    const verts = VERTS_TESSERACT as Vec4[]
    const ambient = performance.now() * 0.001

    const toScreen = (p3: [number, number, number]): [number, number] => {
      let [px, py] = proj3to2(p3, 3.6, scale, cx, cy)
      const dx = px - cx
      const dz = py - cy
      px = cx + dx * cos - dz * sin
      py = cy + dx * sin + dz * cos
      return [px, py]
    }

    let best: number | null = null
    let bestD = 40
    for (const i of neighbors.current) {
      const p3 = relativeProjection(verts, currentVertex, i, plane, slice, ambient)
      const [px, py] = toScreen(p3)
      const d = Math.hypot(px - x, py - y)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    if (best !== null) onPickNeighbor(best)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      dragging: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY)
    if (moved > 8) d.dragging = true
    if (d.dragging) {
      const dx = e.clientX - d.lastX
      d.lastX = e.clientX
      onYawDelta(dx * 0.006)
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (d && !d.dragging) {
      pickPortalAt(e.clientX, e.clientY)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={420}
      className="w-full max-w-xl rounded-2xl cursor-crosshair touch-none"
      style={{ background: '#050810', border: '1px solid var(--border)' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  )
}
