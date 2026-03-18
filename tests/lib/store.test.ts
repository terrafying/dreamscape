import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDreams,
  saveDream,
  deleteDream,
  clearExampleDreams,
  getBirthData,
  saveBirthData,
  clearBirthData,
  generateId,
  seedDemoDreams,
} from '@/lib/store'
import type { DreamLog, BirthData } from '@/lib/types'

function makeDream(overrides: Partial<DreamLog> = {}): DreamLog {
  return {
    id: generateId(),
    date: '2026-03-16',
    transcript: 'I was in a forest.',
    createdAt: Date.now(),
    ...overrides,
  }
}

// ─── getDreams ────────────────────────────────────────────────────────────────

describe('getDreams', () => {
  it('returns empty array when storage is empty', () => {
    expect(getDreams()).toEqual([])
  })

  it('returns empty array on malformed JSON', () => {
    localStorage.setItem('dreamscape_dreams', '{not json}')
    expect(getDreams()).toEqual([])
  })

  it('returns empty array when value is not an array', () => {
    localStorage.setItem('dreamscape_dreams', '{"id":"x"}')
    expect(getDreams()).toEqual([])
  })
})

// ─── saveDream / getDreams roundtrip ──────────────────────────────────────────

describe('saveDream', () => {
  it('saves and retrieves a dream', () => {
    const dream = makeDream({ transcript: 'A spiral staircase.' })
    saveDream(dream)
    const dreams = getDreams()
    expect(dreams).toHaveLength(1)
    expect(dreams[0].transcript).toBe('A spiral staircase.')
  })

  it('prepends new dreams (most recent first)', () => {
    const a = makeDream({ id: 'a', createdAt: 1000 })
    const b = makeDream({ id: 'b', createdAt: 2000 })
    saveDream(a)
    saveDream(b)
    const dreams = getDreams()
    expect(dreams[0].id).toBe('b')
    expect(dreams[1].id).toBe('a')
  })

  it('updates an existing dream in-place (same id)', () => {
    const dream = makeDream({ id: 'x', transcript: 'Original.' })
    saveDream(dream)
    saveDream({ ...dream, transcript: 'Updated.' })
    const dreams = getDreams()
    expect(dreams).toHaveLength(1)
    expect(dreams[0].transcript).toBe('Updated.')
  })

  it('preserves extraction when updating', () => {
    const dream = makeDream({ id: 'x' })
    saveDream(dream)
    const withExtraction: DreamLog = {
      ...dream,
      extraction: {
        symbols: [{ name: 'Water', salience: 0.9, category: 'Element', meaning: 'The unconscious' }],
        emotions: [],
        themes: [],
        characters: [],
        setting: { type: 'Ocean', quality: 'Vast', time: 'Night' },
        narrative_arc: 'descending',
        lucidity: 1,
        tone: 'serene',
        interpretation: 'A test dream.',
        astro_context: {
          moon_phase: 'Full Moon',
          moon_sign: 'Pisces',
          cosmic_themes: [],
          transit_note: '',
          natal_aspects: [],
        },
        recommendations: [],
      },
    }
    saveDream(withExtraction)
    const saved = getDreams()[0]
    expect(saved.extraction?.symbols[0].name).toBe('Water')
  })
})

// ─── deleteDream ──────────────────────────────────────────────────────────────

describe('deleteDream', () => {
  it('removes a dream by id', () => {
    const a = makeDream({ id: 'a' })
    const b = makeDream({ id: 'b' })
    saveDream(a)
    saveDream(b)
    deleteDream('a')
    const dreams = getDreams()
    expect(dreams).toHaveLength(1)
    expect(dreams[0].id).toBe('b')
  })

  it('is a no-op for unknown id', () => {
    saveDream(makeDream({ id: 'a' }))
    deleteDream('nonexistent')
    expect(getDreams()).toHaveLength(1)
  })
})

// ─── clearExampleDreams ───────────────────────────────────────────────────────

describe('clearExampleDreams', () => {
  it('removes only example dreams, preserving real ones', () => {
    saveDream(makeDream({ id: 'real', isExample: false }))
    saveDream(makeDream({ id: 'example', isExample: true }))
    clearExampleDreams()
    const dreams = getDreams()
    expect(dreams).toHaveLength(1)
    expect(dreams[0].id).toBe('real')
  })
})

// ─── BirthData ────────────────────────────────────────────────────────────────

describe('getBirthData / saveBirthData', () => {
  it('returns null when nothing saved', () => {
    expect(getBirthData()).toBeNull()
  })

  it('saves and retrieves birth data', () => {
    const bd: BirthData = { date: '1990-04-15', time: '14:30', location: 'New York, NY' }
    saveBirthData(bd)
    expect(getBirthData()).toEqual(bd)
  })

  it('returns null after clearBirthData', () => {
    saveBirthData({ date: '1990-04-15', location: 'London' })
    clearBirthData()
    expect(getBirthData()).toBeNull()
  })

  it('overwrites on second save', () => {
    saveBirthData({ date: '1990-04-15', location: 'Paris' })
    saveBirthData({ date: '1992-07-04', location: 'Berlin' })
    expect(getBirthData()?.location).toBe('Berlin')
  })
})

// ─── generateId ───────────────────────────────────────────────────────────────

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

// ─── seedDemoDreams ───────────────────────────────────────────────────────────

describe('seedDemoDreams', () => {
  it('seeds exactly 7 demo dreams', () => {
    seedDemoDreams()
    const examples = getDreams().filter((d) => d.isExample)
    expect(examples).toHaveLength(7)
  })

  it('is idempotent — does not duplicate on second call', () => {
    seedDemoDreams()
    seedDemoDreams()
    const examples = getDreams().filter((d) => d.isExample)
    expect(examples).toHaveLength(7)
  })

  it('seeded dreams all have extractions', () => {
    seedDemoDreams()
    const examples = getDreams().filter((d) => d.isExample)
    for (const dream of examples) {
      expect(dream.extraction).toBeDefined()
    }
  })

  it('does not remove existing real dreams', () => {
    saveDream(makeDream({ id: 'real' }))
    seedDemoDreams()
    const real = getDreams().find((d) => d.id === 'real')
    expect(real).toBeDefined()
  })
})
