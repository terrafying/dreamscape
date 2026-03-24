'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import PuzzleDebugPanel from '@/components/PuzzleDebugPanel'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import * as Tone from 'tone'
import DreamMotes from '@/components/puzzle/DreamMotes'
import SigilFloor from '@/components/puzzle/SigilFloor'
import {
  type Vec4,
  rotate4D,
  proj4to3,
  VERTS_5CELL,
  EDGES_5CELL,
  VERTS_TESSERACT,
  EDGES_TESSERACT,
  VERTS_16,
  EDGES_16,
  VERTS_24,
  EDGES_24,
} from '@/lib/geometry4d'
import {
  buildAdjacency,
  buildFaces,
  getGuidance,
  manifoldDistance,
  planeLabel,
  type Guidance,
} from '@/lib/manifold'
import {
  quantizeFreq,
  discoveryNeutralThirds,
  type TuningMode,
  type ScaleSet,
} from '@/lib/tuning'

interface PolytopeConfig {
  name: string
  subtitle: string
  verts: Vec4[]
  edges: [number, number][]
  color: string
  notes: string[]
}

const POLYTOPES: PolytopeConfig[] = [
  {
    name: 'Pentachoron',
    subtitle: '5 vertices · 10 edges',
    verts: VERTS_5CELL,
    edges: EDGES_5CELL,
    color: '#40c8ff',
    notes: ['C3', 'Eb3', 'G3'],
  },
  {
    name: 'Tesseract',
    subtitle: '16 vertices · 32 edges',
    verts: VERTS_TESSERACT,
    edges: EDGES_TESSERACT,
    color: '#c040ff',
    notes: ['F2', 'Ab2', 'C3', 'Eb3'],
  },
  {
    name: '16-Cell',
    subtitle: '8 vertices · 24 edges',
    verts: VERTS_16,
    edges: EDGES_16,
    color: '#ff8030',
    notes: ['Bb2', 'Db3', 'F3', 'Ab3'],
  },
  {
    name: '24-Cell',
    subtitle: '24 vertices · 96 edges',
    verts: VERTS_24,
    edges: EDGES_24,
    color: '#ffd700',
    notes: ['D3', 'F3', 'A3', 'C4', 'E4'],
  },
]

const NAV_VERTS = VERTS_TESSERACT
const NAV_EDGES = EDGES_TESSERACT
const TARGET_VERTICES = [0, 3, 12, 15]
const SO4_PLANES: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
const ROOM_RADIUS = 4.3
const ROOM_HEIGHT = 3.4
const ROOM_SCALE = 2.8
const FOLD_MS = 760
type BasicWave = 'sine' | 'triangle' | 'square' | 'sawtooth'

type AudioRig = {
  drone: Tone.Oscillator
  droneGain: Tone.Gain
  reverb: Tone.Freeverb
  synth: Tone.PolySynth
  finale: Tone.PolySynth
  arpSynth: Tone.Synth
  arpLoop: Tone.Loop | null
  arpNotes: number[]
  arpIndex: number
}

let audioRig: AudioRig | null = null
let audioStarted = false

function cleanupAudio() {
  if (!audioRig) return
  Tone.Transport.stop()
  if (audioRig.arpLoop) { audioRig.arpLoop.stop(); audioRig.arpLoop.dispose() }
  audioRig.arpSynth.dispose()
  audioRig.drone.stop()
  audioRig.drone.dispose()
  audioRig.droneGain.dispose()
  audioRig.synth.dispose()
  audioRig.finale.dispose()
  audioRig.reverb.dispose()
  audioRig = null
  audioStarted = false
}

function clampNum(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function getAudioPrefs() {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('puzzle_audio') : null
  const data = raw ? JSON.parse(raw) : {}
  return {
    droneGain: clampNum(data.droneGain ?? 0.018, 0, 0.15),
    synthVolume: clampNum(data.synthVolume ?? -22, -40, -6),
    finaleVolume: clampNum(data.finaleVolume ?? -18, -40, -6),
    roomSize: clampNum(data.roomSize ?? 0.92, 0, 0.99),
    dampening: clampNum(data.dampening ?? 1200, 100, 3000),
    droneType: (data.droneType ?? 'sine') as BasicWave,
    synthType: (data.synthType ?? 'triangle') as BasicWave,
    tuningMode: (data.tuningMode ?? '31edo') as TuningMode,
    refFreq: clampNum(data.refFreq ?? 220, 220, 440),
    scaleSet: (data.scaleSet ?? 'neutral') as ScaleSet,
  }
}

function setAudioPrefs(prefs: Partial<ReturnType<typeof getAudioPrefs>>) {
  const current = getAudioPrefs()
  const next = { ...current, ...prefs }
  if (typeof window !== 'undefined') localStorage.setItem('puzzle_audio', JSON.stringify(next))
  if (!audioRig) return
  audioRig.droneGain.gain.rampTo(next.droneGain, 0.2)
  audioRig.synth.volume.rampTo(next.synthVolume, 0.2)
  audioRig.finale.volume.rampTo(next.finaleVolume, 0.2)
}

function initAudio() {
  if (audioStarted) return
  audioStarted = true
  Tone.start()
  const user = getAudioPrefs()
  const reverb = new Tone.Freeverb({ roomSize: user.roomSize, dampening: user.dampening }).toDestination()
  const droneGain = new Tone.Gain(user.droneGain).connect(reverb)
  const drone = new Tone.Oscillator(55, user.droneType).connect(droneGain)
  drone.start()
  const synth = new Tone.PolySynth(Tone.Synth).connect(reverb)
  synth.set({ oscillator: { type: user.synthType }, envelope: { attack: 0.18, decay: 1.4, sustain: 0.45, release: 4.4 } })
  synth.volume.value = user.synthVolume
  const finale = new Tone.PolySynth(Tone.Synth).connect(reverb)
  finale.set({ oscillator: { type: user.synthType }, envelope: { attack: 0.25, decay: 2.2, sustain: 0.55, release: 7 } })
  finale.volume.value = user.finaleVolume

  const arpSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.08, decay: 0.6, sustain: 0.15, release: 2.0 },
  }).connect(reverb)
  arpSynth.volume.value = -28

  const baseArpNotes = buildArpNotes(user.refFreq, 0, 3)
  const rig: AudioRig = {
    drone, droneGain, reverb, synth, finale,
    arpSynth, arpLoop: null, arpNotes: baseArpNotes, arpIndex: 0,
  }

  rig.arpLoop = new Tone.Loop((time) => {
    if (!rig.arpNotes.length) return
    const freq = rig.arpNotes[rig.arpIndex % rig.arpNotes.length]
    rig.arpSynth.triggerAttackRelease(freq, '8n', time)
    rig.arpIndex = (rig.arpIndex + 1) % rig.arpNotes.length
  }, '4n')
  rig.arpLoop.start(0)
  Tone.Transport.bpm.value = 48
  Tone.Transport.start()

  audioRig = rig
}

