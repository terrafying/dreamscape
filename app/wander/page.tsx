'use client'

import { useState, useEffect } from 'react'
import EntropyCollector from '@/components/EntropyCollector'
import { generateDreamwalkCoordinates } from '@/lib/dreamwalk'
import { generateId, saveDreamwalk } from '@/lib/store'
import type { DreamwalkExtraction, DreamwalkLog } from '@/lib/types'
import Link from 'next/link'

export default function WanderPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [intention, setIntention] = useState('')
  const [radius, setRadius] = useState<number>(2000) // Default 2km
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [target, setTarget] = useState<{ lat: number; lng: number } | null>(null)
  const [journal, setJournal] = useState('')
  const [extraction, setExtraction] = useState<DreamwalkExtraction | null>(null)
  const [isWeaving, setIsWeaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [locatingMsg, setLocatingMsg] = useState('')

  useEffect(() => {
    // Get user location early
    if (navigator.geolocation) {
      setLocatingMsg('Acquiring your coordinates...')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocatingMsg('')
        },
        (err) => {
          console.warn(err)
          setLocatingMsg('Location access denied. Using default coordinates (San Francisco) for demo.')
          setLocation({ lat: 37.7749, lng: -122.4194 })
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])

  const handleEntropyComplete = (bytes: number[]) => {
    if (!location) return
    const newTarget = generateDreamwalkCoordinates(location.lat, location.lng, radius, bytes)
    setTarget(newTarget)
    setStep(3)
  }

  const handleWeave = async () => {
    if (!target) return
    setIsWeaving(true)
    setExtraction(null)
    setStatusMsg('Connecting...')

    try {
      const res = await fetch('/api/wander', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intention, journal }),
      })

      if (!res.ok) throw new Error('Failed to weave narrative.')
      if (!res.body) throw new Error('No body returned.')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalExt: DreamwalkExtraction | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const event of events) {
          if (!event.trim()) continue
          const lines = event.split('\n')
          let eventType = ''
          let dataLine = ''
          for (const line of lines) {
            if (line.startsWith('event:')) eventType = line.slice(6).trim()
            if (line.startsWith('data:')) dataLine = line.slice(5).trim()
          }
          if (!dataLine) continue
          const data = JSON.parse(dataLine)

          if (eventType === 'status') {
            setStatusMsg(data.message)
          } else if (eventType === 'extraction') {
            finalExt = data.data
            setExtraction(finalExt)
          } else if (eventType === 'error') {
            throw new Error(data.message)
          }
        }
      }

      setStep(4)
      if (finalExt) {
        const log: DreamwalkLog = {
          id: generateId(),
          date: new Date().toISOString().split('T')[0],
          intention,
          coordinates: target,
          radius,
          journal,
          extraction: finalExt,
          createdAt: Date.now()
        }
        await saveDreamwalk(log)
      }
    } catch (err) {
      console.error(err)
      setStatusMsg('Failed to complete ritual.')
    } finally {
      setIsWeaving(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-28" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(10, 20, 20, 0.4) 0%, transparent 70%)' }}>
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-500/60" style={{ letterSpacing: '0.4em' }}>
            Wander
          </div>
          <h1 className="text-2xl font-normal text-emerald-100" style={{ fontFamily: '"IM Fell English", Georgia, serif', letterSpacing: '0.15em' }}>
            The Synchromystic Quest
          </h1>
          <p className="text-xs text-slate-400 font-serif italic">
            Manifesting intent through somatic entropy and geography.
          </p>
        </div>

        {locatingMsg && step === 1 && (
          <div className="text-xs font-mono text-center text-amber-500 animate-pulse">{locatingMsg}</div>
        )}

        {step === 1 && (
          <div className="rounded-xl p-6 bg-[#080b0c] border border-emerald-900/30 shadow-[0_0_20px_rgba(16,185,129,0.03)] animate-in fade-in zoom-in duration-500">
            <label className="block text-sm font-serif italic text-emerald-200/70 mb-4 text-center">
              What do you seek out there?
            </label>
            <textarea
              className="w-full bg-transparent border-b border-emerald-900/50 p-2 text-center font-serif text-lg text-emerald-50 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none placeholder:text-emerald-900/30"
              placeholder="e.g. A sign of change, something forgotten, a feeling of peace..."
              rows={2}
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
            />
            
            <div className="mt-8 flex flex-col items-center gap-2">
              <label className="text-xs font-mono uppercase tracking-wider text-emerald-500/50">Radius: {radius / 1000} km</label>
              <input 
                type="range" 
                min="500" 
                max="10000" 
                step="500"
                value={radius} 
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full max-w-xs accent-emerald-500"
              />
            </div>

            <button
              disabled={!intention.trim() || !location}
              onClick={() => setStep(2)}
              className="w-full mt-8 py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed border border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/20"
            >
              Prepare Coordinates
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <EntropyCollector 
              onComplete={handleEntropyComplete}
              title="Infuse Intent into Geography"
              description={`Hold "${intention}" in your mind. Move, swipe, or tap to channel somatic entropy. This chaos generates your destination.`}
              bytesNeeded={18}
            />
            <button 
              onClick={() => setStep(1)}
              className="block mx-auto mt-6 text-xs font-mono text-slate-500 hover:text-slate-400 underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 3 && target && (
          <div className="rounded-xl p-6 bg-[#080b0c] border border-emerald-900/30 shadow-[0_0_30px_rgba(16,185,129,0.05)] animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
            <div className="text-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/50 mb-1">Target Acquired</div>
              <div className="font-mono text-lg text-emerald-200">
                {target.lat.toFixed(5)}, {target.lng.toFixed(5)}
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full border border-emerald-500/30 text-xs font-mono text-emerald-400 hover:bg-emerald-900/30 transition-all"
              >
                Google Maps ↗
              </a>
              <a 
                href={`http://maps.apple.com/?daddr=${target.lat},${target.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full border border-emerald-500/30 text-xs font-mono text-emerald-400 hover:bg-emerald-900/30 transition-all"
              >
                Apple Maps ↗
              </a>
            </div>

            <div className="pt-6 border-t border-emerald-900/20">
              <label className="block text-sm font-serif italic text-emerald-200/70 mb-3 text-center">
                Journey there. What did you find?
              </label>
              <textarea
                className="w-full bg-[#040607] rounded-lg border border-emerald-900/30 p-3 text-sm font-serif text-emerald-50 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none placeholder:text-emerald-900/30 min-h-[120px]"
                placeholder="I saw an abandoned piano..."
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
              />
            </div>

            <button
              disabled={!journal.trim() || isWeaving}
              onClick={handleWeave}
              className="w-full py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-emerald-900/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-800/40"
            >
              {isWeaving ? statusMsg : 'Weave Narrative'}
            </button>
          </div>
        )}

        {step === 4 && extraction && (
          <div className="rounded-2xl p-8 bg-[#0a0f0d] border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div>
                <div className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-500/80 mb-2">
                  Your Journey
                </div>
                <h3 className="text-3xl font-serif text-emerald-50 drop-shadow-md">
                  {extraction.archetype}
                </h3>
              </div>

              <div className="text-left space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-1">The Meaning</div>
                  <p className="text-sm font-serif text-slate-300 leading-relaxed border-l-2 border-emerald-500/30 pl-3">
                    {extraction.meaning}
                  </p>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-1">The Insight</div>
                  <p className="text-sm font-serif text-slate-300 leading-relaxed border-l-2 border-emerald-500/30 pl-3">
                    {extraction.insight}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep(1)
                  setIntention('')
                  setJournal('')
                  setTarget(null)
                  setExtraction(null)
                }}
                className="mt-8 px-6 py-2 rounded-full font-mono text-xs tracking-wider uppercase border border-slate-700 text-slate-400 hover:text-slate-200 transition-all hover:bg-slate-800"
              >
                New Journey
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
