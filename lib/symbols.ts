import curated from '@/data/symbols.json'
import type { DreamExtraction } from '@/lib/types'

function normalize(s: string) { return s.toLowerCase().trim() }

export function mergeCuratedSymbols(extraction: DreamExtraction): DreamExtraction {
  const byName = new Map<string, { meaning: string }>()
  for (const entry of curated as { name: string; aliases?: string[]; meaning: string }[]) {
    const names = [entry.name, ...(entry.aliases || [])]
    for (const n of names) byName.set(normalize(n), { meaning: entry.meaning })
  }
  const symbols = (extraction.symbols || []).map(s => {
    const hit = byName.get(normalize(s.name))
    if (!hit) return s
    // Blend curated meaning with model output when both exist
    const mergedMeaning = s.meaning && s.meaning.length > 40
      ? `${s.meaning}\n— ${hit.meaning}`
      : hit.meaning
    return { ...s, meaning: mergedMeaning }
  })
  return { ...extraction, symbols }
}