function buildArpNotes(refFreq: number, vertexIndex: number, discoveredCount: number): number[] {
  const prefs = getAudioPrefs()
  const baseSteps = [0, 5, 10, 13, 18]
  const extraSteps = [23, 26, 31, 36, 41]
  const vertexOffset = (vertexIndex % 4) * 2
  const numNotes = 3 + Math.min(discoveredCount, 4)
  const allSteps = [...baseSteps, ...extraSteps.slice(0, discoveredCount)]
  const notes: number[] = []
  for (let i = 0; i < numNotes && i < allSteps.length; i++) {
    const step = allSteps[i] + vertexOffset
    const hz = refFreq * Math.pow(2, step / 31)
    notes.push(prefs.tuningMode === '31edo' ? quantizeFreq(hz, refFreq) : hz)
  }
  return notes
}

function updateArpeggio(vertexIndex: number, discoveredCount: number) {
  if (!audioRig) return
  const prefs = getAudioPrefs()
  audioRig.arpNotes = buildArpNotes(prefs.refFreq, vertexIndex, discoveredCount)
  audioRig.arpIndex = 0
}

function updateDrone(proximity: number, dissonance: number) {
  if (!audioRig) return
  const prefs = getAudioPrefs()
  const baseHz = 58 + proximity * 80 + dissonance * 16
  const finalHz = prefs.tuningMode === '31edo' ? quantizeFreq(baseHz, prefs.refFreq) : baseHz
  audioRig.drone.frequency.rampTo(finalHz, 0.4)
  const maxGain = Math.min(prefs.droneGain * 1.5, 0.06)
  audioRig.droneGain.gain.rampTo(prefs.droneGain * 0.6 + proximity * maxGain, 0.5)
}

function playDiscovery(notes: string[]) {
  if (!audioRig) return
  audioRig.synth.triggerAttackRelease(notes, '2n')
}

function playDiscoveryHz(frequencies: number[]) {
  if (!audioRig) return
  audioRig.synth.triggerAttackRelease(frequencies, '2n')
}

function playFoldCue(step: number) {
  if (!audioRig) return
  const prefs = getAudioPrefs()
  const baseHz = prefs.refFreq * (1 + step * 0.04)
  if (prefs.tuningMode === '31edo') {
    audioRig.synth.triggerAttackRelease(discoveryNeutralThirds(baseHz, prefs.refFreq), '8n')
    return
  }
  audioRig.synth.triggerAttackRelease(['C3', 'G3', 'Bb3'], '8n')
}

function playFinale() {
  if (!audioRig) return
  audioRig.finale.triggerAttackRelease(['D3', 'F3', 'A3', 'C4', 'E4', 'G4', 'B4'], '2m')
}

function rotateInSelectedPlane(v: Vec4, angle: number, plane: number): Vec4 {
  const [i, j] = SO4_PLANES[plane] ?? SO4_PLANES[0]
  return rotate4D(v, angle, i, j)
}

function transformVertex(v: Vec4, plane: number, slice: number, ambient: number): Vec4 {
  let next = rotateInSelectedPlane(v, slice, plane)
  next = rotate4D(next, ambient * 0.16, 0, 3)
  next = rotate4D(next, ambient * 0.11, 1, 2)
  return next
}

function relativeProjection(verts: Vec4[], anchor: number, index: number, plane: number, slice: number, ambient: number) {
  const base = transformVertex(verts[anchor], plane, slice, ambient)
  const target = transformVertex(verts[index], plane, slice, ambient)
  return proj4to3([
    target[0] - base[0],
    target[1] - base[1],
    target[2] - base[2],
    target[3] - base[3],
  ], 4.4)
}

