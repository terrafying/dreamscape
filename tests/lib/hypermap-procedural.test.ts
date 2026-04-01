import { describe, expect, it } from 'vitest'
import { mulberry32, roomLabelsForSeed } from '@/lib/hypermap/procedural'

describe('hypermap procedural', () => {
  it('mulberry32 is deterministic', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect(a()).toBe(b())
    expect(a()).toBe(b())
  })

  it('roomLabelsForSeed returns 16 unique labels for a fixed seed', () => {
    const labels = roomLabelsForSeed(12345)
    expect(labels).toHaveLength(16)
    expect(new Set(labels).size).toBe(16)
  })

  it('different seeds permute differently', () => {
    const a = roomLabelsForSeed(1)
    const b = roomLabelsForSeed(2)
    expect(a).not.toEqual(b)
  })
})
