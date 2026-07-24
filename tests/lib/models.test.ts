import { describe, it, expect, afterEach } from 'vitest'
import {
  DEFAULT_TEXT_MODELS,
  DEFAULT_IMAGE_MODELS,
  DEFAULT_TTS_MODELS,
  textModel,
  imageModel,
  ttsModel,
} from '@/lib/models'

const ALL_DEFAULTS = {
  ...DEFAULT_TEXT_MODELS,
  ...DEFAULT_IMAGE_MODELS,
  ...DEFAULT_TTS_MODELS,
} as Record<string, string>

const ENV_VARS = [
  'GROQ_MODEL', 'ANTHROPIC_MODEL', 'OPENAI_MODEL', 'OPENAI_OAUTH_MODEL',
  'REPLICATE_IMAGE_MODEL', 'GEMINI_IMAGE_MODEL', 'NANO_BANANA_MODEL', 'OPENAI_IMAGE_MODEL',
  'ELEVENLABS_MODEL', 'REPLICATE_TTS_MODEL', 'REPLICATE_TTS_VOICE',
]

afterEach(() => {
  for (const v of ENV_VARS) delete process.env[v]
})

describe('model registry defaults', () => {
  it('all defaults are non-empty strings', () => {
    for (const [name, value] of Object.entries(ALL_DEFAULTS)) {
      expect(value, name).toBeTruthy()
      expect(typeof value, name).toBe('string')
      expect(value.trim(), name).not.toBe('')
    }
  })

  it('no default looks like a hardcoded provider version hash (the 422 bug class)', () => {
    for (const [name, value] of Object.entries(ALL_DEFAULTS)) {
      expect(value, name).not.toMatch(/^[0-9a-f]{40,}$/i)
    }
  })

  it('replicate models use owner/name form (official-model endpoints)', () => {
    expect(DEFAULT_IMAGE_MODELS.replicate).toMatch(/^[a-z0-9-]+\/[a-z0-9._-]+$/i)
    expect(DEFAULT_TTS_MODELS.replicate).toMatch(/^[a-z0-9-]+\/[a-z0-9._-]+$/i)
  })

  it('documents the expected defaults', () => {
    expect(DEFAULT_TEXT_MODELS.groq).toBe('openai/gpt-oss-120b')
    expect(DEFAULT_TEXT_MODELS.anthropic).toBe('claude-haiku-4-5')
    expect(DEFAULT_TEXT_MODELS.openai).toBe('gpt-4.1-mini')
    expect(DEFAULT_TEXT_MODELS.openaiOauth).toBe('gpt-5.4-mini')
    expect(DEFAULT_IMAGE_MODELS.replicate).toBe('black-forest-labs/flux-schnell')
    expect(DEFAULT_IMAGE_MODELS.gemini).toBe('google/gemini-2.5-flash-image')
    expect(DEFAULT_IMAGE_MODELS.openai).toBe('gpt-image-1-mini')
    expect(DEFAULT_TTS_MODELS.elevenlabs).toBe('eleven_multilingual_v2')
    expect(DEFAULT_TTS_MODELS.replicate).toBe('minimax/speech-02-hd')
  })
})

describe('env overrides', () => {
  it('textModel respects GROQ_MODEL / ANTHROPIC_MODEL / OPENAI_MODEL / OPENAI_OAUTH_MODEL', () => {
    process.env.GROQ_MODEL = 'groq-x'
    process.env.ANTHROPIC_MODEL = 'claude-x'
    process.env.OPENAI_MODEL = 'gpt-x'
    process.env.OPENAI_OAUTH_MODEL = 'gpt-5-x'
    expect(textModel.groq()).toBe('groq-x')
    expect(textModel.anthropic()).toBe('claude-x')
    expect(textModel.openai()).toBe('gpt-x')
    expect(textModel.openaiOauth()).toBe('gpt-5-x')
  })

  it('imageModel respects overrides and the NANO_BANANA_MODEL legacy alias', () => {
    process.env.REPLICATE_IMAGE_MODEL = 'owner/flux-x'
    process.env.OPENAI_IMAGE_MODEL = 'gpt-image-x'
    expect(imageModel.replicate()).toBe('owner/flux-x')
    expect(imageModel.openai()).toBe('gpt-image-x')

    process.env.NANO_BANANA_MODEL = 'google/legacy-alias'
    expect(imageModel.gemini()).toBe('google/legacy-alias')
    process.env.GEMINI_IMAGE_MODEL = 'google/preferred'
    expect(imageModel.gemini()).toBe('google/preferred')
  })

  it('ttsModel respects overrides', () => {
    process.env.ELEVENLABS_MODEL = 'eleven_v3'
    process.env.REPLICATE_TTS_MODEL = 'owner/tts-x'
    process.env.REPLICATE_TTS_VOICE = 'Narrator_X'
    expect(ttsModel.elevenlabs()).toBe('eleven_v3')
    expect(ttsModel.replicate()).toBe('owner/tts-x')
    expect(ttsModel.replicateVoice()).toBe('Narrator_X')
  })

  it('blank env values fall back to defaults', () => {
    process.env.GROQ_MODEL = '   '
    expect(textModel.groq()).toBe(DEFAULT_TEXT_MODELS.groq)
  })
})