function mixProjection(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

function projectToControlPlane(v: [number, number, number], yaw: number): [number, number] {
  const cos = Math.cos(-yaw)
  const sin = Math.sin(-yaw)
  const x = v[0] * cos - v[2] * sin
  const z = v[0] * sin + v[2] * cos
  const len = Math.hypot(x, z) || 1
  return [x / len, -z / len]
}

function getDirectionalNeighbor(current: number, plane: number, slice: number, yaw: number, direction: 'w' | 'a' | 's' | 'd') {
  const neighbors = buildAdjacency(NAV_VERTS, NAV_EDGES).get(current) ?? []
  if (neighbors.length === 0) return null
  const targets: Record<'w' | 'a' | 's' | 'd', [number, number]> = {
    w: [0, 1],
    a: [-1, 0],
    s: [0, -1],
    d: [1, 0],
  }
  const wanted = targets[direction]
  let best = neighbors[0]
  let bestScore = -Infinity
  for (const neighbor of neighbors) {
    const rel = normalize3(relativeProjection(NAV_VERTS, current, neighbor, plane, slice, 0))
    const [sx, sy] = projectToControlPlane(rel, yaw)
    const score = sx * wanted[0] + sy * wanted[1]
    if (score > bestScore) {
      bestScore = score
      best = neighbor
    }
  }
  return best
}

function RoomCamera({ lookRef }: { lookRef: React.MutableRefObject<{ yaw: number; pitch: number }> }) {
  const { camera } = useThree()
  useFrame(() => {
    camera.position.set(0, 1.12, 0)
    const euler = new THREE.Euler(lookRef.current.pitch, lookRef.current.yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)
  })
  return null
}

function Stars() {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)

  useEffect(() => {
    if (!geomRef.current) return
    const count = 480
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const r = 20 + Math.random() * 80
      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = 12 + Math.random() * 50
      positions[i * 3 + 2] = Math.sin(theta) * r

      const temp = Math.random()
      if (temp < 0.3) {
        colors[i * 3] = 0.5; colors[i * 3 + 1] = 0.55; colors[i * 3 + 2] = 0.8
      } else if (temp < 0.6) {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.5; colors[i * 3 + 2] = 0.9
      } else {
        colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.75; colors[i * 3 + 2] = 0.6
      }
    }
    geomRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geomRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }, [])

  useFrame(({ clock }) => {
    if (!matRef.current) return
    matRef.current.opacity = 0.35 + Math.sin(clock.elapsedTime * 0.3) * 0.1
  })

  return (
    <points>
      <bufferGeometry ref={geomRef} />
      <pointsMaterial
        ref={matRef}
        vertexColors
        size={0.1}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function RoomShell({ foldProgress, sliceOffset = 0 }: { foldProgress: number; sliceOffset?: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const breathRef = useRef(0)

  const wHue = 0.72 + sliceOffset * 0.06
  const wColor = new THREE.Color().setHSL(wHue, 0.3, 0.25)

  useFrame(({ clock }) => {
    breathRef.current = clock.elapsedTime
    if (!groupRef.current) return
  })

  const breath = Math.sin((breathRef.current || 0) * 0.4) * 0.03
  const pulse = 1 + Math.sin(foldProgress * Math.PI) * 0.08 + breath

  return (
    <group ref={groupRef}>
      {/* Room boundary — soft wireframe shell */}
      <mesh position={[0, ROOM_HEIGHT / 2, 0]} scale={[pulse, 1, pulse]}>
        <boxGeometry args={[ROOM_RADIUS * 2, ROOM_HEIGHT, ROOM_RADIUS * 2]} />
        <meshBasicMaterial color={wColor} wireframe transparent opacity={0.14} />
      </mesh>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[ROOM_RADIUS, 64]} />
        <meshStandardMaterial color="#050a12" roughness={0.98} metalness={0.02} />
      </mesh>
      {/* Inner glow ring — pulses with breath and fold */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[ROOM_RADIUS * 0.7, ROOM_RADIUS * 0.74, 64]} />
        <meshBasicMaterial color="#7c57ff" transparent opacity={0.06 + foldProgress * 0.14 + breath * 0.5} depthWrite={false} />
      </mesh>
      {/* Outer glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.033, 0]}>
        <ringGeometry args={[ROOM_RADIUS * 0.88, ROOM_RADIUS * 0.92, 64]} />
        <meshBasicMaterial color="#4060a0" transparent opacity={0.04 + breath * 0.3} depthWrite={false} />
      </mesh>
      {/* Ceiling glow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT - 0.1, 0]}>
        <circleGeometry args={[ROOM_RADIUS * 0.3, 32]} />
        <meshBasicMaterial color="#8060c0" transparent opacity={0.03 + foldProgress * 0.04} depthWrite={false} />
      </mesh>
    </group>
  )
}

function SliceLattice({
  currentVertex,
  nextVertex,
  foldProgress,
  plane,
  slice,
}: {
  currentVertex: number
  nextVertex: number | null
  foldProgress: number
  plane: number
  slice: number
}) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const posArr = useMemo(() => new Float32Array(NAV_EDGES.length * 6), [])
  useFrame(({ clock }) => {
    if (!geomRef.current) return
    const ambient = clock.elapsedTime
    for (let i = 0; i < NAV_EDGES.length; i++) {
      const [a, b] = NAV_EDGES[i]
      const pa = relativeProjection(NAV_VERTS, currentVertex, a, plane, slice, ambient)
      const pb = relativeProjection(NAV_VERTS, currentVertex, b, plane, slice, ambient)
      const ma = nextVertex === null ? pa : mixProjection(pa, relativeProjection(NAV_VERTS, nextVertex, a, plane, slice, ambient), foldProgress)
      const mb = nextVertex === null ? pb : mixProjection(pb, relativeProjection(NAV_VERTS, nextVertex, b, plane, slice, ambient), foldProgress)
      posArr[i * 6 + 0] = ma[0] * ROOM_SCALE
      posArr[i * 6 + 1] = ma[1] * ROOM_SCALE + 1.45
      posArr[i * 6 + 2] = ma[2] * ROOM_SCALE
      posArr[i * 6 + 3] = mb[0] * ROOM_SCALE
      posArr[i * 6 + 4] = mb[1] * ROOM_SCALE + 1.45
      posArr[i * 6 + 5] = mb[2] * ROOM_SCALE
    }
    const attr = geomRef.current.getAttribute('position') as THREE.BufferAttribute | undefined
    if (attr) {
      attr.needsUpdate = true
    } else {
      geomRef.current.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    }
  })
  return (
    <lineSegments>
      <bufferGeometry ref={geomRef} />
      <lineBasicMaterial color="#79c7ff" transparent opacity={0.4} />
    </lineSegments>
  )
}

function PortalSet({
  currentVertex,
  nextVertex,
  foldProgress,
  plane,
  slice,
  activeTarget,
}: {
  currentVertex: number
  nextVertex: number | null
  foldProgress: number
  plane: number
  slice: number
  activeTarget: number | null
}) {
  const neighbors = useMemo(() => buildAdjacency(NAV_VERTS, NAV_EDGES).get(currentVertex) ?? [], [currentVertex])
  return (
    <group>
      {neighbors.map((neighbor) => (
        <PortalGlyph
          key={neighbor}
          currentVertex={currentVertex}
          neighbor={neighbor}
          transitionTarget={nextVertex}
          foldProgress={foldProgress}
          plane={plane}
          slice={slice}
          active={activeTarget === neighbor}
        />
      ))}
    </group>
  )
}

function PortalGlyph({
  currentVertex,
  neighbor,
  transitionTarget,
  foldProgress,
  plane,
  slice,
  active,
}: {
  currentVertex: number
  neighbor: number
  transitionTarget: number | null
  foldProgress: number
  plane: number
  slice: number
  active: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const ambient = clock.elapsedTime
    const base = normalize3(relativeProjection(NAV_VERTS, currentVertex, neighbor, plane, slice, ambient))
    const mixed = transitionTarget === null
      ? base
      : normalize3(mixProjection(base, relativeProjection(NAV_VERTS, transitionTarget, neighbor, plane, slice, ambient), foldProgress))
    groupRef.current.position.set(mixed[0] * (ROOM_RADIUS - 0.7), mixed[1] * 1.5 + 1.45, mixed[2] * (ROOM_RADIUS - 0.7))
    const lookTarget = new THREE.Vector3(mixed[0] * 10, mixed[1] * 10 + 1.45, mixed[2] * 10)
    groupRef.current.lookAt(lookTarget)

    if (innerRef.current) {
      const shimmer = 0.5 + Math.sin(ambient * 2.5 + neighbor * 1.7) * 0.5
      innerRef.current.scale.setScalar(1 + shimmer * 0.15)
    }
  })

  const runePoints = 3 + (neighbor % 5)
  const runeAngle = (neighbor * 0.618) * Math.PI * 2

  return (
    <group ref={groupRef}>
      {/* Outer torus */}
      <mesh>
        <torusGeometry args={[0.42, 0.035, 12, 36]} />
        <meshBasicMaterial
          color={active ? '#e8d0ff' : '#7a6caf'}
          transparent
          opacity={active ? 0.85 : 0.38}
          depthWrite={false}
        />
      </mesh>
      {/* Inner shimmer disc */}
      <mesh ref={innerRef} position={[0, 0, -0.04]}>
        <circleGeometry args={[0.28, 24]} />
        <meshBasicMaterial
          color={active ? '#c8b0ff' : '#5a4c8a'}
          transparent
          opacity={active ? 0.16 : 0.06}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Outer glow halo */}
      <mesh position={[0, 0, -0.06]}>
        <ringGeometry args={[0.44, 0.62, 32]} />
        <meshBasicMaterial
          color={active ? '#a078ff' : '#4a3a7a'}
          transparent
          opacity={active ? 0.12 : 0.04}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Sigil mark — small star polygon unique to this portal */}
      <lineSegments position={[0, 0, -0.02]} rotation={[0, 0, runeAngle]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={runePoints * 2}
            array={new Float32Array(
              Array.from({ length: runePoints }, (_, i) => {
                const a1 = (i / runePoints) * Math.PI * 2
                const a2 = ((i + 2) % runePoints / runePoints) * Math.PI * 2
                return [
                  Math.cos(a1) * 0.16, Math.sin(a1) * 0.16, 0,
                  Math.cos(a2) * 0.16, Math.sin(a2) * 0.16, 0,
                ]
              }).flat()
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={active ? '#c0a0ff' : '#6050a0'}
          transparent
          opacity={active ? 0.7 : 0.25}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}

function GuidanceOrb({
  currentVertex,
  guidance,
  plane,
  slice,
}: {
  currentVertex: number
  guidance: Guidance | null
  plane: number
  slice: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current || !guidance) return
    const t = clock.elapsedTime
    const rel = normalize3(relativeProjection(NAV_VERTS, currentVertex, guidance.direction, plane, slice, t))

    const driftX = Math.sin(t * 0.7) * 0.15
    const driftY = Math.sin(t * 0.5 + 1.2) * 0.1
    const driftZ = Math.cos(t * 0.6 + 0.8) * 0.15
    const radius = 2.0 + Math.sin(t * guidance.pulseRate * 0.8) * 0.2

    groupRef.current.position.set(
      rel[0] * radius + driftX,
      rel[1] * 0.8 + 1.7 + driftY,
      rel[2] * radius + driftZ,
    )

    if (coreRef.current) {
      const breathe = 0.14 + Math.sin(t * 1.2) * 0.03
      coreRef.current.scale.setScalar(breathe)
    }
    if (haloRef.current) {
      const haloScale = 0.28 + Math.sin(t * 0.8 + 0.5) * 0.06
      haloRef.current.scale.setScalar(haloScale)
      haloRef.current.rotation.y = t * 0.3
      haloRef.current.rotation.x = t * 0.15
    }
  })

  if (!guidance) return null
  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#c0b0ff" transparent opacity={0.7} />
      </mesh>
      <mesh ref={haloRef}>
        <torusGeometry args={[1, 0.08, 8, 24]} />
        <meshBasicMaterial
          color="#8070c0"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function TargetArtifact({
  config,
  visible,
  discovered,
}: {
  config: PolytopeConfig | null
  visible: boolean
  discovered: boolean
}) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const pulseRef = useRef<THREE.Mesh>(null)
  const posArr = useMemo(() => new Float32Array((config?.edges.length ?? 0) * 6), [config?.edges.length])
  useFrame(({ clock }) => {
    if (!config || !geomRef.current) return
    const t = clock.elapsedTime
    const projected = config.verts.map((v) => proj4to3(rotate4D(rotate4D(v, t * 0.42, 0, 3), t * 0.31, 1, 2)))
    for (let i = 0; i < config.edges.length; i++) {
      const [a, b] = config.edges[i]
      const pa = projected[a]
      const pb = projected[b]
      posArr[i * 6 + 0] = pa[0] * 0.88
      posArr[i * 6 + 1] = pa[1] * 0.88 + 1.55
      posArr[i * 6 + 2] = pa[2] * 0.88
      posArr[i * 6 + 3] = pb[0] * 0.88
      posArr[i * 6 + 4] = pb[1] * 0.88 + 1.55
      posArr[i * 6 + 5] = pb[2] * 0.88
    }
    const attr = geomRef.current.getAttribute('position') as THREE.BufferAttribute | undefined
    if (attr) {
      attr.needsUpdate = true
    } else {
      geomRef.current.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    }
    if (pulseRef.current) {
      pulseRef.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08)
    }
  })
  if (!config || !visible) return null
  return (
    <group>
      <mesh ref={pulseRef} position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.8, 24, 24]} />
        <meshBasicMaterial color={config.color} transparent opacity={discovered ? 0.08 : 0.16} />
      </mesh>
      <lineSegments>
        <bufferGeometry ref={geomRef} />
        <lineBasicMaterial color={config.color} transparent opacity={discovered ? 0.45 : 0.9} />
      </lineSegments>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.88, 1.08, 32]} />
        <meshBasicMaterial color={config.color} transparent opacity={discovered ? 0.12 : 0.26} />
      </mesh>
    </group>
  )
}

