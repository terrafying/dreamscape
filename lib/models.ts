/**
 * Central registry of every external model ID Dreamscape calls.
 *
 * Single source of truth: lib/llm.ts, lib/modelPreferences.ts,
 * lib/image-generation.ts and lib/tts-generation.ts all read from here.
 * Every default is overridable via env. Defaults are verified live
 * (see tests/live/providers.live.test.ts — run `npm run verify:providers`).
 *
 * Rules that keep this file honest:
 * - Never hardcode provider-internal version hashes (Replicate etc.).
 *   Use official model endpoints that resolve the latest version.
 * - Well-formedness is enforced by tests/lib/models.test.ts.
 */

const env = (name: string): string | undefined => {
  if (typeof process === 'undefined') return undefined
  const v = process.env?.[name]
  return v && v.trim() ? v : undefined
}

// ---------------------------------------------------------------------------
// Text (chat / LLM)
// ---------------------------------------------------------------------------

export const DEFAULT_TEXT_MODELS = {
  groq: 'openai/gpt-oss-120b',
  anthropic: 'claude-haiku-4-5',
  openai: 'gpt-4.1-mini',
  /** Must be a model served by the ChatGPT Codex backend. */
  openaiOauth: 'gpt-5.4-mini',
} as const

export const textModel = {
  groq: () => env('GROQ_MODEL') ?? DEFAULT_TEXT_MODELS.groq,
  anthropic: () => env('ANTHROPIC_MODEL') ?? DEFAULT_TEXT_MODELS.anthropic,
  openai: () => env('OPENAI_MODEL') ?? DEFAULT_TEXT_MODELS.openai,
  openaiOauth: () => env('OPENAI_OAUTH_MODEL') ?? DEFAULT_TEXT_MODELS.openaiOauth,
}

// ---------------------------------------------------------------------------
// Image generation (fallback order: replicate → gemini → openai)
// ---------------------------------------------------------------------------

export const DEFAULT_IMAGE_MODELS = {
  /** Flux Schnell via Replicate's official-model endpoint (no version hash). */
  replicate: 'black-forest-labs/flux-schnell',
  /** Gemini 2.5 Flash Image ("nano banana") via Vercel AI Gateway. */
  gemini: 'google/gemini-2.5-flash-image',
  /** dall-e is deprecated for current OpenAI accounts; gpt-image returns b64_json only. */
  openai: 'gpt-image-1-mini',
} as const

export const imageModel = {
  replicate: () => env('REPLICATE_IMAGE_MODEL') ?? DEFAULT_IMAGE_MODELS.replicate,
  // NANO_BANANA_MODEL kept for backward compatibility with existing deployments.
  gemini: () => env('GEMINI_IMAGE_MODEL') ?? env('NANO_BANANA_MODEL') ?? DEFAULT_IMAGE_MODELS.gemini,
  openai: () => env('OPENAI_IMAGE_MODEL') ?? DEFAULT_IMAGE_MODELS.openai,
}

// ---------------------------------------------------------------------------
// TTS (fallback order: elevenlabs → replicate)
// ---------------------------------------------------------------------------

export const DEFAULT_TTS_MODELS = {
  elevenlabs: 'eleven_multilingual_v2',
  /** MiniMax Speech 02 HD via Replicate's official-model endpoint. */
  replicate: 'minimax/speech-02-hd',
  /** Default MiniMax narrator voice (only used for the Replicate fallback). */
  replicateVoice: 'English_Wiselady',
} as const

export const ttsModel = {
  elevenlabs: () => env('ELEVENLABS_MODEL') ?? DEFAULT_TTS_MODELS.elevenlabs,
  replicate: () => env('REPLICATE_TTS_MODEL') ?? DEFAULT_TTS_MODELS.replicate,
  replicateVoice: () => env('REPLICATE_TTS_VOICE') ?? DEFAULT_TTS_MODELS.replicateVoice,
}
