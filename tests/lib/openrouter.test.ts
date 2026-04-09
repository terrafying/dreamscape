import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import {
  pickOpenRouterModel,
  markOpenRouterFailure,
  markOpenRouterSuccess,
} from '@/lib/openrouter'

describe('pickOpenRouterModel', () => {
  afterEach(() => { vi.resetModules(); mockFetch.mockReset() })

  it('returns gemma-4 as top pick by default', () => {
    const model = pickOpenRouterModel()
    expect(model).toBe('google/gemma-4-31b-it:free')
  })

  it('returns preferred model when available and not cooled', () => {
    const model = pickOpenRouterModel('qwen/qwen3-next-80b-a3b-instruct:free')
    expect(model).toBe('qwen/qwen3-next-80b-a3b-instruct:free')
  })

  it('falls back to next available when preferred is cooled', () => {
    markOpenRouterFailure('google/gemma-4-31b-it:free', 60)
    const model = pickOpenRouterModel('google/gemma-4-31b-it:free')
    expect(model).not.toBe('google/gemma-4-31b-it:free')
    expect(model).toBeTruthy()
  })
})

describe('markOpenRouterFailure', () => {
  it('prevents cooled model from being picked for the given duration', () => {
    markOpenRouterFailure('google/gemma-4-31b-it:free', 1)
    const model = pickOpenRouterModel()
    expect(model).not.toBe('google/gemma-4-31b-it:free')
  })
})

describe('markOpenRouterSuccess', () => {
  it('resets cool-down on success, restoring the model', () => {
    markOpenRouterFailure('google/gemma-4-31b-it:free', 60)
    expect(pickOpenRouterModel()).not.toBe('google/gemma-4-31b-it:free')
    markOpenRouterSuccess('google/gemma-4-31b-it:free')
    expect(pickOpenRouterModel()).toBe('google/gemma-4-31b-it:free')
  })
})