function DiscoveryOverlay({ config, show }: { config: PolytopeConfig | null; show: boolean }) {
  if (!show || !config) return null
  return (
    <div style={{
      position: 'absolute',
      bottom: 100,
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
      fontFamily: '"IM Fell English", Georgia, serif',
      color: config.color,
      zIndex: 35,
      animation: 'fadeInUp 0.8s ease-out',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: '0.5rem', letterSpacing: '0.6em', opacity: 0.35, marginBottom: 10 }}>
        SIGIL MANIFESTED
      </div>
      <div style={{
        fontSize: '1.5rem',
        letterSpacing: '0.25em',
        marginBottom: 8,
        textShadow: `0 0 20px ${config.color}40`,
      }}>
        {config.name}
      </div>
      <div style={{ fontSize: '0.65rem', opacity: 0.35, letterSpacing: '0.15em', fontStyle: 'italic' }}>
        {config.subtitle}
      </div>
    </div>
  )
}

function CompletionOverlay() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 45%, rgba(20, 10, 40, 0.85) 0%, rgba(0, 0, 0, 0.92) 100%)',
      fontFamily: '"IM Fell English", Georgia, serif',
      color: '#c8b0ff',
      zIndex: 40,
      animation: 'fadeIn 3s ease-in',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: '0.5rem', letterSpacing: '0.7em', opacity: 0.35, marginBottom: '2.5rem' }}>
        ALL SIGILS MANIFEST
      </div>
      <h1 style={{
        fontSize: 'clamp(1.4rem, 4vw, 2.4rem)',
        fontWeight: 'normal',
        letterSpacing: '0.25em',
        margin: '0 0 1.2rem',
        textShadow: '0 0 30px rgba(160, 120, 255, 0.2)',
      }}>
        The Fold Remembers
      </h1>
      <p style={{
        opacity: 0.35,
        fontSize: '0.8rem',
        letterSpacing: '0.12em',
        maxWidth: 380,
        textAlign: 'center',
        lineHeight: 2,
        fontStyle: 'italic',
      }}>
        You moved by folding the room itself.<br />
        The manifold carries your path now &mdash;<br />
        a sigil written in four dimensions.
      </p>
    </div>
  )
}

