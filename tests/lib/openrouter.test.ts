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

  it('returns gpt-oss-20b as top pick by default', () => {
    const model = pickOpenRouterModel()
    expect(model).toBe('openai/gpt-oss-20b:free')
  })

  it('returns preferred model when available and not cooled', () => {
    const model = pickOpenRouterModel('nvidia/nemotron-3-super-120b-a12b:free')
    expect(model).toBe('nvidia/nemotron-3-super-120b-a12b:free')
  })

  it('falls back to next available when preferred is cooled', () => {
    markOpenRouterFailure('openai/gpt-oss-20b:free', 60)
    const model = pickOpenRouterModel('openai/gpt-oss-20b:free')
    expect(model).not.toBe('openai/gpt-oss-20b:free')
    expect(model).toBeTruthy()
  })
})

describe('markOpenRouterFailure', () => {
  it('prevents cooled model from being picked for the given duration', () => {
    markOpenRouterFailure('openai/gpt-oss-20b:free', 1)
    const model = pickOpenRouterModel()
    expect(model).not.toBe('openai/gpt-oss-20b:free')
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
