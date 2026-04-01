'use client'

import { useEffect, useRef } from 'react'
import {
  EDGES_TESSERACT,
  VERTS_TESSERACT,
  proj3to2,
  proj4to3,
  rotate4D,
  type Vec4,
} from '@/lib/geometry4d'

/**
 * Read-only decorative projection: a tesseract rotating in 4D, drawn as 2D lines.
 * No interaction—hyperdimensional "flavor" without 4D controls.
 */
export default function HyperShadowCanvas({
  className,
  size = 112,
}: {
  className?: string
  size?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const w = size
    canvas.width = w * dpr
    canvas.height = w * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${w}px`
    ctx.scale(dpr, dpr)

    const cx = w / 2
    const cy = w / 2
    const scale = w * 0.22
    let raf = 0
    let t = 0

    const verts = VERTS_TESSERACT.map((v) => [...v] as Vec4)

    const tick = () => {
      t += 0.012
      ctx.clearRect(0, 0, w, w)
      ctx.strokeStyle = 'rgba(120, 90, 200, 0.35)'
      ctx.lineWidth = 1
      const rotated = verts.map((v) => {
        let p = rotate4D(v, t * 0.7, 0, 3)
        p = rotate4D(p, t * 0.45, 1, 2)
        return p
      })
      for (const [a, b] of EDGES_TESSERACT) {
        const pa = proj3to2(proj4to3(rotated[a], 3.2), 3.2, scale, cx, cy)
        const pb = proj3to2(proj4to3(rotated[b], 3.2), 3.2, scale, cx, cy)
        ctx.beginPath()
        ctx.moveTo(pa[0], pa[1])
        ctx.lineTo(pb[0], pb[1])
        ctx.stroke()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return <canvas ref={ref} className={className} width={size} height={size} aria-hidden />
}
