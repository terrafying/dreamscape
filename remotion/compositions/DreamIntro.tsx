import React from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing } from 'remotion'

/**
 * Dream Intro - 15 second opening video
 * Animated title sequence with mystical theme
 */
export const DreamIntro: React.FC = () => {
  const frame = useCurrentFrame()

  // Title fade in (0-30 frames)
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Title scale (0-30 frames)
  const titleScale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // Subtitle fade in (60-90 frames)
  const subtitleOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Subtitle slide up (60-90 frames)
  const subtitleY = interpolate(frame, [60, 90], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // CTA fade in (150-180 frames)
  const ctaOpacity = interpolate(frame, [150, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // CTA scale (150-180 frames)
  const ctaScale = interpolate(frame, [150, 180], [0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // Final fade out (400-450 frames)
  const finalOpacity = interpolate(frame, [400, 450], [1, 0], {
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
      {/* Animated background orbs */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          top: '-100px',
          left: '-100px',
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          bottom: '-50px',
          right: '-50px',
          opacity: 0.5,
        }}
      />

      {/* Main Title */}
      <div
        style={{
          opacity: titleOpacity * finalOpacity,
          transform: `scale(${titleScale})`,
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 'normal',
            margin: 0,
            color: '#a78bfa',
            letterSpacing: '4px',
            textShadow: '0 0 30px rgba(167,139,250,0.3)',
          }}
        >
          ◇ DREAMSCAPE
        </h1>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity * finalOpacity,
          transform: `translateY(${subtitleY}px)`,
          textAlign: 'center',
          marginBottom: '60px',
        }}
      >
        <p
          style={{
            fontSize: '24px',
            color: '#e0e7ff',
            margin: 0,
            fontWeight: 300,
            letterSpacing: '2px',
          }}
        >
          Where Dreams Meet Synchronicity
        </p>
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity * finalOpacity,
          transform: `scale(${ctaScale})`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            padding: '16px 40px',
            border: '2px solid rgba(167,139,250,0.4)',
            borderRadius: '8px',
            color: '#a78bfa',
            fontSize: '16px',
            fontWeight: 500,
            letterSpacing: '2px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 20px rgba(167,139,250,0.1)',
          }}
        >
          EXPLORE NOW
        </div>
      </div>
    </AbsoluteFill>
  )
}
