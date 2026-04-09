'use client'

import { useState, useEffect } from 'react'

export default function EntropyCollector({ 
  onComplete, 
  bytesNeeded = 18,
  title = "Channel Your Intent",
  description = "Move your cursor, swipe, or tap across the screen to generate somatic entropy. This harvests true randomness from your physical movements."
}: { 
  onComplete: (bytes: number[]) => void
  bytesNeeded?: number
  title?: string
  description?: string
}) {
  const [progress, setProgress] = useState(0)
  const REQUIRED_EVENTS = 150
  
  useEffect(() => {
    let events = 0
    let pool: number[] = new Array(bytesNeeded).fill(0)
    
    const handleEvent = (e: MouseEvent | TouchEvent) => {
      if (events >= REQUIRED_EVENTS) return
      
      let x = 0, y = 0
      if ('touches' in e && e.touches.length > 0) {
        x = e.touches[0].clientX
        y = e.touches[0].clientY
      } else if ('clientX' in e) {
        x = (e as MouseEvent).clientX
        y = (e as MouseEvent).clientY
      }
      
      const time = performance.now()
      const val = Math.floor(x * y + time) % 256
      
      // Mix entropy into the pool
      pool[events % bytesNeeded] ^= val
      pool[(events * 3) % bytesNeeded] ^= (val >> 1)
      
      events++
      setProgress(Math.min(100, (events / REQUIRED_EVENTS) * 100))
      
      if (events >= REQUIRED_EVENTS) {
        onComplete([...pool])
      }
    }
    
    window.addEventListener('mousemove', handleEvent)
    window.addEventListener('touchmove', handleEvent)
    window.addEventListener('click', handleEvent)
    
    return () => {
      window.removeEventListener('mousemove', handleEvent)
      window.removeEventListener('touchmove', handleEvent)
      window.removeEventListener('click', handleEvent)
    }
  }, [bytesNeeded, onComplete])

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-amber-500/30 rounded-2xl bg-[#0a0512] shadow-[0_0_30px_rgba(245,158,11,0.05)] w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-6">
        <h3 className="text-xl font-serif text-slate-200">{title}</h3>
        <p className="text-sm text-slate-400 font-serif italic leading-relaxed">
          {description}
        </p>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-100 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <p className="text-xs font-mono text-amber-500 uppercase tracking-widest">{Math.round(progress)}% Collected</p>
      </div>
    </div>
  )
}
