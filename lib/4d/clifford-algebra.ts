/**
 * Clifford Algebra for 4D Rotations
 * Uses rotor-based transformations for efficient 4D rotations
 * More elegant and efficient than matrix rotations
 */

import type { Hyperspace4DPoint } from './hyperspace-adapter'

/**
 * Rotor: represents a rotation in 4D space using Clifford algebra
 * Stored as: scalar + e12*a + e13*b + e14*c + e23*d + e24*e + e34*f
 * (6 bivector components for 4D)
 */
export interface Rotor {
  scalar: number
  e12: number // XY plane
  e13: number // XZ plane
  e14: number // XW plane
  e23: number // YZ plane
  e24: number // YW plane
  e34: number // ZW plane
}

/**
 * Create a rotor from angle and plane
 * Plane is specified by two axis indices (0=X, 1=Y, 2=Z, 3=W)
 */
export function createRotor(angle: number, axis1: number, axis2: number): Rotor {
  const halfAngle = angle / 2
  const s = Math.sin(halfAngle)
  const c = Math.cos(halfAngle)

  const rotor: Rotor = {
    scalar: c,
    e12: 0,
    e13: 0,
    e14: 0,
    e23: 0,
    e24: 0,
    e34: 0,
  }

  // Set the appropriate bivector component
  const key = getBivectorKey(axis1, axis2)
  if (key in rotor) {
    ;(rotor as any)[key] = s
  }

  return rotor
}

/**
 * Get bivector key from two axis indices
 */
function getBivectorKey(a: number, b: number): keyof Rotor {
  if (a > b) [a, b] = [b, a]

  if (a === 0 && b === 1) return 'e12'
  if (a === 0 && b === 2) return 'e13'
  if (a === 0 && b === 3) return 'e14'
  if (a === 1 && b === 2) return 'e23'
  if (a === 1 && b === 3) return 'e24'
  if (a === 2 && b === 3) return 'e34'

  return 'scalar' // fallback
}

/**
 * Compose two rotors (multiply them)
 * R1 * R2 represents applying R2 then R1
 */
export function composeRotors(r1: Rotor, r2: Rotor): Rotor {
  return {
    scalar:
      r1.scalar * r2.scalar -
      r1.e12 * r2.e12 -
      r1.e13 * r2.e13 -
      r1.e14 * r2.e14 -
      r1.e23 * r2.e23 -
      r1.e24 * r2.e24 -
      r1.e34 * r2.e34,

    e12:
      r1.scalar * r2.e12 +
      r1.e12 * r2.scalar +
      r1.e13 * r2.e23 +
      r1.e23 * r2.e13 -
      r1.e14 * r2.e24 -
      r1.e24 * r2.e14 +
      r1.e34 * r2.e34,

    e13:
      r1.scalar * r2.e13 -
      r1.e12 * r2.e23 +
      r1.e13 * r2.scalar +
      r1.e23 * r2.e12 -
      r1.e14 * r2.e34 +
      r1.e24 * r2.e24 -
      r1.e34 * r2.e14,

    e14:
      r1.scalar * r2.e14 +
      r1.e12 * r2.e24 -
      r1.e13 * r2.e34 +
      r1.e14 * r2.scalar +
      r1.e23 * r2.e23 -
      r1.e24 * r2.e13 -
      r1.e34 * r2.e12,

    e23:
      r1.scalar * r2.e23 +
      r1.e12 * r2.e13 -
      r1.e13 * r2.e12 +
      r1.e23 * r2.scalar +
      r1.e14 * r2.e34 -
      r1.e24 * r2.e14 -
      r1.e34 * r2.e24,

    e24:
      r1.scalar * r2.e24 +
      r1.e12 * r2.e14 +
      r1.e14 * r2.e12 -
      r1.e23 * r2.e34 +
      r1.e24 * r2.scalar -
      r1.e13 * r2.e34 -
      r1.e34 * r2.e13,

    e34:
      r1.scalar * r2.e34 +
      r1.e13 * r2.e14 -
      r1.e14 * r2.e13 +
      r1.e23 * r2.e24 -
      r1.e24 * r2.e23 +
      r1.e34 * r2.scalar -
      r1.e12 * r2.e12,
  }
}

/**
 * Apply rotor to a 4D point
 * Transforms point using R * point * R^-1
 */
