/**
 * Video generation via Replicate's official-model endpoint.
 *
 * Mirrors lib/image-generation.ts: the model id comes from lib/models.ts
 * (never a hardcoded version hash — official endpoints resolve the latest
 * version server-side), and the whole thing is env-overridable.
 *
 * Video predictions run minutes, not seconds — too long for one request.
 * Callers get the prediction id back immediately, poll GET for status, and
 * completed outputs are cached so a refresh resumes where it left off.
 */

import { videoModel } from '@/lib/models'
import { generateCacheKey, getCached, setCache } from '@/lib/cache'
import { trackGeneration } from '@/lib/observability'

const REPLICATE_API = 'https://api.replicate.com/v1'

export type VideoPredictionStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'

export interface VideoStartResult {
  predictionId: string
  status: VideoPredictionStatus
  model: string
}

export interface VideoStatusResult {
  status: VideoPredictionStatus
  videoUrl?: string
  error?: string
  model: string
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

/**
 * Kick off a text-to-video prediction. Cheap: returns after Replicate accepts
 * the job, before any frames render.
 */
export async function startVideoGeneration(prompt: string, cacheKeySeed?: string): Promise<VideoStartResult> {
  const key = requireToken()
  const model = videoModel.replicate()

  // Completed videos are cached by prompt; a repeat click resumes instantly
  // instead of burning another prediction.
  const cacheKey = `video_${generateCacheKey(cacheKeySeed ?? prompt)}`
  const cached = await getCached<string>(cacheKey)
  if (cached) {
    // Synthesize an already-succeeded prediction so the poll path returns it.
    return { predictionId: `cached:${cacheKey}`, status: 'succeeded', model }
  }

  const res = await fetch(`${REPLICATE_API}/models/${model}/predictions`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify({
      input: {
        prompt,
        duration: 5,
        resolution: '768p',
      },
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(`Replicate start failed (${res.status}): ${JSON.stringify(error)}`)
  }

  const prediction = await res.json() as { id?: string; status?: VideoPredictionStatus }
  if (!prediction.id) throw new Error('Replicate: no prediction id in response')
  return { predictionId: prediction.id, status: prediction.status ?? 'starting', model }
}

/**
 * Poll a prediction. On success, stores the video URL in cache under the
 * prompt's key so later starts short-circuit.
 */
export async function getVideoPredictionStatus(predictionId: string, cacheKeySeed?: string): Promise<VideoStatusResult> {
  const model = videoModel.replicate()

  if (predictionId.startsWith('cached:')) {
    const cacheKey = predictionId.slice('cached:'.length)
    const url = await getCached<string>(cacheKey)
    if (url) return { status: 'succeeded', videoUrl: url, model }
    return { status: 'failed', error: 'Cached video missing — restart generation', model }
  }

  const key = requireToken()
  const res = await fetch(`${REPLICATE_API}/predictions/${predictionId}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`Replicate status check failed (${res.status})`)
  }

  const prediction = await res.json() as {
    status: VideoPredictionStatus
    output?: string | string[]
    error?: string
  }

  if (prediction.status === 'succeeded') {
    const output = prediction.output
    const videoUrl = Array.isArray(output) ? output[0] : output
    if (!videoUrl || typeof videoUrl !== 'string') {
      trackGeneration({ kind: 'video', provider: model, outcome: 'error' })
      return { status: 'failed', error: 'Replicate: no video URL in output', model }
    }
    if (cacheKeySeed) {
      await setCache(`video_${generateCacheKey(cacheKeySeed)}`, videoUrl)
    }
    trackGeneration({ kind: 'video', provider: model, outcome: 'success' })
    return { status: 'succeeded', videoUrl, model }
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    trackGeneration({ kind: 'video', provider: model, outcome: 'error' })
    return { status: prediction.status, error: prediction.error ?? `Prediction ${prediction.status}`, model }
  }

  return { status: prediction.status, model }
}
