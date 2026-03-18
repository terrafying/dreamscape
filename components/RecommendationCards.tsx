'use client'

interface Recommendation {
  action: string
  timing: string
  why: string
}

interface RecommendationCardsProps {
  recommendations: Recommendation[]
}

const TIMING_COLORS: Record<string, string> = {
  Today: '#f87171',
  Immediately: '#f87171',
  'This week': '#fbbf24',
  'Now': '#f87171',
  Ongoing: '#a78bfa',
  Tomorrow: '#fb923c',
}

function getTimingColor(timing: string): string {
  for (const [key, color] of Object.entries(TIMING_COLORS)) {
    if (timing.toLowerCase().includes(key.toLowerCase())) return color
  }
  return '#818cf8'
}

export default function RecommendationCards({ recommendations }: RecommendationCardsProps) {
  if (!recommendations?.length) return null

  return (
    <div className="space-y-3">
      <div
        className="text-xs font-mono uppercase tracking-widest"
        style={{ color: 'var(--gold)', letterSpacing: '0.15em' }}
      >
        ◈ Waking Actions
      </div>
      <div className="space-y-2">
        {recommendations.map((rec, i) => {
          const timingColor = getTimingColor(rec.timing)
          return (
            <div
              key={i}
              className="rounded-xl p-4 space-y-2"
              style={{
                background: 'rgba(15, 15, 26, 0.8)',
                border: `1px solid rgba(251, 191, 36, 0.15)`,
                borderLeft: `3px solid ${timingColor}`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>
                  {rec.action}
                </p>
                <span
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full font-mono whitespace-nowrap"
                  style={{
                    background: `${timingColor}18`,
                    color: timingColor,
                    border: `1px solid ${timingColor}40`,
                  }}
                >
                  {rec.timing}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {rec.why}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
