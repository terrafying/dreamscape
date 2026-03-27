import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion'

interface Dreamer {
  name: string
  symbol: string
  avatar: string
}

const dreamers: Dreamer[] = [
  { name: 'Luna', symbol: '🌙', avatar: '◆' },
  { name: 'Phoenix', symbol: '🔥', avatar: '★' },
  { name: 'River', symbol: '💧', avatar: '✦' },
]

/**
 * Synchronicity Demo - 20 second animation showing dream matching
 */
export const SynchronicityDemo: React.FC = () => {
  const frame = useCurrentFrame()

  // Title fade in (0-30 frames)
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Dreamer cards appear sequentially
  const dreamer1Opacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const dreamer1Scale = interpolate(frame, [60, 90], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const dreamer2Opacity = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const dreamer2Scale = interpolate(frame, [120, 150], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const dreamer3Opacity = interpolate(frame, [180, 210], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const dreamer3Scale = interpolate(frame, [180, 210], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // Symbol pulse (240-300 frames)
  const symbolScale = interpolate(frame, [240, 270, 300], [1, 1.2, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })

  // Match text fade in (320-350 frames)
  const matchOpacity = interpolate(frame, [320, 350], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Final fade out (550-600 frames)
  const finalOpacity = interpolate(frame, [550, 600], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Georgia, serif',
        overflow: 'hidden',
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity * finalOpacity,
          marginBottom: '80px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '48px',
            color: '#a78bfa',
            margin: 0,
            letterSpacing: '2px',
          }}
        >
          ✦ Synchronicity
        </h2>
        <p
          style={{
            fontSize: '18px',
            color: '#a0aec0',
            margin: '10px 0 0 0',
          }}
        >
          Same symbols, same night
        </p>
      </div>

      {/* Dreamer Cards */}
      <div
        style={{
          display: 'flex',
          gap: '40px',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '60px',
        }}
      >
        {/* Dreamer 1 */}
        <div
          style={{
            opacity: dreamer1Opacity * finalOpacity,
            transform: `scale(${dreamer1Scale})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(167,139,250,0.2)',
              border: '2px solid rgba(167,139,250,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              marginBottom: '12px',
            }}
          >
            {dreamers[0].avatar}
          </div>
          <p style={{ margin: 0, color: '#e0e7ff', fontSize: '14px' }}>
            {dreamers[0].name}
          </p>
        </div>

        {/* Dreamer 2 */}
        <div
          style={{
            opacity: dreamer2Opacity * finalOpacity,
            transform: `scale(${dreamer2Scale})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(236,72,153,0.2)',
              border: '2px solid rgba(236,72,153,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              marginBottom: '12px',
            }}
          >
            {dreamers[1].avatar}
          </div>
          <p style={{ margin: 0, color: '#e0e7ff', fontSize: '14px' }}>
            {dreamers[1].name}
          </p>
        </div>

        {/* Dreamer 3 */}
        <div
          style={{
            opacity: dreamer3Opacity * finalOpacity,
            transform: `scale(${dreamer3Scale})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(6,182,212,0.2)',
              border: '2px solid rgba(6,182,212,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              marginBottom: '12px',
            }}
          >
            {dreamers[2].avatar}
          </div>
          <p style={{ margin: 0, color: '#e0e7ff', fontSize: '14px' }}>
            {dreamers[2].name}
          </p>
        </div>
      </div>

      {/* Central Symbol */}
      <div
        style={{
          opacity: finalOpacity,
          transform: `scale(${symbolScale})`,
          fontSize: '120px',
          marginBottom: '40px',
          textShadow: '0 0 40px rgba(167,139,250,0.4)',
        }}
      >
        💧
      </div>

      {/* Match Text */}
      <div
        style={{
          opacity: matchOpacity * finalOpacity,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '24px',
            color: '#a78bfa',
            margin: 0,
            letterSpacing: '1px',
          }}
        >
          You matched with 3 dreamers on "Water"
        </p>
      </div>
    </AbsoluteFill>
  )
}
