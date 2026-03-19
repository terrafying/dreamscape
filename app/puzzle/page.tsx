'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import PuzzleDebugPanel from '@/components/PuzzleDebugPanel'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import * as Tone from 'tone'
import {
  type Vec4,
  rotate4D, proj4to3,
  VERTS_5CELL, EDGES_5CELL,
  VERTS_TESSERACT, EDGES_TESSERACT,
  VERTS_16, EDGES_16,
  VERTS_24, EDGES_24,
} from '@/lib/geometry4d'
import {
  generateMaze, hashString,
  CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS,
  gridToWorld, worldToGrid, clampMovement,
  type MazeGrid,
} from '@/lib/maze'

// ─── POLYTOPE CONFIGS ─────────────────────────────────────────────────────────

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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function applyRotation(v: Vec4, time: number, speed: number): Vec4 {
  let r = rotate4D(v, time * speed * 0.7, 0, 3)
  r = rotate4D(r, time * speed * 0.5, 1, 2)
  return rotate4D(r, time * speed * 0.3, 2, 3)
}

function projectVerts(verts: Vec4[], time: number, speed: number): [number, number, number][] {
  return verts.map(v => proj4to3(applyRotation(v, time, speed)))
}

// ─── AUDIO ────────────────────────────────────────────────────────────────────

type AudioRig = {
  drone: Tone.Oscillator
  droneGain: Tone.Gain
  reverb: Tone.Freeverb
  synth: Tone.PolySynth
  finale: Tone.PolySynth
}

let audioRig: AudioRig | null = null
let audioStarted = false

function initAudio() {
  if (audioStarted) return
  audioStarted = true
  Tone.start()
  const user = getAudioPrefs()
  const reverb = new Tone.Freeverb({ roomSize: user.roomSize, dampening: user.dampening }).toDestination()
  const droneGain = new Tone.Gain(user.droneGain).connect(reverb)
  const drone = new Tone.Oscillator({ frequency: 55, type: user.droneType }).connect(droneGain)
  drone.start()
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: user.synthType },
    envelope: { attack: 0.2, decay: 1.5, sustain: 0.4, release: 4 },
  }).connect(reverb)
  synth.volume.value = user.synthVolume
  const finale = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: user.synthType },
    envelope: { attack: 0.3, decay: 2, sustain: 0.6, release: 7 },
  }).connect(reverb)
  finale.volume.value = user.finaleVolume
  audioRig = { drone, droneGain, reverb, synth, finale }
}

function getAudioPrefs() {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('puzzle_audio') : null
  const d = raw ? JSON.parse(raw) : {}
  return {
    droneGain: clampNum(d.droneGain ?? 0.04, 0, 0.3),
    synthVolume: clampNum(d.synthVolume ?? -12, -40, 0),
    finaleVolume: clampNum(d.finaleVolume ?? -10, -40, 0),
    roomSize: clampNum(d.roomSize ?? 0.9, 0, 0.99),
    dampening: clampNum(d.dampening ?? 900, 100, 3000),
    droneType: (d.droneType ?? 'sine') as any,
    synthType: (d.synthType ?? 'triangle') as any,
  }
}
function setAudioPrefs(p: Partial<ReturnType<typeof getAudioPrefs>>) {
  const cur = getAudioPrefs()
  const next = { ...cur, ...p }
  if (typeof window !== 'undefined') localStorage.setItem('puzzle_audio', JSON.stringify(next))
  if (audioRig) {
    audioRig.droneGain.gain.rampTo(next.droneGain, 0.2)
    audioRig.synth.volume.rampTo(next.synthVolume, 0.2)
    audioRig.finale.volume.rampTo(next.finaleVolume, 0.2)
    ;(audioRig.reverb as any).roomSize?.value !== undefined && ((audioRig.reverb as any).roomSize.value = next.roomSize)
    ;(audioRig.reverb as any).dampening?.value !== undefined && ((audioRig.reverb as any).dampening.value = next.dampening)
  }
}
function clampNum(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)) }

