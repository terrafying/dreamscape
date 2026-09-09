import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import {
  pickOpenRouterModel,
  markOpenRouterFailure,
  markOpenRouterSuccess,
} from '@/lib/openrouter'
import { OPENROUTER_AUTO } from '@/lib/openrouterModels'

beforeEach(() => {
  process.env.OPENROUTER_MODEL = ''
  delete process.env.OPENROUTER_MODEL
})

describe('pickOpenRouterModel', () => {
  afterEach(() => { vi.resetModules(); mockFetch.mockReset() })

  it('returns gpt-oss-20b as top pick by default', () => {
    const model = pickOpenRouterModel()
    expect(model).toBe('openai/gpt-oss-20b:free')
  })

  it('returns preferred model when available and not cooled', () => {
    const model = pickOpenRouterModel('nvidia/nemotron-3-super-120b-a12b:free')
    expect(model).toBe('nvidia/nemotron-3-super-120b-a12b:free')
  })

  it("resolves the 'auto' sentinel through the live ranking", () => {
    const model = pickOpenRouterModel(OPENROUTER_AUTO)
    expect(model).not.toBe(OPENROUTER_AUTO)
    expect(model).toBeTruthy()
  })

  it('resolves blank model like auto', () => {
    const model = pickOpenRouterModel('   ')
    expect(model).toBeTruthy()
    expect(model).not.toBe('   ')
  })

  it('falls back to next available when preferred is cooled', () => {
    markOpenRouterFailure('openai/gpt-oss-20b:free', 60)
    const model = pickOpenRouterModel('openai/gpt-oss-20b:free')
    expect(model).not.toBe('openai/gpt-oss-20b:free')
    expect(model).toBeTruthy()
  })

  it('honors unknown preferred models optimistically (failure cooldown corrects)', () => {
    const niche = 'some-vendor/brand-new-model:free'
    expect(pickOpenRouterModel(niche)).toBe(niche)
  })

  it('OPENROUTER_MODEL env pins the auto resolution', () => {
    process.env.OPENROUTER_MODEL = 'qwen/qwen3-coder:free'
    expect(pickOpenRouterModel()).toBe('qwen/qwen3-coder:free')
    expect(pickOpenRouterModel(OPENROUTER_AUTO)).toBe('qwen/qwen3-coder:free')
    // Explicit non-auto choice still wins over the pin.
    expect(pickOpenRouterModel('nvidia/nemotron-3-super-120b-a12b:free')).toBe('nvidia/nemotron-3-super-120b-a12b:free')
  })
})

describe('markOpenRouterFailure', () => {
  it('prevents cooled model from being picked for the given duration', () => {
    markOpenRouterFailure('openai/gpt-oss-20b:free', 1)
    const model = pickOpenRouterModel()
    expect(model).not.toBe('openai/gpt-oss-20b:free')
  })

  it('cooldowns apply to unknown models too', () => {
    const niche = 'some-vendor/one-shot-model'
    markOpenRouterFailure(niche, 30)
    expect(pickOpenRouterModel(niche)).not.toBe(niche)
  })
})

describe('markOpenRouterSuccess', () => {
  it('resets cool-down on success, restoring the model', () => {
    markOpenRouterFailure('openai/gpt-oss-20b:free', 60)
    expect(pickOpenRouterModel()).not.toBe('openai/gpt-oss-20b:free')
    markOpenRouterSuccess('openai/gpt-oss-20b:free')
    expect(pickOpenRouterModel()).toBe('openai/gpt-oss-20b:free')
  })
})
