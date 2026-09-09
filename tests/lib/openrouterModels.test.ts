import { describe, it, expect } from 'vitest'
import {
  OPENROUTER_AUTO,
  budgetScore,
  isFreeModel,
  normalizeOpenRouterModels,
  rankOpenRouterCatalog,
} from '@/lib/openrouterModels'

const rec = (over: Record<string, unknown> = {}) => ({
  id: 'vendor/model',
  created: 1_700_000_000,
  architecture: { input_modalities: ['text'], output_modalities: ['text'] },
  pricing: { prompt: '0', completion: '0' },
  ...over,
})

describe('budget scoring', () => {
  it('flags :free and zero-priced models as free', () => {
    expect(isFreeModel(rec({ id: 'x/y:free', pricing: undefined }))).toBe(true)
    expect(isFreeModel(rec())).toBe(true)
  })

  it('scores free > cheap > expensive', () => {
    const free = budgetScore(rec())
    const cheap = budgetScore(rec({ pricing: { prompt: '0.0000002', completion: '0.0000002' } })) // $0.4/M
    const pricey = budgetScore(rec({ pricing: { prompt: '0.003', completion: '0.015' } }))
    expect(free).toBeGreaterThan(cheap)
    expect(cheap).toBeGreaterThan(pricey)
  })
})

describe('rankOpenRouterCatalog', () => {
  it('puts recent free models above older free models', () => {
    const models = [
      rec({ id: 'old/free:free', created: 1_600_000_000 }),
      rec({ id: 'new/free:free', created: 1_800_000_000 }),
    ]
    const ranked = rankOpenRouterCatalog({ data: models })
    expect(ranked[0].resolvedId).toBe('new/free:free')
  })

  it('a cheap paid model never outranks a free one of similar age', () => {
    const models = [
      rec({ id: 'paid/cheap', created: 1_800_000_001, pricing: { prompt: '0.0000001', completion: '0.0000001' } }),
      rec({ id: 'free/one', created: 1_800_000_000 }),
    ]
    const ranked = rankOpenRouterCatalog({ data: models })
    expect(ranked[0].resolvedId).toBe('free/one')
  })

  it('penalizes the openrouter/free meta-model below normal free models', () => {
    const models = [
      rec({ id: 'openrouter/free', created: 1_900_000_000 }),
      rec({ id: 'normal/free:free', created: 1_500_000_000 }),
    ]
    const ranked = rankOpenRouterCatalog({ data: models })
    expect(ranked[0].resolvedId).toBe('normal/free:free')
  })

  it('drops non-text and unnamed entries', () => {
    const models = [
      rec({ id: 'img/only', architecture: { input_modalities: ['text'], output_modalities: ['image'] } }),
      rec({ id: undefined, name: undefined }),
    ]
    expect(rankOpenRouterCatalog({ data: models })).toHaveLength(0)
  })
})

describe('normalizeOpenRouterModels', () => {
  it('always leads with the sticky default', () => {
    const ids = normalizeOpenRouterModels({ data: [rec({ id: 'new/free:free', created: 1_800_000_000 })] })
    expect(ids[0]).toBe('openai/gpt-oss-20b:free')
    expect(ids).toContain('new/free:free')
  })

  it('handles the bare-array payload shape', () => {
    const ids = normalizeOpenRouterModels([rec({ id: 'solo/model:free' })])
    expect(ids).toContain('solo/model:free')
  })

  it('auto sentinel is distinct from any real model id', () => {
    const ids = normalizeOpenRouterModels({ data: [] })
    expect(ids).not.toContain(OPENROUTER_AUTO)
  })
})
