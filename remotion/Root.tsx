import React from 'react'
import { Composition } from 'remotion'
import { DreamIntro } from './compositions/DreamIntro'
import { FeatureShowcase } from './compositions/FeatureShowcase'
import { SynchronicityDemo } from './compositions/SynchronicityDemo'
import { TestimonialCard } from './compositions/TestimonialCard'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Dream Intro - 15 seconds */}
      <Composition
        id="DreamIntro"
        component={DreamIntro}
        durationInFrames={450}
        fps={30}
        width={1280}
        height={720}
      />

      {/* Feature Showcase - 30 seconds */}
      <Composition
        id="FeatureShowcase"
        component={FeatureShowcase}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />

      {/* Synchronicity Demo - 20 seconds */}
      <Composition
        id="SynchronicityDemo"
        component={SynchronicityDemo}
        durationInFrames={600}
        fps={30}
        width={1280}
        height={720}
      />

      {/* Testimonial Card - 10 seconds */}
      <Composition
        id="TestimonialCard"
        component={TestimonialCard}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  )
}
