/**
 * Music / ambient audio generation via Replicate (Meta MusicGen).
 *
 * Follows the media-generation conventions from lib/models.ts, but with one
 * important divergence discovered live: meta/musicgen does NOT support
 * Replicate's official-model endpoint (/models/meta/musicgen/predictions →
 * 404). We resolve the model's latest_version at call time instead — still
 * no hardcoded hashes, the id comes fresh from the API on every start.
 *
 * MusicGen renders seconds of audio in roughly a minute — too long for one
 * request. Same contract as lib/video-generation.ts: start returns a
 * prediction id, callers poll, completed URLs are cached so a repeat click
 * resumes instead of re-billing ($0.10 per generation as of Aug 2026).
 */

import { audioModel } from '@/lib/models'
import { generateCacheKey, getCached, setCache } from '@/lib/cache'
import { trackGeneration } from '@/lib/observability'

const REPLICATE_API = 'https://api.replicate.com/v1'

export type AudioPredictionStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'

export interface AudioStartResult {
  predictionId: string
  status: AudioPredictionStatus
  model: string
  modelVersion: string
}

export interface AudioStatusResult {
  status: AudioPredictionStatus
  audioUrl?: string
  error?: string
  model: string
  modelVersion: string
}

export interface AudioStartOptions {
  duration?: number
  /** MusicGen variant: stereo-melody-large (default) | stereo-large | large | melody-large | medium | small */
  modelVersion?: string
  outputFormat?: string
}

function authHeaders(key: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  }
}

function requireToken(): string {
  const key = process.env.REPLICATE_API_TOKEN
  if (!key) throw new Error('REPLICATE_API_TOKEN is not set')
  return key
}

interface ReplicatePrediction {
  id?: string
  status?: AudioPredictionStatus
  output?: string | string[]
  error?: string
  urls?: { get?: string }
}

/**
 * Resolve the model's latest version id. Meta's versioned-only quirk means
 * this replaces the official-model endpoint used by image/video/TTS.
 */
async function resolveLatestVersionId(key: string, model: string): Promise<string> {
  const res = await fetch(`${REPLICATE_API}/models/${model}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Replicate model lookup failed (${res.status}) for ${model}`)
  const data = (await res.json()) as { latest_version?: { id?: string } }
  const versionId = data.latest_version?.id
  if (!versionId) throw new Error(`Replicate: no latest_version for ${model}`)
  return versionId
}

/**
 * Kick off a text-to-music prediction. Cheap: returns after Replicate accepts
 * the job, before any audio renders. Completed audio is cached by prompt; a
 * repeat click resumes instantly instead of burning another $0.10.
 */
export async function startAudioGeneration(prompt: string, cacheKeySeed?: string, opts: AudioStartOptions = {}): Promise<AudioStartResult> {
  const key = requireToken()
  const model = audioModel.replicate()
  const modelVersion = opts.modelVersion?.trim() || audioModel.replicateVersion()
  const outputFormat = opts.outputFormat?.trim() || audioModel.replicateFormat()
  const duration = Math.min(Math.max(Math.round(opts.duration ?? 8), 1), 30)

  const cacheKey = `audio_${generateCacheKey({ prompt, modelVersion, duration })}`
  const cached = await getCached<string>(cacheKeySeed ? `audio_${generateCacheKey(cacheKeySeed)}` : cacheKey)
  if (cached) {
    // Synthesize an already-succeeded prediction so the poll path returns it.
    return { predictionId: `cached:${cacheKeySeed ? `audio_${generateCacheKey(cacheKeySeed)}` : cacheKey}`, status: 'succeeded', model, modelVersion }
  }

  const versionId = await resolveLatestVersionId(key, model)

  const res = await fetch(`${REPLICATE_API}/predictions`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify({
      version: versionId,
      input: {
        prompt,
        duration,
        model_version: modelVersion,
        output_format: outputFormat,
        normalization_strategy: 'loudness',
      },
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({})) as { title?: string; detail?: string }
    if (res.status === 402) {
      throw new Error('Replicate credit exhausted — top up at replicate.com/account/billing to generate audio')
    }
    throw new Error(`Replicate start failed (${res.status}): ${JSON.stringify(error)}`)
  }

  const prediction = await res.json() as ReplicatePrediction
  if (!prediction.id) throw new Error('Replicate: no prediction id in response')
  return { predictionId: prediction.id, status: prediction.status ?? 'starting', model, modelVersion }
}

/**
 * Poll a prediction. On success, stores the audio URL in cache under the
 * prompt's key so later starts short-circuit.
 */
export async function getAudioPredictionStatus(predictionId: string, cacheKeySeed?: string): Promise<AudioStatusResult> {
  const model = audioModel.replicate()
  const modelVersion = audioModel.replicateVersion()

  if (predictionId.startsWith('cached:')) {
    const cacheKey = predictionId.slice('cached:'.length)
    const url = await getCached<string>(cacheKey)
    if (url) return { status: 'succeeded', audioUrl: url, model, modelVersion }
    return { status: 'failed', error: 'Cached audio missing — restart generation', model, modelVersion }
  }

  const key = requireToken()
  const res = await fetch(`${REPLICATE_API}/predictions/${predictionId}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`Replicate status check failed (${res.status})`)
  }

  const prediction = await res.json() as ReplicatePrediction

  if (prediction.status === 'succeeded') {
    const output = prediction.output
    const audioUrl = Array.isArray(output) ? output[0] : output
    if (!audioUrl || typeof audioUrl !== 'string') {
      trackGeneration({ kind: 'audio', provider: model, modelVersion, outcome: 'error' })
      return { status: 'failed', error: 'Replicate: no audio URL in output', model, modelVersion }
    }
    if (cacheKeySeed) {
      await setCache(`audio_${generateCacheKey(cacheKeySeed)}`, audioUrl)
    }
    trackGeneration({ kind: 'audio', provider: model, modelVersion, outcome: 'success' })
    return { status: 'succeeded', audioUrl, model, modelVersion }
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    trackGeneration({ kind: 'audio', provider: model, modelVersion, outcome: 'error' })
    return { status: prediction.status, error: prediction.error ?? `Prediction ${prediction.status}`, model, modelVersion }
  }

  return { status: prediction.status ?? 'processing', model, modelVersion }
}