export function applyRotor(point: Hyperspace4DPoint, rotor: Rotor): Hyperspace4DPoint {
  // Normalize rotor
  const norm = Math.sqrt(
    rotor.scalar ** 2 +
      rotor.e12 ** 2 +
      rotor.e13 ** 2 +
      rotor.e14 ** 2 +
      rotor.e23 ** 2 +
      rotor.e24 ** 2 +
      rotor.e34 ** 2
  )

  const r = {
    scalar: rotor.scalar / norm,
    e12: rotor.e12 / norm,
    e13: rotor.e13 / norm,
    e14: rotor.e14 / norm,
    e23: rotor.e23 / norm,
    e24: rotor.e24 / norm,
    e34: rotor.e34 / norm,
  }

  // Inverse rotor (conjugate for unit rotors)
  const rInv = {
    scalar: r.scalar,
    e12: -r.e12,
    e13: -r.e13,
    e14: -r.e14,
    e23: -r.e23,
    e24: -r.e24,
    e34: -r.e34,
  }

  // Convert point to rotor form (scalar=0, bivectors=point coords)
  const p: Rotor = {
    scalar: 0,
    e12: point.x,
    e13: point.y,
    e14: point.z,
    e23: point.w,
    e24: 0,
    e34: 0,
  }

  // Compute R * P * R^-1
  const rp = composeRotors(r, p)
  const result = composeRotors(rp, rInv)

  return {
    x: result.e12,
    y: result.e13,
    z: result.e14,
    w: result.e23,
  }
}

/**
 * Create a rotor that rotates in multiple planes simultaneously
 * Useful for smooth, natural-looking 4D rotations
 */
export function createMultiPlaneRotor(
  angles: { xy?: number; xz?: number; xw?: number; yz?: number; yw?: number; zw?: number }
): Rotor {
  let result: Rotor = {
    scalar: 1,
    e12: 0,
    e13: 0,
    e14: 0,
    e23: 0,
    e24: 0,
    e34: 0,
  }

  if (angles.xy) result = composeRotors(result, createRotor(angles.xy, 0, 1))
  if (angles.xz) result = composeRotors(result, createRotor(angles.xz, 0, 2))
  if (angles.xw) result = composeRotors(result, createRotor(angles.xw, 0, 3))
  if (angles.yz) result = composeRotors(result, createRotor(angles.yz, 1, 2))
  if (angles.yw) result = composeRotors(result, createRotor(angles.yw, 1, 3))
  if (angles.zw) result = composeRotors(result, createRotor(angles.zw, 2, 3))

  return result
}

/**
 * Interpolate between two rotors (slerp)
 */
export function slerpRotor(r1: Rotor, r2: Rotor, t: number): Rotor {
  // Compute dot product
  const dot =
    r1.scalar * r2.scalar +
    r1.e12 * r2.e12 +
    r1.e13 * r2.e13 +
    r1.e14 * r2.e14 +
    r1.e23 * r2.e23 +
    r1.e24 * r2.e24 +
    r1.e34 * r2.e34

  // Clamp dot product
  const clampedDot = Math.max(-1, Math.min(1, dot))
  const theta = Math.acos(clampedDot)
  const sinTheta = Math.sin(theta)

  if (Math.abs(sinTheta) < 0.001) {
    // Fallback to linear interpolation if rotors are nearly parallel
    return {
      scalar: r1.scalar + (r2.scalar - r1.scalar) * t,
      e12: r1.e12 + (r2.e12 - r1.e12) * t,
      e13: r1.e13 + (r2.e13 - r1.e13) * t,
      e14: r1.e14 + (r2.e14 - r1.e14) * t,
      e23: r1.e23 + (r2.e23 - r1.e23) * t,
      e24: r1.e24 + (r2.e24 - r1.e24) * t,
      e34: r1.e34 + (r2.e34 - r1.e34) * t,
    }
  }

  const w1 = Math.sin((1 - t) * theta) / sinTheta
  const w2 = Math.sin(t * theta) / sinTheta

  return {
    scalar: w1 * r1.scalar + w2 * r2.scalar,
    e12: w1 * r1.e12 + w2 * r2.e12,
    e13: w1 * r1.e13 + w2 * r2.e13,
    e14: w1 * r1.e14 + w2 * r2.e14,
    e23: w1 * r1.e23 + w2 * r2.e23,
    e24: w1 * r1.e24 + w2 * r2.e24,
    e34: w1 * r1.e34 + w2 * r2.e34,
  }
}
