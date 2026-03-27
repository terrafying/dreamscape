'use client'

import React, { useState } from 'react'
import { Player } from '@remotion/player'
import '@remotion/player/style.css'

interface RemotionPlayerProps {
  compositionId: string
  durationInFrames: number
  fps: number
  width: number
  height: number
  component: React.ComponentType
  autoPlay?: boolean
  loop?: boolean
  controls?: boolean
}

/**
 * Remotion Player component for embedding videos in the app
 * Supports all Remotion compositions
 */
export function RemotionPlayer({
  compositionId,
  durationInFrames,
  fps,
  width,
  height,
  component: Component,
  autoPlay = false,
  loop = true,
  controls = true,
}: RemotionPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  return (
    <div
      style={{
        width: '100%',
        maxWidth: `${width}px`,
        margin: '0 auto',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(167,139,250,0.2)',
      }}
    >
      <Player
        component={Component}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={fps}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        style={{
          width: '100%',
          height: 'auto',
        }}
      />
    </div>
  )
}
