import { describe, expect, it } from 'vitest'
import {
  buildExploreChambers,
  parseAttunedIds,
  serializeAttunedIds,
} from '@/lib/dreamscape-explore'
import type { DreamLog } from '@/lib/types'

describe('buildExploreChambers', () => {
  it('returns fallback when no symbols', () => {
    const chambers = buildExploreChambers([], [])
    expect(chambers.length).toBeGreaterThan(0)
    expect(chambers[0].symbolName).toBeTruthy()
  })

  it('dedupes symbols by normalized name and prefers higher salience', () => {
    const dreams: DreamLog[] = [
      {
        id: 'a',
        date: '2026-01-01',
        transcript: 'x',
        createdAt: Date.now(),
        extraction: {
          symbols: [
            { name: 'Library', salience: 0.5, category: 'x', meaning: 'low' },
          ],
          emotions: [],
          themes: [],
          characters: [],
          setting: { type: '', quality: '', time: '' },
          narrative_arc: 'liminal',
          lucidity: 0,
          tone: '',
          interpretation: '',
          astro_context: {
            moon_phase: '',
            moon_sign: '',
            cosmic_themes: [],
            transit_note: '',
            natal_aspects: [],
          },
          recommendations: [],
        },
      },
      {
        id: 'b',
        date: '2026-02-01',
        transcript: 'y',
        createdAt: Date.now() + 1000,
        extraction: {
          symbols: [
            { name: 'library', salience: 0.95, category: 'y', meaning: 'high meaning' },
          ],
          emotions: [],
          themes: [],
          characters: [],
          setting: { type: '', quality: '', time: '' },
          narrative_arc: 'liminal',
          lucidity: 0,
          tone: '',
          interpretation: '',
          astro_context: {
            moon_phase: '',
            moon_sign: '',
            cosmic_themes: [],
            transit_note: '',
            natal_aspects: [],
          },
          recommendations: [],
        },
      },
    ]
    const chambers = buildExploreChambers(dreams, [])
    const lib = chambers.find((c) => c.symbolName.toLowerCase() === 'library')
    expect(lib).toBeDefined()
    expect(lib!.meaning).toContain('high')
  })
})

describe('parseAttunedIds / serializeAttunedIds', () => {
  it('round-trips', () => {
    const a = new Set(['x', 'y'])
    expect(parseAttunedIds(serializeAttunedIds(a))).toEqual(a)
  })

  it('handles invalid json', () => {
    expect(parseAttunedIds('not-json').size).toBe(0)
  })
})