function HUD({
  discovered,
  currentVertex,
  plane,
  slice,
  guidance,
  folding,
}: {
  discovered: boolean[]
  currentVertex: number
  plane: number
  slice: number
  guidance: Guidance | null
  folding: boolean
}) {
  const count = discovered.filter(Boolean).length
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      fontFamily: '"IM Fell English", Georgia, serif',
      color: '#5a6880',
      zIndex: 30,
      pointerEvents: 'none',
      display: 'grid',
      gap: 10,
    }}>
      <div>
        <div style={{ fontSize: '0.5rem', letterSpacing: '0.6em', opacity: 0.3, marginBottom: 10 }}>
          SIGILS REVEALED
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {POLYTOPES.map((p, i) => (
            <div key={i} style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: discovered[i] ? p.color : 'transparent',
              border: `1px solid ${discovered[i] ? p.color : '#1a2030'}`,
              boxShadow: discovered[i] ? `0 0 8px ${p.color}40` : 'none',
              transition: 'all 0.8s ease',
            }} />
          ))}
        </div>
        <div style={{ fontSize: '0.55rem', opacity: 0.25, marginTop: 8, letterSpacing: '0.2em', fontStyle: 'italic' }}>
          {count === 0 ? 'the manifold awaits' : count === 4 ? 'all folds resolved' : `${count} of 4 manifest`}
        </div>
      </div>
      <div style={{ fontSize: '0.65rem', lineHeight: 1.8, opacity: 0.4, fontFamily: 'monospace' }}>
        <div>{planeLabel(plane)} · w{slice >= 0 ? '+' : ''}{slice.toFixed(1)}</div>
        <div>{folding ? 'folding...' : guidance ? `${guidance.distance} folds away` : 'here'}</div>
      </div>
    </div>
  )
}

function ControlsHint() {
  const [visible, setVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
    const timer = setTimeout(() => setVisible(false), 12000)
    return () => clearTimeout(timer)
  }, [])
  if (!visible) return null
  return (
    <div style={{
      position: 'absolute',
      bottom: 28,
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: '"IM Fell English", Georgia, serif',
      color: '#3a4858',
      fontSize: '0.65rem',
      letterSpacing: '0.2em',
      textAlign: 'center',
      zIndex: 30,
      opacity: 0.55,
      transition: 'opacity 2s',
      pointerEvents: 'none',
      maxWidth: 340,
      lineHeight: 1.8,
    }}>
      {isMobile
        ? 'swipe to fold through portals \u00b7 pinch to shift the slice \u00b7 double-tap for guidance'
        : 'WASD fold toward a portal \u00b7 Space follows guidance \u00b7 Q/E slide through W \u00b7 R rotates the fold plane'
      }
    </div>
  )
}

function StartSigilCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const tRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sz = canvas.width
    const cx = sz / 2
    const cy = sz / 2
    tRef.current += 0.003

    ctx.clearRect(0, 0, sz, sz)

    const drawRing = (r: number, opacity: number, segments = 64) => {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(120, 80, 200, ${opacity})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    drawRing(sz * 0.42, 0.12)
    drawRing(sz * 0.32, 0.08)
    drawRing(sz * 0.22, 0.06)

    const starPoints = 7
    const outerR = sz * 0.38
    const innerR = sz * 0.18
    ctx.beginPath()
    for (let i = 0; i <= starPoints * 2; i++) {
      const angle = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2 + tRef.current * 0.2
      const r = i % 2 === 0 ? outerR : innerR
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = 'rgba(140, 100, 220, 0.08)'
    ctx.lineWidth = 0.8
    ctx.stroke()

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + tRef.current * 0.1
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * sz * 0.08, cy + Math.sin(angle) * sz * 0.08)
      ctx.lineTo(cx + Math.cos(angle) * sz * 0.4, cy + Math.sin(angle) * sz * 0.4)
      ctx.strokeStyle = 'rgba(100, 70, 180, 0.04)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      style={{
        position: 'absolute',
        width: 400,
        height: 400,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.6,
        pointerEvents: 'none',
      }}
    />
  )
}

function StartScreen({ onStart }: { onStart: () => void }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'radial-gradient(ellipse at 50% 40%, #080418 0%, #000000 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"IM Fell English", "Palatino Linotype", Georgia, serif',
      color: '#8090b0',
      userSelect: 'none',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <StartSigilCanvas />

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '0.55rem', letterSpacing: '0.6em', color: '#2a3040', marginBottom: '3rem' }}>
          DREAMSCAPE
        </div>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
          letterSpacing: '0.3em',
          color: '#b0c0e0',
          margin: 0,
          marginBottom: '0.8rem',
          fontWeight: 'normal',
        }}>
          HYPERFOLD SIGIL
        </h1>
        <p style={{ opacity: 0.3, letterSpacing: '0.15em', fontSize: '0.75rem', margin: '0 0 2.5rem', fontStyle: 'italic' }}>
          The rooms are slices of a shape you cannot see whole.
        </p>
        <p style={{
          opacity: 0.2,
          maxWidth: 340,
          textAlign: 'center',
          lineHeight: 2,
          fontSize: '0.78rem',
          margin: '0 0 3rem',
        }}>
          {isMobile
            ? <>Swipe to fold between rooms.<br />Pinch to shift through the fourth axis.<br />Each sigil reveals the manifold's hidden form.</>
            : <>Fold from room to room. Shift the slice through W.<br />Rotate the active plane. Let the sigils guide you.</>
          }
        </p>
        <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '2rem' }}>
          {POLYTOPES.map((p, i) => (
            <div key={i} style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: p.color,
              opacity: 0.2,
              boxShadow: `0 0 6px ${p.color}30`,
            }} />
          ))}
        </div>
        <button
          onClick={onStart}
          style={{
            background: 'rgba(120, 80, 200, 0.06)',
            border: '1px solid #1a1830',
            color: '#6070a0',
            padding: '1rem 3rem',
            cursor: 'pointer',
            letterSpacing: '0.35em',
            fontSize: '0.72rem',
            fontFamily: 'inherit',
            transition: 'all 0.5s',
            borderRadius: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4030a0'
            e.currentTarget.style.color = '#9080d0'
            e.currentTarget.style.background = 'rgba(120, 80, 200, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1a1830'
            e.currentTarget.style.color = '#6070a0'
            e.currentTarget.style.background = 'rgba(120, 80, 200, 0.06)'
          }}
        >
          ENTER THE FOLD
        </button>
      </div>
    </div>
  )
}

