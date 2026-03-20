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

  it('returns nemotron-super as top pick by default', () => {
    const model = pickOpenRouterModel()
    expect(model).toBe('nvidia/nemotron-3-super-120b-a12b:free')
  })

  it('returns preferred model when available and not cooled', () => {
    const model = pickOpenRouterModel('qwen/qwen3-next-80b-a3b-instruct:free')
    expect(model).toBe('qwen/qwen3-next-80b-a3b-instruct:free')
  })

  it('falls back to next available when preferred is cooled', () => {
    markOpenRouterFailure('nvidia/nemotron-3-super-120b-a12b:free', 60)
    const model = pickOpenRouterModel('nvidia/nemotron-3-super-120b-a12b:free')
    expect(model).not.toBe('nvidia/nemotron-3-super-120b-a12b:free')
    expect(model).toBeTruthy()
  })
})

describe('markOpenRouterFailure', () => {
  it('prevents cooled model from being picked for the given duration', () => {
    markOpenRouterFailure('nvidia/nemotron-3-super-120b-a12b:free', 1)
    const model = pickOpenRouterModel()
    expect(model).not.toBe('nvidia/nemotron-3-super-120b-a12b:free')
  })
})

describe('markOpenRouterSuccess', () => {
  it('resets cool-down on success, restoring the model', () => {
    markOpenRouterFailure('nvidia/nemotron-3-super-120b-a12b:free', 60)
    expect(pickOpenRouterModel()).not.toBe('nvidia/nemotron-3-super-120b-a12b:free')
    markOpenRouterSuccess('nvidia/nemotron-3-super-120b-a12b:free')
    expect(pickOpenRouterModel()).toBe('nvidia/nemotron-3-super-120b-a12b:free')
  })
})
