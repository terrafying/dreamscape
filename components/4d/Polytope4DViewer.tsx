'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  project4Dto3D,
  createRotor,
  applyRotor,
  getAllPolytopes,
  type Polytope,
  type ProjectionMethod,
} from '@/lib/4d'

interface Polytope4DViewerProps {
  polytopeName?: string
  projectionMethod?: ProjectionMethod
  autoRotate?: boolean
  showInfo?: boolean
}

export default function Polytope4DViewer({
  polytopeName = '24-Cell',
  projectionMethod = 'perspective',
  autoRotate = true,
  showInfo = true,
}: Polytope4DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const polytopeMeshRef = useRef<THREE.Group | null>(null)

  const [polytope, setPolytope] = useState<Polytope | null>(null)
  const [rotation, setRotation] = useState({ xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 })
  const [fps, setFps] = useState(0)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x07070f)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 3
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xa78bfa, 1)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  // Load polytope
  useEffect(() => {
    const allPolytopes = getAllPolytopes()
    const selected = allPolytopes.find((p) => p.name === polytopeName) || allPolytopes[0]
    setPolytope(selected)
  }, [polytopeName])

  // Update polytope mesh
  useEffect(() => {
    if (!polytope || !sceneRef.current) return

    // Remove old mesh
    if (polytopeMeshRef.current) {
      sceneRef.current.remove(polytopeMeshRef.current)
    }

    // Create new mesh group
    const group = new THREE.Group()

    // Create vertices
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []

    polytope.vertices.forEach((vertex) => {
      const projected = project4Dto3D(vertex, {
        method: projectionMethod,
        distance: 3.0,
        scale: 1.0,
      })
      positions.push(projected.x, projected.y, projected.z)
    })

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))

    const material = new THREE.PointsMaterial({
      color: polytope.color,
      size: 0.1,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geometry, material)
    group.add(points)

    // Create edges
    const edgeGeometry = new THREE.BufferGeometry()
    const edgePositions: number[] = []

    polytope.edges.forEach(([i, j]) => {
      const v1 = project4Dto3D(polytope.vertices[i], {
        method: projectionMethod,
        distance: 3.0,
        scale: 1.0,
      })
      const v2 = project4Dto3D(polytope.vertices[j], {
        method: projectionMethod,
        distance: 3.0,
        scale: 1.0,
      })

      edgePositions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    })

    edgeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgePositions), 3))

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: polytope.color,
      transparent: true,
      opacity: 0.6,
    })

    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    group.add(edges)

    sceneRef.current.add(group)
    polytopeMeshRef.current = group
  }, [polytope, projectionMethod])

  // Animation loop
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current || !polytope) return

    let frameCount = 0
    let lastTime = performance.now()

    const animate = () => {
      requestAnimationFrame(animate)

      // Update rotation
      if (autoRotate) {
        setRotation((prev) => ({
          xy: prev.xy + 0.005,
          xz: prev.xz + 0.003,
          xw: prev.xw + 0.002,
          yz: prev.yz + 0.004,
          yw: prev.yw + 0.0015,
          zw: prev.zw + 0.0025,
        }))
      }

      // Update mesh
      if (polytopeMeshRef.current) {
        polytopeMeshRef.current.rotation.x += 0.002
        polytopeMeshRef.current.rotation.y += 0.003
      }

      rendererRef.current!.render(sceneRef.current!, cameraRef.current!)

      // FPS counter
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastTime = now
      }
    }

    animate()
  }, [autoRotate, polytope])

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 rounded-lg"
        style={{ background: 'rgba(15, 15, 30, 0.5)', border: '1px solid rgba(167, 139, 250, 0.2)' }}
      />

      {showInfo && polytope && (
        <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(15, 15, 30, 0.7)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {polytope.name}
          </h3>
          <p className="text-sm mt-2" style={{ color: 'var(--secondary)' }}>
            {polytope.description}
          </p>
          <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
            <div>
              <div style={{ color: 'var(--tertiary)' }}>Vertices</div>
              <div style={{ color: 'var(--text)' }}>{polytope.vertices.length}</div>
            </div>
            <div>
              <div style={{ color: 'var(--tertiary)' }}>Edges</div>
              <div style={{ color: 'var(--text)' }}>{polytope.edges.length}</div>
            </div>
            <div>
              <div style={{ color: 'var(--tertiary)' }}>FPS</div>
              <div style={{ color: 'var(--text)' }}>{fps}</div>
            </div>
          </div>
          <p className="text-xs mt-3 italic" style={{ color: 'var(--violet)' }}>
            ✦ {polytope.symbolism}
          </p>
        </div>
      )}
    </div>
  )
}
