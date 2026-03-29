'use client'

import type { VisionExtraction } from '@/lib/types'

export default function VisionBoardCard({
  extraction,
  imageUrl,
  generating,
  onGenerate,
}: {
  extraction: VisionExtraction
  imageUrl?: string
  generating?: boolean
  onGenerate?: () => void
}) {
  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(15,15,26,0.72)', border: '1px solid rgba(244,201,93,0.16)' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'rgba(244,201,93,0.75)' }}>
            Vision Board
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            A future-facing image scaffolded from your symbols and ritual motifs.
          </p>
        </div>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-3 py-2 rounded-xl text-xs font-medium"
            style={{
              background: generating ? 'rgba(244,201,93,0.16)' : 'rgba(244,201,93,0.22)',
              color: generating ? 'rgba(244,201,93,0.55)' : '#f4c95d',
              border: '1px solid rgba(244,201,93,0.28)',
            }}
          >
            {generating ? 'Generating...' : imageUrl ? 'Regenerate Image' : 'Generate Image'}
          </button>
        )}
      </div>

      {imageUrl ? (
        <img src={imageUrl} alt={extraction.title} className="w-full rounded-2xl object-cover" style={{ maxHeight: 420, border: '1px solid rgba(255,255,255,0.08)' }} />
      ) : (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            minHeight: 240,
            background: 'radial-gradient(circle at 20% 20%, rgba(244,201,93,0.12), rgba(0,0,0,0) 42%), linear-gradient(160deg, rgba(20,14,36,0.98), rgba(10,10,18,0.92))',
            border: '1px dashed rgba(244,201,93,0.24)',
          }}
        >
          <div className="text-sm" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            {extraction.distilled_intention}
          </div>
          <div className="flex flex-wrap gap-2">
            {extraction.visual_motifs.map((motif) => (
              <span key={motif} className="px-2.5 py-1 rounded-full text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--muted)' }}>
                {motif}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        {extraction.ritual_steps.map((step) => (
          <div key={`${step.action}-${step.timing}`} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--violet)' }}>{step.timing}</div>
            <div className="mt-1 text-sm" style={{ color: 'var(--text)' }}>{step.action}</div>
            {step.why && <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{step.why}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