function ManifoldMap({
  currentVertex,
  plane,
  slice,
  discovered,
}: {
  currentVertex: number
  plane: number
  slice: number
  discovered: boolean[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(5, 10, 18, 0.7)'
    ctx.fillRect(0, 0, width, height)
    const projected = NAV_VERTS.map((v) => proj4to3(transformVertex(v, plane, slice, 0.25), 3.8))
    const points = projected.map((v) => [width / 2 + v[0] * 36, height / 2 + v[1] * 36] as const)
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.28)'
    ctx.lineWidth = 1
    for (const [a, b] of NAV_EDGES) {
      ctx.beginPath()
      ctx.moveTo(points[a][0], points[a][1])
      ctx.lineTo(points[b][0], points[b][1])
      ctx.stroke()
    }
    TARGET_VERTICES.forEach((vertex, index) => {
      const [x, y] = points[vertex]
      ctx.beginPath()
      ctx.arc(x, y, discovered[index] ? 4.2 : 5.6, 0, Math.PI * 2)
      ctx.fillStyle = discovered[index] ? POLYTOPES[index].color : 'rgba(255,255,255,0.2)'
      ctx.fill()
    })
    const [cx, cy] = points[currentVertex]
    ctx.beginPath()
    ctx.arc(cx, cy, 4.2, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  }, [currentVertex, plane, slice, discovered])
  return (
    <canvas
      ref={canvasRef}
      width={148}
      height={148}
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 148,
        height: 148,
        borderRadius: 10,
        border: '1px solid rgba(60, 110, 160, 0.25)',
        zIndex: 30,
      }}
    />
  )
}

function MobileNavButtons({
  onFold,
  onGuidedStep,
  onRotatePlane,
}: {
  onFold: (dir: 'w' | 'a' | 's' | 'd') => void
  onGuidedStep: () => void
  onRotatePlane: () => void
}) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  if (!isMobile) return null

  const btnStyle = (size = 44): React.CSSProperties => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    border: '1px solid rgba(100, 80, 160, 0.2)',
    background: 'rgba(30, 20, 60, 0.4)',
    color: 'rgba(140, 120, 200, 0.6)',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  })

  return (
    <div style={{ position: 'absolute', bottom: 60, right: 16, zIndex: 35 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '44px 44px 44px', gridTemplateRows: '44px 44px 44px', gap: 4 }}>
        <div />
        <button onClick={() => onFold('w')} style={btnStyle()}>
          <span style={{ transform: 'rotate(-90deg)', display: 'inline-block' }}>{'\u25B8'}</span>
        </button>
        <div />
        <button onClick={() => onFold('a')} style={btnStyle()}>
          <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>{'\u25B8'}</span>
        </button>
        <button onClick={onGuidedStep} style={{ ...btnStyle(), border: '1px solid rgba(140, 100, 220, 0.3)', color: 'rgba(180, 150, 240, 0.7)' }}>
          {'\u2726'}
        </button>
        <button onClick={() => onFold('d')} style={btnStyle()}>{'\u25B8'}</button>
        <div />
        <button onClick={() => onFold('s')} style={btnStyle()}>
          <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>{'\u25B8'}</span>
        </button>
        <button onClick={onRotatePlane} style={{ ...btnStyle(36), fontSize: 11, fontFamily: 'monospace' }}>
          R
        </button>
      </div>
    </div>
  )
}

type AudioPreset = 'ethereal' | 'deep' | 'silent' | 'custom'

const AUDIO_PRESETS: Record<Exclude<AudioPreset, 'custom'>, Partial<ReturnType<typeof getAudioPrefs>>> = {
  ethereal: { droneGain: 0.015, synthVolume: -24, finaleVolume: -20, droneType: 'sine', synthType: 'triangle', tuningMode: '31edo', scaleSet: 'neutral' },
  deep: { droneGain: 0.04, synthVolume: -18, finaleVolume: -14, droneType: 'triangle', synthType: 'sine', tuningMode: '31edo', scaleSet: 'teleology' },
  silent: { droneGain: 0, synthVolume: -40, finaleVolume: -40 },
}

