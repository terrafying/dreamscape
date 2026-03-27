import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion'

interface Testimonial {
  quote: string
  author: string
  role: string
  avatar: string
}

const testimonials: Testimonial[] = [
  {
    quote: 'Dreamscape helped me understand patterns I never noticed before.',
    author: 'Sarah M.',
    role: 'Dream Enthusiast',
    avatar: '◆',
  },
  {
    quote: 'Finding synchronicities with other dreamers was magical.',
    author: 'James K.',
    role: 'Spiritual Seeker',
    avatar: '★',
  },
  {
    quote: 'The AI interpretations are eerily accurate.',
    author: 'Emma L.',
    role: 'Psychology Student',
    avatar: '✦',
  },
]

/**
 * Testimonial Card - 10 second social media card
 * Perfect for Instagram, TikTok, Twitter
 */
export const TestimonialCard: React.FC = () => {
  const frame = useCurrentFrame()

  // Cycle through testimonials every 300 frames
  const testimonialIndex = Math.floor(frame / 300)
  const frameInTestimonial = frame % 300

  // Fade in (0-30 frames)
  const fadeIn = interpolate(frameInTestimonial, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Scale in (0-30 frames)
  const scaleIn = interpolate(frameInTestimonial, [0, 30], [0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  // Fade out (270-300 frames)
  const fadeOut = interpolate(frameInTestimonial, [270, 300], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const testimonial = testimonials[testimonialIndex % testimonials.length]
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
        padding: '60px 40px',
        overflow: 'hidden',
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
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
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          bottom: '-50px',
          right: '-50px',
          opacity: 0.5,
        }}
      />

      {/* Card Container */}
      <div
        style={{
          opacity,
          transform: `scale(${scaleIn})`,
          textAlign: 'center',
          maxWidth: '100%',
          zIndex: 10,
        }}
      >
        {/* Quote Mark */}
        <div
          style={{
            fontSize: '60px',
            color: '#a78bfa',
            marginBottom: '20px',
            opacity: 0.6,
          }}
        >
          "
        </div>

        {/* Quote */}
        <p
          style={{
            fontSize: '28px',
            color: '#e0e7ff',
            margin: '0 0 40px 0',
            lineHeight: '1.6',
            fontWeight: 300,
            fontStyle: 'italic',
          }}
        >
          {testimonial.quote}
        </p>

        {/* Avatar */}
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
            margin: '0 auto 20px auto',
          }}
        >
          {testimonial.avatar}
        </div>

        {/* Author */}
        <h3
          style={{
            fontSize: '20px',
            color: '#a78bfa',
            margin: '0 0 8px 0',
            fontWeight: 500,
            letterSpacing: '1px',
          }}
        >
          {testimonial.author}
        </h3>

        {/* Role */}
        <p
          style={{
            fontSize: '14px',
            color: '#a0aec0',
            margin: 0,
            letterSpacing: '1px',
          }}
        >
          {testimonial.role}
        </p>

        {/* Logo */}
        <div
          style={{
            marginTop: '40px',
            fontSize: '24px',
            color: '#a78bfa',
            letterSpacing: '2px',
          }}
        >
          ◇ DREAMSCAPE
        </div>
      </div>
    </AbsoluteFill>
  )
}
