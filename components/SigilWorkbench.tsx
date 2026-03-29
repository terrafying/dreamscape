'use client'

import type { VisionExtraction } from '@/lib/types'
import VisionSigil from '@/components/VisionSigil'

export default function SigilWorkbench({ extraction }: { extraction: VisionExtraction }) {
  return (
    <div
      className="rounded-2xl p-4 space-y-4"
      style={{
        background: 'linear-gradient(160deg, rgba(14,14,28,0.96), rgba(28,18,42,0.88))',
        border: '1px solid rgba(167,139,250,0.22)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--violet)' }}>
            Sigil Workbench
          </div>
          <h3 className="mt-1 text-lg" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
            {extraction.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {extraction.invocation}
          </p>
        </div>
        <div className="hidden sm:flex gap-1.5">
          {extraction.color_palette.map((color) => (
            <span key={color} className="w-5 h-5 rounded-full border" style={{ background: color, borderColor: 'rgba(255,255,255,0.18)' }} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[240px_1fr] items-center">
        <div className="mx-auto w-full max-w-[240px] aspect-square rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(244,201,93,0.14)' }}>
          <VisionSigil recipe={extraction.sigil_recipe} className="w-full h-full" />
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'rgba(244,201,93,0.75)' }}>
              Letter Condensation
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--text)', fontFamily: 'monospace' }}>
              {extraction.sigil_recipe.glyph_letters.join(' · ')}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              Source: {extraction.sigil_recipe.source_phrase}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Symmetry" value={String(extraction.sigil_recipe.geometry.symmetry)} />
            <Stat label="Rings" value={String(extraction.sigil_recipe.geometry.rings)} />
            <Stat label="Spokes" value={String(extraction.sigil_recipe.geometry.spokes)} />
            <Stat label="Seal" value={extraction.sigil_recipe.style.border_mode} />
          </div>

          {extraction.themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {extraction.themes.map((theme) => (
                <span
                  key={theme}
                  className="px-2.5 py-1 rounded-full text-xs"
                  style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', color: 'rgba(226,232,240,0.82)' }}
                >
                  {theme}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="mt-1" style={{ color: 'var(--text)' }}>{value}</div>
    </div>
  )
}
