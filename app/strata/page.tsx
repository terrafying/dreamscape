'use client'

import { useState, useEffect } from 'react'
import type { DreamLog, BirthData } from '@/lib/types'
import { getDreams, getBirthData, saveBirthData, seedDemoDreams } from '@/lib/store'
import { getNatalPlacements, getCurrentTransits, getDominantTransit } from '@/lib/astro'
import EmotionTimeline from '@/components/charts/EmotionTimeline'
import ThemeRadar from '@/components/charts/ThemeRadar'
import SymbolFrequency from '@/components/charts/SymbolFrequency'
import LucidityTrend from '@/components/charts/LucidityTrend'
import LunarCalendar from '@/components/charts/LunarCalendar'
import AstroPanel from '@/components/AstroPanel'
import BirthDataModal from '@/components/BirthDataModal'

export default function StrataPage() {
  const [dreams, setDreams] = useState<DreamLog[]>([])
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [showBirthModal, setShowBirthModal] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([getDreams(), getBirthData()]).then(([d, bd]) => {
      setDreams(d)
      setBirthData(bd)
      setLoaded(true)
    })
  }, [])

  const natal = birthData ? getNatalPlacements(birthData) : null
  const today = new Date().toISOString().split('T')[0]
  const transits = getCurrentTransits(today)
  const dominant = getDominantTransit(today)

  const currentSky = {
    sunSign: transits.sunSign,
    moonSign: transits.moonSign,
    moonPhase: transits.moonPhase,
    moonPhaseEmoji: transits.moonPhaseEmoji,
    retrogrades: transits.retrogrades,
    dominantTransit: dominant,
  }

  const handleLoadDemo = async () => {
    await seedDemoDreams()
    setDreams(await getDreams())
  }

  const handleSaveBirth = (data: BirthData) => {
    saveBirthData(data)
    setBirthData(data)
    setShowBirthModal(false)
  }

  const withExtraction = dreams.filter((d) => d.extraction)
  const avgLucidity =
    withExtraction.length > 0
      ? (withExtraction.reduce((s, d) => s + (d.extraction!.lucidity || 0), 0) / withExtraction.length).toFixed(1)
      : null

  const emotionMap: Record<string, { sum: number; count: number }> = {}
  for (const d of withExtraction) {
    for (const em of d.extraction!.emotions || []) {
      if (!emotionMap[em.name]) emotionMap[em.name] = { sum: 0, count: 0 }
      emotionMap[em.name].sum += em.intensity
      emotionMap[em.name].count++
    }
  }
  const topEmotion = Object.entries(emotionMap)
    .map(([name, { sum, count }]) => ({ name, avg: sum / count }))
    .sort((a, b) => b.avg - a.avg)[0]

  return (
    <>
      {showBirthModal && (
        <BirthDataModal
          onSave={handleSaveBirth}
          onDismiss={() => setShowBirthModal(false)}
        />
      )}

      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1
              className="text-2xl font-medium tracking-tight"
              style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
            >
              Strata
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {withExtraction.length} analyzed dream{withExtraction.length !== 1 ? 's' : ''}
            </p>
          </div>
          {dreams.length === 0 && (
            <button
              onClick={handleLoadDemo}
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ border: '1px solid rgba(167,139,250,0.3)', color: 'var(--violet)' }}
            >
              Load demo dreams
            </button>
          )}
        </div>

        {/* Stats row */}
        {withExtraction.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Dreams" value={String(withExtraction.length)} />
            {avgLucidity && <StatCard label="Avg Lucidity" value={`${avgLucidity}/3`} />}
            {topEmotion && <StatCard label="Top Emotion" value={topEmotion.name} small />}
          </div>
        )}

        {/* Astro Panel */}
        <AstroPanel natal={natal} currentSky={currentSky} />

        {/* Birth chart prompt */}
        {!birthData && (
          <button
            onClick={() => setShowBirthModal(true)}
            className="w-full py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
            style={{ border: '1px dashed rgba(167,139,250,0.3)', color: 'var(--muted)' }}
          >
            ✦ Add birth chart for natal aspects
          </button>
        )}

        {/* Charts */}
        <div className="space-y-8">
          <ChartCard>
            <LunarCalendar dreams={dreams} />
          </ChartCard>

          <ChartCard>
            <EmotionTimeline dreams={withExtraction} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ChartCard>
              <ThemeRadar dreams={withExtraction} />
            </ChartCard>
            <ChartCard>
              <LucidityTrend dreams={withExtraction} />
            </ChartCard>
          </div>

          <ChartCard>
            <SymbolFrequency dreams={withExtraction} />
          </ChartCard>
        </div>

        {/* Load demo button (when has some dreams but wants more) */}
        {dreams.length > 0 && dreams.length < 7 && !dreams.some((d) => d.isExample) && (
          <button
            onClick={handleLoadDemo}
            className="w-full py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
            style={{ border: '1px dashed rgba(255,255,255,0.08)', color: 'var(--muted)' }}
          >
            + Load demo dreams to see fuller charts
          </button>
        )}
      </div>
    </>
  )
}

function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
    >
      {children}
    </div>
  )
}

function StatCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
    >
      <div
        className={`font-medium ${small ? 'text-sm' : 'text-xl'} mb-0.5`}
        style={{ color: 'var(--violet)' }}
      >
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}
