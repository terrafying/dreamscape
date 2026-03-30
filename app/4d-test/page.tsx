'use client'

import { useState } from 'react'
import Polytope4DViewer from '@/components/4d/Polytope4DViewer'
import { getAllPolytopes } from '@/lib/4d'

export default function FourDTestPage() {
  const [selectedPolytope, setSelectedPolytope] = useState('24-Cell')
  const [projectionMethod, setProjectionMethod] = useState<'perspective' | 'stereographic' | 'orthographic'>('perspective')
  const [autoRotate, setAutoRotate] = useState(true)

  const polytopes = getAllPolytopes()

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            4D Polytope Viewer
          </h1>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            Phase 1: Modular 4D visualization with Hyperspace.js and Clifford Algebra
          </p>
        </div>

        {/* Main viewer */}
        <div className="mb-8" style={{ height: '500px' }}>
          <Polytope4DViewer
            polytopeName={selectedPolytope}
            projectionMethod={projectionMethod}
            autoRotate={autoRotate}
            showInfo={true}
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Polytope selector */}
          <div className="p-4 rounded-lg" style={{ background: 'rgba(15, 15, 30, 0.7)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--violet)' }}>
              Polytope
            </h3>
            <div className="space-y-2">
              {polytopes.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedPolytope(p.name)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: selectedPolytope === p.name ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: selectedPolytope === p.name ? 'var(--violet)' : 'var(--secondary)',
                    border: selectedPolytope === p.name ? '1px solid rgba(167, 139, 250, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Projection method */}
          <div className="p-4 rounded-lg" style={{ background: 'rgba(15, 15, 30, 0.7)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--indigo)' }}>
              Projection
            </h3>
            <div className="space-y-2">
              {(['perspective', 'stereographic', 'orthographic'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setProjectionMethod(method)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all capitalize"
                  style={{
                    background: projectionMethod === method ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: projectionMethod === method ? 'var(--indigo)' : 'var(--secondary)',
                    border: projectionMethod === method ? '1px solid rgba(129, 140, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="p-4 rounded-lg" style={{ background: 'rgba(15, 15, 30, 0.7)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--gold)' }}>
              Settings
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: 'var(--secondary)' }}>
                Auto Rotate
              </span>
            </label>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-8 p-6 rounded-lg" style={{ background: 'rgba(15, 15, 30, 0.7)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Phase 1 Implementation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2" style={{ color: 'var(--violet)' }}>
                ✓ Completed
              </h4>
              <ul className="space-y-1" style={{ color: 'var(--secondary)' }}>
                <li>• Hyperspace.js integration</li>
                <li>• Clifford Algebra rotation system</li>
                <li>• 6 polytope definitions</li>
                <li>• 3 projection methods</li>
                <li>• Standalone test component</li>
                <li>• Modular architecture</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: 'var(--indigo)' }}>
                → Next Steps (Phase 2)
              </h4>
              <ul className="space-y-1" style={{ color: 'var(--secondary)' }}>
                <li>• Multi-plane rotation controls</li>
                <li>• 4 navigation modes</li>
                <li>• Smooth camera movement</li>
                <li>• Mode selection UI</li>
                <li>• Performance benchmarking</li>
                <li>• Mobile optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