function AudioSettings() {
  const [open, setOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activePreset, setActivePreset] = useState<AudioPreset>('ethereal')
  const [prefs, setPrefs] = useState(getAudioPrefs())
  useEffect(() => { setPrefs(getAudioPrefs()) }, [])

  const update = (patch: Partial<typeof prefs>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    setAudioPrefs(patch)
  }

  const applyPreset = (preset: Exclude<AudioPreset, 'custom'>) => {
    setActivePreset(preset)
    update(AUDIO_PRESETS[preset])
  }

  const presetBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 16,
    border: `1px solid ${active ? 'rgba(120, 80, 200, 0.4)' : 'rgba(255,255,255,0.08)'}`,
    background: active ? 'rgba(120, 80, 200, 0.15)' : 'transparent',
    color: active ? '#a78bfa' : 'rgba(150, 150, 170, 0.5)',
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'all 0.3s',
  })

  return (
    <div style={{ position: 'absolute', top: 16, right: 184, zIndex: 50, pointerEvents: 'auto' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs px-2 py-1 rounded"
        style={{
          border: '1px solid rgba(100, 80, 160, 0.2)',
          color: 'rgba(120, 100, 170, 0.5)',
          background: 'rgba(15, 10, 30, 0.4)',
          fontFamily: 'monospace',
          letterSpacing: '0.1em',
        }}
      >
        {open ? 'Sound \u25B2' : 'Sound \u25BC'}
      </button>
      {open && (
        <div className="mt-2 rounded-xl p-3 space-y-3" style={{ background: 'rgba(8, 5, 18, 0.95)', border: '1px solid rgba(100, 80, 160, 0.2)', minWidth: 180 }}>
          <div style={{ fontSize: '0.5rem', letterSpacing: '0.5em', color: 'rgba(120, 100, 170, 0.4)', marginBottom: 2 }}>ATMOSPHERE</div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => applyPreset('ethereal')} style={presetBtnStyle(activePreset === 'ethereal')}>Ethereal</button>
            <button onClick={() => applyPreset('deep')} style={presetBtnStyle(activePreset === 'deep')}>Deep</button>
            <button onClick={() => applyPreset('silent')} style={presetBtnStyle(activePreset === 'silent')}>Silent</button>
          </div>

          <button
            onClick={() => { setShowAdvanced(v => !v); setActivePreset('custom') }}
            className="text-xs w-full text-left"
            style={{ color: 'rgba(120, 100, 170, 0.35)', fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.15em' }}
          >
            {showAdvanced ? '\u25B2 Hide mixer' : '\u25BC Advanced mixer'}
          </button>

          {showAdvanced && (
            <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Labeled label="Drone"><input type="range" min={0} max={0.1} step={0.002} value={prefs.droneGain} onChange={(e) => update({ droneGain: Number(e.target.value) })} /></Labeled>
              <Labeled label="Synth"><input type="range" min={-40} max={0} step={1} value={prefs.synthVolume} onChange={(e) => update({ synthVolume: Number(e.target.value) })} /></Labeled>
              <Labeled label="Finale"><input type="range" min={-40} max={0} step={1} value={prefs.finaleVolume} onChange={(e) => update({ finaleVolume: Number(e.target.value) })} /></Labeled>
              <Labeled label="Wave">
                <select value={prefs.droneType} onChange={(e) => update({ droneType: e.target.value as BasicWave })} className="text-xs">
                  <option value="sine">sine</option>
                  <option value="triangle">triangle</option>
                  <option value="square">square</option>
                  <option value="sawtooth">sawtooth</option>
                </select>
              </Labeled>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 4, paddingTop: 4 }}>
                <div style={{ fontSize: '0.5rem', letterSpacing: '0.4em', color: 'rgba(80,120,160,0.5)', marginBottom: 4 }}>TUNING</div>
                <Labeled label="System">
                  <select value={prefs.tuningMode} onChange={(e) => update({ tuningMode: e.target.value as TuningMode })} className="text-xs">
                    <option value="12tet">12-TET</option>
                    <option value="31edo">31-EDO</option>
                  </select>
                </Labeled>
                <Labeled label="Scale">
                  <select value={prefs.scaleSet} onChange={(e) => update({ scaleSet: e.target.value as ScaleSet })} className="text-xs">
                    <option value="neutral">Neutral</option>
                    <option value="teleology">Teleology</option>
                    <option value="diatonic31">Diatonic 31</option>
                  </select>
                </Labeled>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--muted)' }}>
      <span>{label}</span>
      <span>{children}</span>
    </label>
  )
}

export default function PuzzlePage() {
  const [started, setStarted] = useState(false)
  const [discovered, setDiscovered] = useState([false, false, false, false])
  const [lastDiscovery, setLastDiscovery] = useState<number | null>(null)
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [complete, setComplete] = useState(false)
  const [currentVertex, setCurrentVertex] = useState(0)
  const [activePlane, setActivePlane] = useState(2)
  const [sliceOffset, setSliceOffset] = useState(0)
  const [transitionTo, setTransitionTo] = useState<number | null>(null)
  const [foldProgress, setFoldProgress] = useState(0)
  const [debug, setDebug] = useState(false)
  const lookRef = useRef({ yaw: 0, pitch: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const transitionStartRef = useRef(0)
  useEffect(() => {
    return () => { cleanupAudio() }
  }, [])

  const adjacency = useMemo(() => buildAdjacency(NAV_VERTS, NAV_EDGES), [])
  const faces = useMemo(() => buildFaces(NAV_VERTS, NAV_EDGES), [])
  const undiscoveredTargets = useMemo(
    () => TARGET_VERTICES.filter((vertex, index) => !discovered[index]),
    [discovered],
  )
  const guidance = useMemo(
    () => (undiscoveredTargets.length ? getGuidance(adjacency, NAV_VERTS, faces, currentVertex, undiscoveredTargets) : null),
    [adjacency, currentVertex, faces, undiscoveredTargets],
  )

  const beginFold = useCallback((nextVertex: number | null) => {
    if (nextVertex === null || nextVertex === currentVertex || transitionTo !== null) return
    setTransitionTo(nextVertex)
    transitionStartRef.current = performance.now()
    playFoldCue(Math.abs(nextVertex - currentVertex))
  }, [currentVertex, transitionTo])

  const handleDiscover = useCallback((idx: number) => {
    const prefs = getAudioPrefs()
    if (prefs.tuningMode === '31edo') {
      const baseHz = prefs.refFreq * (1 + idx * 0.1)
      playDiscoveryHz(discoveryNeutralThirds(baseHz, prefs.refFreq))
    } else {
      playDiscovery(POLYTOPES[idx].notes)
    }
    setDiscovered((prev) => {
      if (prev[idx]) return prev
      const next = [...prev]
      next[idx] = true
      updateArpeggio(currentVertex, next.filter(Boolean).length)
      if (next.every(Boolean)) {
        setTimeout(() => {
          setComplete(true)
          playFinale()
        }, 2200)
      }
      return next
    })
    setLastDiscovery(idx)
    setShowDiscovery(true)
    setTimeout(() => setShowDiscovery(false), 3000)
  }, [])

  useEffect(() => {
    if (transitionTo === null) return
    let raf = 0
    const tick = () => {
      const progress = Math.min(1, (performance.now() - transitionStartRef.current) / FOLD_MS)
      setFoldProgress(progress)
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
        return
      }
      setCurrentVertex(transitionTo)
      setTransitionTo(null)
      setFoldProgress(0)
      updateArpeggio(transitionTo, discovered.filter(Boolean).length)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [transitionTo])

  useEffect(() => {
    const targetIndex = TARGET_VERTICES.findIndex((vertex) => vertex === currentVertex)
    if (targetIndex !== -1 && !discovered[targetIndex]) handleDiscover(targetIndex)
  }, [currentVertex, discovered, handleDiscover])

  useEffect(() => {
    if (!started) return
    const nearest = undiscoveredTargets.length
      ? Math.min(...undiscoveredTargets.map((vertex) => manifoldDistance(adjacency, currentVertex, vertex)))
      : 0
    const proximity = undiscoveredTargets.length ? Math.max(0, 1 - nearest / 4) : 1
    const dissonance = Math.min(1, Math.abs(sliceOffset) / 1.2)
    updateDrone(proximity, dissonance)
  }, [adjacency, currentVertex, sliceOffset, started, undiscoveredTargets])

  useEffect(() => {
    if (!started) return
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === ' ') {
        e.preventDefault()
        if (guidance) beginFold(guidance.direction)
        return
      }
      if (key === 'q') {
        setSliceOffset((prev) => clampNum(prev - 0.18, -1.2, 1.2))
        return
      }
      if (key === 'e') {
        setSliceOffset((prev) => clampNum(prev + 0.18, -1.2, 1.2))
        return
      }
      if (key === 'r') {
        setActivePlane((prev) => (prev + 1) % SO4_PLANES.length)
        return
      }
      const normalized = key === 'arrowup' ? 'w' : key === 'arrowleft' ? 'a' : key === 'arrowdown' ? 's' : key === 'arrowright' ? 'd' : key
      if (normalized === 'w' || normalized === 'a' || normalized === 's' || normalized === 'd') {
        const next = getDirectionalNeighbor(currentVertex, activePlane, sliceOffset, lookRef.current.yaw, normalized)
        beginFold(next)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePlane, beginFold, currentVertex, guidance, sliceOffset, started])

  useEffect(() => {
    if (!started) return
    const el = containerRef.current
    if (!el) return

    let dragging = false
    let lastX = 0
    let lastY = 0
    let swipeStartX = 0
    let swipeStartY = 0
    let swipeStartTime = 0
    let touchCount = 0
    let lastPinchDist = 0
    const SWIPE_THRESHOLD = 50
    const SWIPE_TIME_LIMIT = 400

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      swipeStartX = e.clientX
      swipeStartY = e.clientY
      swipeStartTime = performance.now()
      el.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = (e.clientX - lastX) * 0.003
      const dy = (e.clientY - lastY) * 0.003
      lookRef.current.yaw -= dx
      lookRef.current.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, lookRef.current.pitch - dy))
      lastX = e.clientX
      lastY = e.clientY
    }
    const onPointerUp = (e: PointerEvent) => {
      dragging = false
      el.releasePointerCapture(e.pointerId)

      const elapsed = performance.now() - swipeStartTime
      if (elapsed > SWIPE_TIME_LIMIT) return

      const sdx = e.clientX - swipeStartX
      const sdy = e.clientY - swipeStartY
      const dist = Math.sqrt(sdx * sdx + sdy * sdy)
      if (dist < SWIPE_THRESHOLD) return

      const angle = Math.atan2(-sdy, sdx)
      let direction: 'w' | 'a' | 's' | 'd'
      if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) direction = 'w'
      else if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) direction = 's'
      else if (Math.abs(angle) > 3 * Math.PI / 4) direction = 'a'
      else direction = 'd'

      const next = getDirectionalNeighbor(currentVertex, activePlane, sliceOffset, lookRef.current.yaw, direction)
      beginFold(next)
    }

    const onTouchStart = (e: TouchEvent) => {
      touchCount = e.touches.length
      if (touchCount === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDist = Math.sqrt(dx * dx + dy * dy)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const pinchDist = Math.sqrt(dx * dx + dy * dy)
        const delta = (pinchDist - lastPinchDist) * 0.003
        setSliceOffset((prev) => clampNum(prev + delta, -1.2, 1.2))
        lastPinchDist = pinchDist
      }
    }
    const onTouchEnd = () => {
      touchCount = 0
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [started, activePlane, beginFold, currentVertex, sliceOffset])

  useEffect(() => {
    const onDebug = (event: Event) => {
      const detail = (event as CustomEvent<{ action?: string; id?: string }>).detail || {}
      if (detail.action === 'dumpState') {
        console.log('[puzzle] state', { currentVertex, activePlane, sliceOffset, discovered })
        return
      }
      if (detail.action === 'navigateTo') {
        const id = String(detail.id || '')
        if (!id.startsWith('node-')) return
        const next = Number(id.split('-')[1] || '0')
        if (!Number.isFinite(next) || next < 0 || next >= NAV_VERTS.length) return
        setTransitionTo(null)
        setFoldProgress(0)
        setCurrentVertex(next)
      }
    }
    window.addEventListener('puzzle-debug', onDebug as EventListener)
    return () => window.removeEventListener('puzzle-debug', onDebug as EventListener)
  }, [activePlane, currentVertex, discovered, sliceOffset])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setDebug(params.get('debug') === '1')
  }, [])

  if (!started) {
    return <StartScreen onStart={() => { initAudio(); setStarted(true) }} />
  }

  const artifactIndex = TARGET_VERTICES.findIndex((vertex) => vertex === currentVertex)
  const artifactConfig = artifactIndex === -1 ? null : POLYTOPES[artifactIndex]
  const artifactDiscovered = artifactIndex === -1 ? false : discovered[artifactIndex]

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        position: 'relative',
        userSelect: 'none',
        touchAction: 'none',
        cursor: 'crosshair',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{ fov: 72, near: 0.05, far: 100 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      >
        <fog attach="fog" args={['#020408', 2, 28 + Math.sin((foldProgress || 0) * Math.PI) * 6]} />
        <ambientLight intensity={0.22} color="#1a2840" />
        <pointLight position={[0, 5, 0]} intensity={0.45} color="#2a3860" distance={24} />
        <pointLight position={[6, 3, -6]} intensity={0.35} color="#7c57ff" distance={20} />
        <pointLight position={[-4, 2, 4]} intensity={0.18} color="#a078ff" distance={16} />
        <RoomCamera lookRef={lookRef} />
        <Stars />
        <RoomShell foldProgress={foldProgress} sliceOffset={sliceOffset} />
        <SigilFloor vertexIndex={currentVertex} discovered={artifactIndex !== -1 && artifactDiscovered} sliceOffset={sliceOffset} />
        <DreamMotes sliceOffset={sliceOffset} />
        <SliceLattice currentVertex={currentVertex} nextVertex={transitionTo} foldProgress={foldProgress} plane={activePlane} slice={sliceOffset} />
        <PortalSet currentVertex={currentVertex} nextVertex={transitionTo} foldProgress={foldProgress} plane={activePlane} slice={sliceOffset} activeTarget={guidance?.direction ?? null} />
        <GuidanceOrb currentVertex={currentVertex} guidance={guidance} plane={activePlane} slice={sliceOffset} />
        <TargetArtifact config={artifactConfig} visible={artifactIndex !== -1} discovered={artifactDiscovered} />
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={new THREE.Vector2(0.0008, 0.0008)}
            radialModulation={false}
            modulationOffset={0.0}
          />
          <Vignette
            offset={0.15}
            darkness={0.7}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      </Canvas>

      <HUD discovered={discovered} currentVertex={currentVertex} plane={activePlane} slice={sliceOffset} guidance={guidance} folding={transitionTo !== null} />
      <ManifoldMap currentVertex={currentVertex} plane={activePlane} slice={sliceOffset} discovered={discovered} />
      <ControlsHint />
      {debug && <PuzzleDebugPanel />}
      <div style={{ pointerEvents: 'auto' }}><AudioSettings /></div>
      <DiscoveryOverlay config={lastDiscovery !== null ? POLYTOPES[lastDiscovery] : null} show={showDiscovery} />
      {complete && <CompletionOverlay />}
      <MobileNavButtons
        onFold={(dir) => {
          const next = getDirectionalNeighbor(currentVertex, activePlane, sliceOffset, lookRef.current.yaw, dir)
          beginFold(next)
        }}
        onGuidedStep={() => { if (guidance) beginFold(guidance.direction) }}
        onRotatePlane={() => setActivePlane((prev) => (prev + 1) % SO4_PLANES.length)}
      />
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
