'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Floating luminous particles that drift through the room
// Evokes dust motes in a cathedral beam / fireflies in fog

const MOTE_COUNT = 180
const SPREAD = 8
const HEIGHT_BASE = 0.4
const HEIGHT_RANGE = 5.5

// Deterministic pseudo-random for particle placement
function hash(n: number): number {
  let x = Math.sin(n * 127.1 + n * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export default function DreamMotes({ sliceOffset = 0 }: { sliceOffset?: number }) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities, phases, sizes } = useMemo(() => {
    const pos = new Float32Array(MOTE_COUNT * 3)
    const vel = new Float32Array(MOTE_COUNT * 3)
    const ph = new Float32Array(MOTE_COUNT)
    const sz = new Float32Array(MOTE_COUNT)

    for (let i = 0; i < MOTE_COUNT; i++) {
      // Scatter in cylinder around room
      const angle = hash(i * 3) * Math.PI * 2
      const r = hash(i * 3 + 1) * SPREAD * 0.8
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = HEIGHT_BASE + hash(i * 3 + 2) * HEIGHT_RANGE
      pos[i * 3 + 2] = Math.sin(angle) * r

      // Slow drift velocities
      vel[i * 3] = (hash(i * 7) - 0.5) * 0.003
      vel[i * 3 + 1] = (hash(i * 7 + 1) - 0.3) * 0.002 // slight upward bias
      vel[i * 3 + 2] = (hash(i * 7 + 2) - 0.5) * 0.003

      ph[i] = hash(i * 13) * Math.PI * 2
      sz[i] = 0.02 + hash(i * 17) * 0.06
    }

    return { positions: pos, velocities: vel, phases: ph, sizes: sz }
  }, [])

  const colorsAttr = useMemo(() => {
    const cols = new Float32Array(MOTE_COUNT * 3)
    for (let i = 0; i < MOTE_COUNT; i++) {
      const t = hash(i * 23)
      if (t < 0.4) {
        // Violet motes
        cols[i * 3] = 0.55 + hash(i * 29) * 0.15
        cols[i * 3 + 1] = 0.35 + hash(i * 31) * 0.2
        cols[i * 3 + 2] = 0.85 + hash(i * 37) * 0.15
      } else if (t < 0.7) {
        // Cool blue motes
        cols[i * 3] = 0.3 + hash(i * 41) * 0.15
        cols[i * 3 + 1] = 0.5 + hash(i * 43) * 0.2
        cols[i * 3 + 2] = 0.8 + hash(i * 47) * 0.2
      } else {
        // Warm gold motes (rarer)
        cols[i * 3] = 0.9 + hash(i * 53) * 0.1
        cols[i * 3 + 1] = 0.7 + hash(i * 59) * 0.2
        cols[i * 3 + 2] = 0.2 + hash(i * 61) * 0.15
      }
    }
    return cols
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const geo = pointsRef.current.geometry
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array
    const t = clock.elapsedTime

    // W-depth influences particle behavior
    const wInfluence = Math.abs(sliceOffset) * 0.3

    for (let i = 0; i < MOTE_COUNT; i++) {
      const phase = phases[i]

      // Oscillating drift
      arr[i * 3] += velocities[i * 3] + Math.sin(t * 0.3 + phase) * 0.001
      arr[i * 3 + 1] += velocities[i * 3 + 1] + Math.sin(t * 0.2 + phase * 1.3) * 0.0008
      arr[i * 3 + 2] += velocities[i * 3 + 2] + Math.cos(t * 0.25 + phase * 0.7) * 0.001

      // W-depth makes particles swirl more
      if (wInfluence > 0.05) {
        const swirl = wInfluence * 0.002
        arr[i * 3] += Math.sin(t * 0.5 + phase) * swirl
        arr[i * 3 + 2] += Math.cos(t * 0.5 + phase) * swirl
      }

      // Soft boundary — wrap particles that drift too far
      const dx = arr[i * 3]
      const dz = arr[i * 3 + 2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist > SPREAD) {
        const scale = SPREAD / dist * 0.3
        arr[i * 3] *= scale
        arr[i * 3 + 2] *= scale
      }
      if (arr[i * 3 + 1] > HEIGHT_BASE + HEIGHT_RANGE) {
        arr[i * 3 + 1] = HEIGHT_BASE + 0.1
      }
      if (arr[i * 3 + 1] < HEIGHT_BASE - 0.5) {
        arr[i * 3 + 1] = HEIGHT_BASE + HEIGHT_RANGE - 0.1
      }
    }

    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MOTE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={MOTE_COUNT}
          array={colorsAttr}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.06}
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
