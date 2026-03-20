import { describe, it, expect } from 'vitest'
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

describe('getDreams', () => {
  it('returns empty array when storage is empty', async () => {
    expect(await getDreams()).toEqual([])
  })

  it('returns empty array on malformed JSON', async () => {
    localStorage.setItem('dreamscape_dreams', '{not json}')
    expect(await getDreams()).toEqual([])
  })

  it('returns empty array when value is not an array', async () => {
    localStorage.setItem('dreamscape_dreams', '{"id":"x"}')
    expect(await getDreams()).toEqual([])
  })
})

describe('saveDream', () => {
  it('saves and retrieves a dream', async () => {
    const dream = makeDream({ transcript: 'A spiral staircase.' })
    await saveDream(dream)
    const dreams = await getDreams()
    expect(dreams).toHaveLength(1)
    expect(dreams[0].transcript).toBe('A spiral staircase.')
  })

  it('prepends new dreams (most recent first)', async () => {
    const a = makeDream({ id: 'a', createdAt: 1000 })
    const b = makeDream({ id: 'b', createdAt: 2000 })
    await saveDream(a)
    await saveDream(b)
    const dreams = await getDreams()
    expect(dreams[0].id).toBe('b')
    expect(dreams[1].id).toBe('a')
  })

  it('updates an existing dream in-place (same id)', async () => {
    const dream = makeDream({ id: 'x', transcript: 'Original.' })
    await saveDream(dream)
    await saveDream({ ...dream, transcript: 'Updated.' })
    const dreams = await getDreams()
    expect(dreams).toHaveLength(1)
    expect(dreams[0].transcript).toBe('Updated.')
  })

  it('preserves extraction when updating', async () => {
    const dream = makeDream({ id: 'x' })
    await saveDream(dream)
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
    await saveDream(withExtraction)
    const saved = (await getDreams())[0]
    expect(saved.extraction?.symbols[0].name).toBe('Water')
  })
})

describe('deleteDream', () => {
  it('removes a dream by id', async () => {
    const a = makeDream({ id: 'a' })
    const b = makeDream({ id: 'b' })
    await saveDream(a)
    await saveDream(b)
    await deleteDream('a')
    const dreams = await getDreams()
    expect(dreams).toHaveLength(1)
    expect(dreams[0].id).toBe('b')
  })

  it('is a no-op for unknown id', async () => {
    await saveDream(makeDream({ id: 'a' }))
    await deleteDream('nonexistent')
    expect(await getDreams()).toHaveLength(1)
  })
})

describe('clearExampleDreams', () => {
  it('removes only example dreams, preserving real ones', async () => {
    await saveDream(makeDream({ id: 'real', isExample: false }))
    await saveDream(makeDream({ id: 'example', isExample: true }))
    await clearExampleDreams()
    const dreams = await getDreams()
    expect(dreams).toHaveLength(1)
    expect(dreams[0].id).toBe('real')
  })
})

describe('getBirthData / saveBirthData', () => {
  it('returns null when nothing saved', async () => {
    expect(await getBirthData()).toBeNull()
  })

  it('saves and retrieves birth data', async () => {
    const bd: BirthData = { date: '1990-04-15', time: '14:30', location: 'New York, NY' }
    await saveBirthData(bd)
    expect(await getBirthData()).toEqual(bd)
  })

  it('returns null after clearBirthData', async () => {
    await saveBirthData({ date: '1990-04-15', location: 'London' })
    await clearBirthData()
    expect(await getBirthData()).toBeNull()
  })

  it('overwrites on second save', async () => {
    await saveBirthData({ date: '1990-04-15', location: 'Paris' })
    await saveBirthData({ date: '1992-07-04', location: 'Berlin' })
    expect((await getBirthData())?.location).toBe('Berlin')
  })
})

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

describe('seedDemoDreams', () => {
  it('seeds exactly 7 demo dreams', async () => {
    await seedDemoDreams()
    const examples = (await getDreams()).filter((d) => d.isExample)
    expect(examples).toHaveLength(7)
  })

  it('is idempotent and does not duplicate on second call', async () => {
    await seedDemoDreams()
    await seedDemoDreams()
    const examples = (await getDreams()).filter((d) => d.isExample)
    expect(examples).toHaveLength(7)
  })

  it('seeded dreams all have extractions', async () => {
    await seedDemoDreams()
    const examples = (await getDreams()).filter((d) => d.isExample)
    for (const dream of examples) expect(dream.extraction).toBeDefined()
  })

  it('does not remove existing real dreams', async () => {
    await saveDream(makeDream({ id: 'real' }))
    await seedDemoDreams()
    const real = (await getDreams()).find((d) => d.id === 'real')
    expect(real).toBeDefined()
  })
})
