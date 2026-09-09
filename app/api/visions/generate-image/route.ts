import { checkAuth } from '@/lib/auth'
import { checkRateLimit, rateLimitedResponse, readJsonWithLimit, RATE_MEDIA } from '@/lib/rateLimit'
import { generateCacheKey, getCached, setCache } from '@/lib/cache'
import { generateImageSmart } from '@/lib/image-generation'
import { buildVisionBoardPrompt } from '@/lib/image-prompts'
import type { VisionExtraction } from '@/lib/types'

export async function POST(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied

  const rate = checkRateLimit(req, 'visions-image', RATE_MEDIA)
  if (!rate.allowed) return rateLimitedResponse(rate.retryAfterSeconds)

  const parsed = await readJsonWithLimit(req, 50_000)
  if (!parsed.ok) return parsed.response
  const { extraction } = parsed.body as {
    extraction: VisionExtraction
  }

  const prompt = buildVisionBoardPrompt(extraction)
  const cacheKey = `vision_image_${generateCacheKey({ extraction })}`

  try {
    const cached = await getCached<string>(cacheKey)
    if (cached) {
      return Response.json({ ok: true, imageUrl: cached, prompt, cached: true })
    }

    const result = await generateImageSmart(prompt)
    const imageUrl = result.url
      || (result.base64 ? `data:${result.mediaType ?? 'image/png'};base64,${result.base64}` : '')
    if (imageUrl) await setCache(cacheKey, imageUrl)
    return Response.json({ ok: true, imageUrl, prompt, cached: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