function updateDrone(proximity: number) {
  if (!audioRig) return
  audioRig.drone.frequency.rampTo(55 + proximity * 200, 0.15)
  audioRig.droneGain.gain.rampTo(0.04 + proximity * 0.22, 0.3)
}

function playDiscovery(notes: string[]) {
  if (!audioRig) return
  audioRig.synth.triggerAttackRelease(notes, '2n')
}

function playFinale() {
  if (!audioRig) return
  audioRig.finale.triggerAttackRelease(['D3', 'F3', 'A3', 'C4', 'E4', 'G4', 'B4'], '2m')
}

// ─── MAZE WALLS COMPONENT ────────────────────────────────────────────────────

function MazeWalls({ maze }: { maze: MazeGrid }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    const mat = new THREE.Matrix4()
    let idx = 0

    for (let gy = 0; gy < maze.height; gy++) {
      for (let gx = 0; gx < maze.width; gx++) {
        const cell = maze.cells[gy][gx]
        const [cx, cz] = gridToWorld(gx, gy)

        // Top wall (along X axis at low Z)
        if (cell.walls[0]) {
          mat.identity()
          mat.makeScale(CELL_SIZE + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS)
          mat.setPosition(cx, WALL_HEIGHT / 2, cz - CELL_SIZE / 2)
          mesh.setMatrixAt(idx++, mat)
        }
        // Right wall (along Z axis at high X)
        if (cell.walls[1]) {
          mat.identity()
          mat.makeScale(WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE + WALL_THICKNESS)
          mat.setPosition(cx + CELL_SIZE / 2, WALL_HEIGHT / 2, cz)
          mesh.setMatrixAt(idx++, mat)
        }
      }
    }

    // Bottom boundary
    for (let gx = 0; gx < maze.width; gx++) {
      const [cx] = gridToWorld(gx, maze.height - 1)
      const cz = maze.height * CELL_SIZE
      mat.identity()
      mat.makeScale(CELL_SIZE + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS)
      mat.setPosition(cx, WALL_HEIGHT / 2, cz)
      mesh.setMatrixAt(idx++, mat)
    }
    // Left boundary
    for (let gy = 0; gy < maze.height; gy++) {
      const [, cz] = gridToWorld(0, gy)
      mat.identity()
      mat.makeScale(WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE + WALL_THICKNESS)
      mat.setPosition(-WALL_THICKNESS / 2, WALL_HEIGHT / 2, cz)
      mesh.setMatrixAt(idx++, mat)
    }

    mesh.count = idx
    mesh.instanceMatrix.needsUpdate = true
  }, [maze])

  // Max possible walls: 2 per cell + boundary walls
  const maxInstances = maze.width * maze.height * 2 + maze.width + maze.height

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxInstances]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#0e1520"
        emissive="#1e2a3a"
        emissiveIntensity={0.65}
        roughness={0.85}
        metalness={0.08}
      />
    </instancedMesh>
  )
}

// ─── FLOOR ────────────────────────────────────────────────────────────────────

function MazeFloor({ maze }: { maze: MazeGrid }) {
  const w = maze.width * CELL_SIZE
  const h = maze.height * CELL_SIZE
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, h / 2]}>
      <planeGeometry args={[w + 2, h + 2]} />
      <meshStandardMaterial color="#050810" roughness={0.95} metalness={0.05} />
    </mesh>
  )
}

// ─── FLOATING POLYTOPE LANDMARK ───────────────────────────────────────────────

const POLYTOPE_SCALE = 0.55

