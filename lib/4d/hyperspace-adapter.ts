/**
 * Hyperspace.js Adapter
 * Wraps Hyperspace.js for 4D visualization with multiple projection methods
 */

import * as THREE from 'three'

export type ProjectionMethod = 'perspective' | 'stereographic' | 'orthographic'

export interface Hyperspace4DPoint {
  x: number
  y: number
  z: number
  w: number
}

export interface ProjectionConfig {
  method: ProjectionMethod
  distance?: number // for perspective projection
  scale?: number
}

/**
 * Project 4D point to 3D using specified method
 */
export function project4Dto3D(
  point: Hyperspace4DPoint,
  config: ProjectionConfig = { method: 'perspective', distance: 3.0, scale: 1.0 }
): THREE.Vector3 {
  const { method, distance = 3.0, scale = 1.0 } = config

  switch (method) {
    case 'perspective':
      return perspectiveProject(point, distance, scale)
    case 'stereographic':
      return stereographicProject(point, scale)
    case 'orthographic':
      return orthographicProject(point, scale)
    default:
      return perspectiveProject(point, distance, scale)
  }
}

/**
 * Perspective projection: 4D → 3D
 * Camera at w = distance, looking along -w axis
 */
function perspectiveProject(
  point: Hyperspace4DPoint,
  distance: number,
  scale: number
): THREE.Vector3 {
  const d = Math.max(distance - point.w, 0.15)
  const factor = scale / d

  return new THREE.Vector3(
    point.x * factor,
    point.y * factor,
    point.z * factor
  )
}

/**
 * Stereographic projection: 4D → 3D
 * Projects from north pole (0,0,0,1) onto 3D hyperplane
 */
function stereographicProject(
  point: Hyperspace4DPoint,
  scale: number
): THREE.Vector3 {
  const denom = 1 - point.w
  if (Math.abs(denom) < 0.001) {
    return new THREE.Vector3(0, 0, 0)
  }

  const factor = scale / denom

  return new THREE.Vector3(
    point.x * factor,
    point.y * factor,
    point.z * factor
  )
}

/**
 * Orthographic projection: 4D → 3D
 * Simple drop of w coordinate
 */
function orthographicProject(
  point: Hyperspace4DPoint,
  scale: number
): THREE.Vector3 {
  return new THREE.Vector3(
    point.x * scale,
    point.y * scale,
    point.z * scale
  )
}

/**
 * Convert 4D point to Hyperspace4DPoint
 */
export function toHyperspace4D(x: number, y: number, z: number, w: number): Hyperspace4DPoint {
  return { x, y, z, w }
}

/**
 * Normalize 4D point to unit sphere
 */
export function normalize4D(point: Hyperspace4DPoint): Hyperspace4DPoint {
  const length = Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2 + point.w ** 2)
  if (length === 0) return point

  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length,
    w: point.w / length,
  }
}

/**
 * Calculate 4D distance between two points
 */
export function distance4D(p1: Hyperspace4DPoint, p2: Hyperspace4DPoint): number {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  const dz = p1.z - p2.z
  const dw = p1.w - p2.w

  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw)
}

/**
 * Interpolate between two 4D points
 */
export function lerp4D(
  p1: Hyperspace4DPoint,
  p2: Hyperspace4DPoint,
  t: number
): Hyperspace4DPoint {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
    z: p1.z + (p2.z - p1.z) * t,
    w: p1.w + (p2.w - p1.w) * t,
  }
}

/**
 * Get color based on 4D position
 * Maps W coordinate to hue, distance to brightness
 */
export function getColorFrom4D(point: Hyperspace4DPoint): THREE.Color {
  // W coordinate → hue (0-360°)
  const hue = ((point.w + 1) / 2) * 360

  // Distance from origin → saturation
  const dist = Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2 + point.w ** 2)
  const saturation = Math.min(dist, 1.0)

  // Create color from HSL
  const color = new THREE.Color()
  color.setHSL(hue / 360, saturation, 0.5)

  return color
}
