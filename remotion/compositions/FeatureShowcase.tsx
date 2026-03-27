import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion'

interface Feature {
  icon: string
  title: string
  description: string
  color: string
}

const features: Feature[] = [
  {
    icon: '✦',
    title: 'AI Dream Interpretation',
    description: 'Unlock the hidden meanings in your dreams with advanced AI analysis',
    color: '#a78bfa',
  },
  {
    icon: '◇',
    title: 'Synchronicity Matching',
    description: 'Discover dreamers who experienced the same symbols on the same night',
    color: '#ec4899',
  },
  {
    icon: '★',
    title: 'Tarot Oracle Cards',
    description: 'Receive guidance through Crowley\'s Thoth tarot archetypes',
    color: '#f59e0b',
  },
  {
    icon: '◆',
    title: 'Dream Circles',
    description: 'Share dreams privately with close friends and explore together',
    color: '#06b6d4',
  },
]

/**
 * Feature Showcase - 30 second feature carousel
 */
export const FeatureShowcase: React.FC = () => {
  const frame = useCurrentFrame()

  // Each feature gets ~7.5 seconds (225 frames)
  const featureIndex = Math.floor(frame / 225)
  const frameInFeature = frame % 225

  // Fade in (0-30 frames)
  const fadeIn = interpolate(frameInFeature, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Slide in from left (0-30 frames)
  const slideX = interpolate(frameInFeature, [0, 30], [-100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // Fade out (195-225 frames)
  const fadeOut = interpolate(frameInFeature, [195, 225], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const currentFeature = features[featureIndex % features.length]
  const opacity = fadeIn * fadeOut

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
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${currentFeature.color}15 0%, transparent 70%)`,
          borderRadius: '50%',
          opacity: 0.5,
        }}
      />

      {/* Feature Card */}
      <div
        style={{
          opacity,
          transform: `translateX(${slideX}px)`,
          textAlign: 'center',
          maxWidth: '600px',
          padding: '60px 40px',
          zIndex: 10,
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: '80px',
            marginBottom: '30px',
            color: currentFeature.color,
            textShadow: `0 0 30px ${currentFeature.color}40`,
          }}
        >
          {currentFeature.icon}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '48px',
            fontWeight: 'normal',
            margin: '0 0 20px 0',
            color: '#e0e7ff',
            letterSpacing: '1px',
          }}
        >
          {currentFeature.title}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '20px',
            color: '#a0aec0',
            margin: 0,
            lineHeight: '1.6',
            fontWeight: 300,
          }}
        >
          {currentFeature.description}
        </p>
      </div>

      {/* Feature counter */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          color: '#64748b',
          fontSize: '14px',
          letterSpacing: '2px',
        }}
      >
        {featureIndex + 1} / {features.length}
      </div>
    </AbsoluteFill>
  )
}
