import { checkAuth } from '@/lib/auth'
import { checkRateLimit, rateLimitedResponse, readJsonWithLimit, RATE_MEDIA } from '@/lib/rateLimit'
import { generateCacheKey } from '@/lib/cache'
import { startAudioGeneration, getAudioPredictionStatus } from '@/lib/audio-generation'
import { buildVisionBoardPrompt } from '@/lib/image-prompts'
import type { VisionExtraction } from '@/lib/types'

/**
 * Resumable text-to-music for vision boards ("Soundtrack").
 *
 * POST with { extraction }      → starts a prediction, returns { predictionId }
 * POST with { predictionId }    → polls status, returns { status, audioUrl? }
 *
 * MusicGen takes ~1 min per clip, so the client polls; completed URLs are
 * cached server-side so revisits and refreshes resume instantly instead of
 * re-billing ($0.10/generation via meta/musicgen).
 */
export async function POST(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied

  const rate = checkRateLimit(req, 'visions-audio', RATE_MEDIA)
  if (!rate.allowed) return rateLimitedResponse(rate.retryAfterSeconds)

  const body = await req.json().catch(() => null) as {
    extraction?: VisionExtraction
    predictionId?: string
    cacheKeySeed?: string
    duration?: number
  } | null

  if (!body) return Response.json({ error: 'Invalid request body' }, { status: 400 })

  // Poll path.
  if (body.predictionId) {
    try {
      const result = await getAudioPredictionStatus(body.predictionId, body.cacheKeySeed)
      return Response.json({ ok: true, ...result })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Audio status check failed'
      return Response.json({ error: message }, { status: 500 })
    }
  }

  // Start path.
  if (!body.extraction) return Response.json({ error: 'Missing extraction or predictionId' }, { status: 400 })

  const prompt = buildVisionBoardPrompt(body.extraction)
  const cacheKeySeed = `vision_audio_${generateCacheKey({ extraction: body.extraction })}`

  try {
    const result = await startAudioGeneration(prompt, cacheKeySeed, { duration: body.duration })
    return Response.json({
      ok: true,
      predictionId: result.predictionId,
      status: result.status,
      model: result.model,
      modelVersion: result.modelVersion,
      prompt,
      cacheKeySeed,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audio generation failed to start'
    return Response.json({ error: message }, { status: 500 })
  }
}