function PolytopeLandmark({
  config, worldX, worldZ, discovered, onDiscover,
}: {
  config: PolytopeConfig
  worldX: number
  worldZ: number
  discovered: boolean
  onDiscover: () => void
}) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const posArr = useMemo(() => new Float32Array(config.edges.length * 6), [config.edges.length])
  const discoverTriggered = useRef(false)

  useFrame(({ clock, camera }) => {
    if (!geomRef.current) return
    const t = clock.elapsedTime
    const projected = projectVerts(config.verts, t, 0.4)

    for (let i = 0; i < config.edges.length; i++) {
      const [a, b] = config.edges[i]
      const pa = projected[a], pb = projected[b]
      posArr[i * 6 + 0] = pa[0] * POLYTOPE_SCALE
      posArr[i * 6 + 1] = pa[1] * POLYTOPE_SCALE + 1.5
      posArr[i * 6 + 2] = pa[2] * POLYTOPE_SCALE
      posArr[i * 6 + 3] = pb[0] * POLYTOPE_SCALE
      posArr[i * 6 + 4] = pb[1] * POLYTOPE_SCALE + 1.5
      posArr[i * 6 + 5] = pb[2] * POLYTOPE_SCALE
    }

    const attr = geomRef.current.getAttribute('position') as THREE.BufferAttribute | undefined
    if (attr) { attr.needsUpdate = true }
    else { geomRef.current.setAttribute('position', new THREE.BufferAttribute(posArr, 3)) }

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + Math.sin(t * 2) * 0.08
    }

    // Proximity check
    const dx = camera.position.x - worldX
    const dz = camera.position.z - worldZ
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < 2.0 && !discoverTriggered.current) {
      discoverTriggered.current = true
      onDiscover()
    }
  })

  return (
    <group position={[worldX, 0, worldZ]}>
      {/* Glow sphere */}
      <mesh ref={glowRef} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.15} />
      </mesh>
      {/* Wireframe polytope */}
      <lineSegments>
        <bufferGeometry ref={geomRef} />
        <lineBasicMaterial color={config.color} transparent opacity={discovered ? 1 : 0.7} />
      </lineSegments>
      {/* Ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.7, 0.85, 32]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

// ─── FIRST-PERSON CONTROLLER ──────────────────────────────────────────────────

function FirstPersonController({
  maze, keysRef, lookRef,
  onPositionUpdate,
}: {
  maze: MazeGrid
  keysRef: React.MutableRefObject<Set<string>>
  lookRef: React.MutableRefObject<{ yaw: number; pitch: number }>
  onPositionUpdate: (x: number, z: number) => void
}) {
  const { camera } = useThree()
  const posRef = useRef<[number, number]>(gridToWorld(maze.start.x, maze.start.y))

  // Initialize position
  useEffect(() => {
    const [sx, sz] = gridToWorld(maze.start.x, maze.start.y)
    posRef.current = [sx, sz]
    camera.position.set(sx, 1.0, sz)
  }, [maze, camera])

  useFrame((_, delta) => {
    const keys = keysRef.current
    const look = lookRef.current
    const speed = 4.5 * delta

    let dx = 0, dz = 0
    if (keys.has('w') || keys.has('arrowup')) dz += 1
    if (keys.has('s') || keys.has('arrowdown')) dz -= 1
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1
    if (keys.has('d') || keys.has('arrowright')) dx += 1

    if (dx !== 0 || dz !== 0) {
      const len = Math.sqrt(dx * dx + dz * dz)
      dx /= len; dz /= len

      // Rotate movement direction by yaw
      const cos = Math.cos(look.yaw)
      const sin = Math.sin(look.yaw)
      const mx = dx * cos - dz * sin
      const mz = dx * sin + dz * cos

      const [nx, nz] = clampMovement(maze, posRef.current[0], posRef.current[1], mx * speed, mz * speed)
      posRef.current = [nx, nz]
    }

    camera.position.x = posRef.current[0]
    camera.position.z = posRef.current[1]
    camera.position.y = 1.0

    // Apply look rotation
    const euler = new THREE.Euler(look.pitch, look.yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(euler)

    onPositionUpdate(posRef.current[0], posRef.current[1])
  })

  return null
}

// ─── STARS ────────────────────────────────────────────────────────────────────

function Stars() {
  const geomRef = useRef<THREE.BufferGeometry>(null)

  useEffect(() => {
    if (!geomRef.current) return
    const count = 300
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120
      positions[i * 3 + 1] = 15 + Math.random() * 40
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120
    }
    geomRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  }, [])

  return (
    <points>
      <bufferGeometry ref={geomRef} />
      <pointsMaterial color="#8090b0" size={0.08} transparent opacity={0.5} />
    </points>
  )
}

// ─── MINIMAP ──────────────────────────────────────────────────────────────────

function Minimap({
  maze, playerX, playerZ, discovered, visitedCells,
}: {
  maze: MazeGrid
  playerX: number
  playerZ: number
  discovered: boolean[]
  visitedCells: Set<string>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const SIZE = 140
  const cellPx = SIZE / Math.max(maze.width, maze.height)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, SIZE, SIZE)

    // Draw visited cells
    for (let gy = 0; gy < maze.height; gy++) {
      for (let gx = 0; gx < maze.width; gx++) {
        const key = `${gx},${gy}`
        const px = gx * cellPx
        const py = gy * cellPx

        if (visitedCells.has(key)) {
          ctx.fillStyle = 'rgba(20, 35, 55, 0.7)'
          ctx.fillRect(px, py, cellPx, cellPx)

          // Draw walls
          ctx.strokeStyle = 'rgba(60, 110, 160, 0.5)'
          ctx.lineWidth = 1
          const cell = maze.cells[gy][gx]
          if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cellPx, py); ctx.stroke() }
          if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(px + cellPx, py); ctx.lineTo(px + cellPx, py + cellPx); ctx.stroke() }
          if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(px, py + cellPx); ctx.lineTo(px + cellPx, py + cellPx); ctx.stroke() }
          if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + cellPx); ctx.stroke() }
        }
      }
    }

    // Draw polytope nodes
    maze.polytopeNodes.forEach((node, i) => {
      if (discovered[i]) {
        const px = node.x * cellPx + cellPx / 2
        const py = node.y * cellPx + cellPx / 2
        ctx.beginPath()
        ctx.arc(px, py, cellPx * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = POLYTOPES[i]?.color || '#fff'
        ctx.fill()
      }
    })

    // Player dot
    const pgx = playerX / CELL_SIZE
    const pgy = playerZ / CELL_SIZE
    ctx.beginPath()
    ctx.arc(pgx * cellPx, pgy * cellPx, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  }, [maze, playerX, playerZ, discovered, visitedCells, cellPx])

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: SIZE,
        height: SIZE,
        borderRadius: 8,
        background: 'rgba(5, 10, 18, 0.6)',
        border: '1px solid rgba(60, 110, 160, 0.25)',
        zIndex: 30,
      }}
    />
  )
}

// ─── DISCOVERY OVERLAY ────────────────────────────────────────────────────────

function DiscoveryOverlay({ config, show }: { config: PolytopeConfig | null; show: boolean }) {
  if (!show || !config) return null
  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
      fontFamily: '"IM Fell English", Georgia, serif',
      color: config.color,
      zIndex: 35,
      animation: 'fadeInUp 0.6s ease-out',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.5em', opacity: 0.5, marginBottom: 8 }}>
        MANIFOLD DISCOVERED
      </div>
      <div style={{ fontSize: '1.4rem', letterSpacing: '0.2em', marginBottom: 6 }}>
        {config.name}
      </div>
      <div style={{ fontSize: '0.7rem', opacity: 0.5, letterSpacing: '0.1em' }}>
        {config.subtitle}
      </div>
    </div>
  )
}

// ─── COMPLETION OVERLAY ───────────────────────────────────────────────────────

function CompletionOverlay() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.7)',
      fontFamily: '"IM Fell English", Georgia, serif',
      color: '#ffd700',
      zIndex: 40,
      animation: 'fadeIn 2s ease-in',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.6em', opacity: 0.5, marginBottom: '2rem' }}>
        ALL MANIFOLDS DISCOVERED
      </div>
      <h1 style={{
        fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
        fontWeight: 'normal',
        letterSpacing: '0.2em',
        margin: '0 0 1rem',
      }}>
        The Manifold Unfolds
      </h1>
      <p style={{
        opacity: 0.5,
        fontSize: '0.85rem',
        letterSpacing: '0.1em',
        maxWidth: 360,
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        You have traversed the labyrinth<br />
        and found every hidden geometry.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: '2rem' }}>
        {POLYTOPES.map((p, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: p.color, opacity: 0.8,
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── HUD ──────────────────────────────────────────────────────────────────────

function HUD({ discovered }: { discovered: boolean[] }) {
  const count = discovered.filter(Boolean).length
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      fontFamily: '"IM Fell English", Georgia, serif',
      color: '#7090a8',
      zIndex: 30,
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: '0.55rem', letterSpacing: '0.5em', opacity: 0.4, marginBottom: 8 }}>
        MANIFOLDS
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {POLYTOPES.map((p, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: discovered[i] ? p.color : '#1a2030',
            border: `1px solid ${discovered[i] ? p.color : '#2a3548'}`,
            transition: 'all 0.5s ease',
          }} />
        ))}
      </div>
      <div style={{ fontSize: '0.6rem', opacity: 0.35, marginTop: 6, letterSpacing: '0.15em' }}>
        {count} / 4
      </div>
    </div>
  )
}

// ─── CONTROLS HINT ────────────────────────────────────────────────────────────

function ControlsHint() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 6000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null
  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: '"IM Fell English", Georgia, serif',
      color: '#506878',
      fontSize: '0.7rem',
      letterSpacing: '0.15em',
      textAlign: 'center',
      zIndex: 30,
      opacity: 0.6,
      transition: 'opacity 1s',
      pointerEvents: 'none',
    }}>
      WASD or Arrow Keys to move · Drag to look
    </div>
  )
}

// ─── START SCREEN ─────────────────────────────────────────────────────────────

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at 50% 40%, #050514 0%, #000000 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"IM Fell English", "Palatino Linotype", Georgia, serif',
      color: '#a0bcd8', userSelect: 'none',
    }}>
      <div style={{ fontSize: '0.65rem', letterSpacing: '0.5em', color: '#405060', marginBottom: '2.5rem' }}>
        DREAMSCAPE · LABYRINTH
      </div>
      <h1 style={{
        fontSize: 'clamp(1.8rem, 5vw, 3rem)', letterSpacing: '0.25em',
        color: '#c8e0ff', margin: 0, marginBottom: '0.6rem', fontWeight: 'normal',
      }}>
        THE MANIFOLD
      </h1>
      <p style={{ opacity: 0.4, letterSpacing: '0.12em', fontSize: '0.8rem', margin: '0 0 2.5rem' }}>
        Find the hidden geometries within the labyrinth
      </p>
      <p style={{
        opacity: 0.35, maxWidth: 320, textAlign: 'center',
        lineHeight: 1.8, fontSize: '0.82rem', margin: '0 0 3rem',
      }}>
        Use WASD or Arrow Keys to navigate.<br />
        Drag to look around.<br />
        Discover all four polytopes to complete the maze.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {POLYTOPES.map((p, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: p.color, opacity: 0.3,
          }} />
        ))}
      </div>
      <button onClick={onStart} style={{
        background: 'transparent', border: '1px solid #304050',
        color: '#7090a8', padding: '0.8rem 2.8rem',
        cursor: 'pointer', letterSpacing: '0.3em', fontSize: '0.78rem',
        fontFamily: 'inherit', transition: 'all 0.3s',
      }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#60a0c0'; (e.target as HTMLButtonElement).style.color = '#a0c8e0' }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = '#304050'; (e.target as HTMLButtonElement).style.color = '#7090a8' }}
      >
        ENTER THE MANIFOLD
      </button>
    </div>
  )
}

// ─── ANGEL GUIDANCE ──────────────────────────────────────────────────────────

function AngelGuidance({ maze, playerX, playerZ, discovered }: { maze: MazeGrid; playerX: number; playerZ: number; discovered: boolean[] }) {
  // Find next undiscovered target
  const targetIdx = discovered.findIndex(d => !d)
  if (targetIdx === -1) return null
  const node = maze.polytopeNodes[targetIdx]
  const [tx, tz] = gridToWorld(node.x, node.y)
  // Place angel a fraction of the way from player toward target
  const vx = tx - playerX, vz = tz - playerZ
  const dist = Math.max(1, Math.hypot(vx, vz))
  const ux = vx / dist, uz = vz / dist
  const ax = playerX + ux * Math.min(4, dist * 0.5)
  const az = playerZ + uz * Math.min(4, dist * 0.5)

  return (
    <group position={[ax, 1.4, az]}>
      <mesh>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshBasicMaterial color="#b9ecff" transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.3, 0.36, 32]} />
        <meshBasicMaterial color="#b9ecff" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function AudioSettings() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState(getAudioPrefs())
  useEffect(() => { setPrefs(getAudioPrefs()) }, [])
  const update = (p: Partial<typeof prefs>) => { const next = { ...prefs, ...p }; setPrefs(next); setAudioPrefs(p) }
  return (
    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 45 }}>
      <button onClick={() => setOpen(v => !v)} className="text-xs px-2 py-1 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'rgba(255,255,255,0.06)' }}>
        {open ? 'Audio ▲' : 'Audio ▼'}
      </button>
      {open && (
        <div className="mt-2 rounded-lg p-3 space-y-2" style={{ background: 'rgba(8,12,18,0.9)', border: '1px solid var(--border)' }}>
          <Labeled label="Drone Gain"><input type="range" min={0} max={0.3} step={0.005} value={prefs.droneGain} onChange={(e) => update({ droneGain: Number(e.target.value) })} /></Labeled>
          <Labeled label="Synth Volume"><input type="range" min={-40} max={0} step={1} value={prefs.synthVolume} onChange={(e) => update({ synthVolume: Number(e.target.value) })} /></Labeled>
          <Labeled label="Finale Volume"><input type="range" min={-40} max={0} step={1} value={prefs.finaleVolume} onChange={(e) => update({ finaleVolume: Number(e.target.value) })} /></Labeled>
          <Labeled label="Reverb Size"><input type="range" min={0} max={0.99} step={0.01} value={prefs.roomSize} onChange={(e) => update({ roomSize: Number(e.target.value) })} /></Labeled>
          <Labeled label="Dampening"><input type="range" min={100} max={3000} step={50} value={prefs.dampening} onChange={(e) => update({ dampening: Number(e.target.value) })} /></Labeled>
          <Labeled label="Drone Wave">
            <select value={prefs.droneType} onChange={(e) => update({ droneType: e.target.value as any })} className="text-xs">
              <option value="sine">sine</option>
              <option value="triangle">triangle</option>
              <option value="square">square</option>
              <option value="sawtooth">sawtooth</option>
            </select>
          </Labeled>
          <Labeled label="Synth Wave">
            <select value={prefs.synthType} onChange={(e) => update({ synthType: e.target.value as any })} className="text-xs">
              <option value="triangle">triangle</option>
              <option value="sine">sine</option>
              <option value="square">square</option>
              <option value="sawtooth">sawtooth</option>
            </select>
          </Labeled>
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
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0])
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set())
  const [pings, setPings] = useState<{ x: number; z: number; t: number }[]>([])

  const keysRef = useRef(new Set<string>())
  const lookRef = useRef({ yaw: 0, pitch: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate maze (seeded)
  const maze = useMemo(() => generateMaze(12, 12, 42), [])

  // Keyboard input
  useEffect(() => {
    if (!started) return
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      keysRef.current.add(k)
      if (k === 'f') {
        setPings((prev) => [...prev, { x: playerPos[0], z: playerPos[1], t: Date.now() }])
      }
    }
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [started])

  // Mouse/touch look
  useEffect(() => {
    if (!started) return
    const el = containerRef.current
    if (!el) return

    let dragging = false
    let lastX = 0, lastY = 0

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
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
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [started])

  useEffect(() => {
    const onDebug = (e: Event) => {
      const detail = (e as CustomEvent).detail || {}
      if (detail.action === 'dumpState') {
        // eslint-disable-next-line no-console
        console.log('[puzzle] state', { discovered, playerPos })
      } else if (detail.action === 'retryPath') {
        // Placeholder: could reset a stuck nav state
        // eslint-disable-next-line no-console
        console.log('[puzzle] retryPath')
      } else if (detail.action === 'navigateTo') {
        const id = String(detail.id || '')
        if (id.startsWith('node-')) {
          const idx = Number(id.split('-')[1] || '0')
          const node = maze.polytopeNodes[idx]
          if (node) {
            const [x, z] = gridToWorld(node.x, node.y)
            setPlayerPos([x, z])
          }
        }
      }
    }
    window.addEventListener('puzzle-debug', onDebug as any)
    return () => window.removeEventListener('puzzle-debug', onDebug as any)
  }, [discovered, playerPos, maze])

  const handleDiscover = useCallback((idx: number) => {
    setDiscovered(prev => {
      if (prev[idx]) return prev
      const next = [...prev]
      next[idx] = true
      playDiscovery(POLYTOPES[idx].notes)
      // Check completion
      if (next.every(Boolean)) {
        setTimeout(() => {
          setComplete(true)
          playFinale()
        }, 2500)
      }
      return next
    })
    setLastDiscovery(idx)
    setShowDiscovery(true)
    setTimeout(() => setShowDiscovery(false), 3000)
  }, [])

  const handlePositionUpdate = useCallback((x: number, z: number) => {
    setPlayerPos([x, z])
    const [gx, gy] = worldToGrid(x, z)
    const key = `${gx},${gy}`
    setVisitedCells(prev => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
    // Audio: proximity to nearest undiscovered polytope
    let minDist = Infinity
    for (let i = 0; i < maze.polytopeNodes.length; i++) {
      const [px, pz] = gridToWorld(maze.polytopeNodes[i].x, maze.polytopeNodes[i].y)
      const d = Math.sqrt((x - px) ** 2 + (z - pz) ** 2)
      if (d < minDist) minDist = d
    }
    const proximity = Math.max(0, 1 - minDist / 12)
    updateDrone(proximity)
  }, [maze])

  const [debug, setDebug] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      setDebug(p.get('debug') === '1')
    }
  }, [])

  if (!started) {
    return <StartScreen onStart={() => { initAudio(); setStarted(true) }} />
  }

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
        camera={{ fov: 65, near: 0.1, far: 80 }}
        gl={{ antialias: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <fog attach="fog" args={['#020408', 1, 18]} />
        <ambientLight intensity={0.15} color="#304060" />
        <pointLight position={[18, 8, 18]} intensity={0.3} color="#203050" distance={50} />

        <FirstPersonController
          maze={maze}
          keysRef={keysRef}
          lookRef={lookRef}
          onPositionUpdate={handlePositionUpdate}
        />

        <MazeWalls maze={maze} />
        <MazeFloor maze={maze} />
        <Stars />

        {/* Ephemeral pings of light */}
        {pings.filter(p => Date.now() - p.t < 2000).map((p, i) => (
          <pointLight key={i} position={[p.x, 1.2, p.z]} intensity={1.2} color="#6bc8ff" distance={6} decay={2} />
        ))}

        {/* Angel guidance (teleological object) */}
        <AngelGuidance maze={maze} playerX={playerPos[0]} playerZ={playerPos[1]} discovered={discovered} />

        {/* Polytope landmarks */}
        {maze.polytopeNodes.map((node, i) => {
          const [wx, wz] = gridToWorld(node.x, node.y)
          return (
            <PolytopeLandmark
              key={i}
              config={POLYTOPES[i]}
              worldX={wx}
              worldZ={wz}
              discovered={discovered[i]}
              onDiscover={() => handleDiscover(i)}
            />
          )
        })}
      </Canvas>

      {/* UI Overlays */}
      <HUD discovered={discovered} />
      <Minimap
        maze={maze}
        playerX={playerPos[0]}
        playerZ={playerPos[1]}
        discovered={discovered}
        visitedCells={visitedCells}
      />
      <ControlsHint />
      {debug && <PuzzleDebugPanel />}
      <div style={{ pointerEvents: 'auto' }}><AudioSettings /></div>
      <DiscoveryOverlay
        config={lastDiscovery !== null ? POLYTOPES[lastDiscovery] : null}
        show={showDiscovery}
      />
      {complete && <CompletionOverlay />}

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
