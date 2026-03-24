'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Procedural sacred geometry sigil on the room floor
// Each vertex in the manifold gets a unique sigil derived from its index
// Occult aesthetic: concentric circles, star polygons, radiating lines, rune marks

function hash(n: number): number {
  let x = Math.sin(n * 127.1 + n * 311.7) * 43758.5453
  return x - Math.floor(x)
}

function generateSigilGeometry(vertexIndex: number): Float32Array {
  const segments: number[] = []
  const seed = vertexIndex * 71 + 37

  // Parameters seeded by vertex
  const numRings = 2 + Math.floor(hash(seed) * 3)           // 2-4 concentric rings
  const starPoints = 3 + Math.floor(hash(seed + 1) * 6)     // 3-8 pointed star
  const starSkip = 1 + Math.floor(hash(seed + 2) * (starPoints / 2)) // star winding
  const numSpokes = 4 + Math.floor(hash(seed + 3) * 8)      // 4-12 radiating lines
  const hasInnerCross = hash(seed + 4) > 0.4
  const hasRuneMarks = hash(seed + 5) > 0.3
  const baseRadius = 2.8
  const rotation = hash(seed + 6) * Math.PI * 2

  // Helper: add line segment
  const addLine = (x1: number, z1: number, x2: number, z2: number) => {
    segments.push(x1, 0.05, z1, x2, 0.05, z2)
  }

  // Helper: add circle (approximated with line segments)
  const addCircle = (cx: number, cz: number, r: number, segs = 48) => {
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * Math.PI * 2 + rotation
      const a2 = ((i + 1) / segs) * Math.PI * 2 + rotation
      addLine(
        cx + Math.cos(a1) * r, cz + Math.sin(a1) * r,
        cx + Math.cos(a2) * r, cz + Math.sin(a2) * r,
      )
    }
  }

  // Concentric rings
  for (let ring = 0; ring < numRings; ring++) {
    const t = (ring + 1) / (numRings + 1)
    const r = baseRadius * t * 0.9
    addCircle(0, 0, r, 48 + ring * 8)
  }

  // Star polygon {starPoints/starSkip}
  const starRadius = baseRadius * 0.7
  for (let i = 0; i < starPoints; i++) {
    const a1 = (i / starPoints) * Math.PI * 2 + rotation
    const next = (i + starSkip) % starPoints
    const a2 = (next / starPoints) * Math.PI * 2 + rotation
    addLine(
      Math.cos(a1) * starRadius, Math.sin(a1) * starRadius,
      Math.cos(a2) * starRadius, Math.sin(a2) * starRadius,
    )
  }

  // Radiating spokes
  const innerSpokeR = baseRadius * 0.15
  const outerSpokeR = baseRadius * 0.85
  for (let i = 0; i < numSpokes; i++) {
    const angle = (i / numSpokes) * Math.PI * 2 + rotation
    addLine(
      Math.cos(angle) * innerSpokeR, Math.sin(angle) * innerSpokeR,
      Math.cos(angle) * outerSpokeR, Math.sin(angle) * outerSpokeR,
    )
  }

  // Inner cross (if seeded)
  if (hasInnerCross) {
    const crossR = baseRadius * 0.2
    addLine(-crossR, 0, crossR, 0)
    addLine(0, -crossR, 0, crossR)
    // Diagonal cross
    const d = crossR * 0.7
    addLine(-d, -d, d, d)
    addLine(-d, d, d, -d)
  }

  // Rune marks at cardinal points (if seeded)
  if (hasRuneMarks) {
    const markR = baseRadius * 0.9
    const markSize = 0.18
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + rotation + Math.PI / 4
      const cx = Math.cos(angle) * markR
      const cz = Math.sin(angle) * markR
      // Small tick marks
      const perpAngle = angle + Math.PI / 2
      addLine(
        cx - Math.cos(perpAngle) * markSize, cz - Math.sin(perpAngle) * markSize,
        cx + Math.cos(perpAngle) * markSize, cz + Math.sin(perpAngle) * markSize,
      )
      // Dot-line extending outward
      const ext = markSize * 1.5
      addLine(
        cx, cz,
        cx + Math.cos(angle) * ext, cz + Math.sin(angle) * ext,
      )
    }
  }

  // Outer boundary ring
  addCircle(0, 0, baseRadius * 0.92, 64)

  return new Float32Array(segments)
}

interface SigilFloorProps {
  vertexIndex: number
  discovered?: boolean
  sliceOffset?: number
}

export default function SigilFloor({ vertexIndex, discovered = false, sliceOffset = 0 }: SigilFloorProps) {
  const groupRef = useRef<THREE.Group>(null)
  const geomRef = useRef<THREE.BufferGeometry>(null)

  const positions = useMemo(() => generateSigilGeometry(vertexIndex), [vertexIndex])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    // Slow rotation — discovered sigils spin faster
    const speed = discovered ? 0.04 : 0.015
    groupRef.current.rotation.y = t * speed

    // Subtle scale pulse
    const pulse = 1 + Math.sin(t * 0.8) * 0.015
    groupRef.current.scale.setScalar(pulse)
  })

  // Color shifts with W-depth
  const hue = 0.72 + sliceOffset * 0.08 // violet → blue as W shifts
  const color = new THREE.Color().setHSL(hue, 0.5, discovered ? 0.55 : 0.35)
  const opacity = discovered ? 0.28 : 0.12

  return (
    <group ref={groupRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <lineSegments>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}
