import type { Vec4 } from '@/lib/geometry4d'
import { proj4to3, rotate4D } from '@/lib/geometry4d'
import { SO4_PLANES } from '@/lib/manifold'

export function rotateInSelectedPlane(v: Vec4, angle: number, plane: number): Vec4 {
  const [i, j] = SO4_PLANES[plane] ?? SO4_PLANES[0]
  return rotate4D(v, angle, i, j)
}

export function transformVertex(v: Vec4, plane: number, slice: number, ambient: number): Vec4 {
  let next = rotateInSelectedPlane(v, slice, plane)
  next = rotate4D(next, ambient * 0.16, 0, 3)
  next = rotate4D(next, ambient * 0.11, 1, 2)
  return next
}

/** Relative 3D vector from anchor to index after the same 4D transform (matches Hyperfold puzzle). */
export function relativeProjection(
  verts: Vec4[],
  anchor: number,
  index: number,
  plane: number,
  slice: number,
  ambient: number,
): [number, number, number] {
  const base = transformVertex(verts[anchor], plane, slice, ambient)
  const target = transformVertex(verts[index], plane, slice, ambient)
  return proj4to3(
    [
      target[0] - base[0],
      target[1] - base[1],
      target[2] - base[2],
      target[3] - base[3],
    ],
    4.4,
  )
}
