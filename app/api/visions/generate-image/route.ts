import { generateImage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { checkAuth } from '@/lib/auth'
import { generateCacheKey, getCached, setCache } from '@/lib/cache'
import { buildVisionBoardPrompt } from '@/lib/image-prompts'
import type { VisionExtraction } from '@/lib/types'

export async function POST(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied

  const { extraction, model } = await req.json() as {
    extraction: VisionExtraction
    model?: string
  }

  const prompt = buildVisionBoardPrompt(extraction)
  const cacheKey = `vision_image_${generateCacheKey({ extraction, model: model || 'dall-e-3' })}`

  try {
    const cached = await getCached<string>(cacheKey)
    if (cached) {
      return Response.json({ ok: true, imageUrl: cached, prompt, cached: true })
    }

    const result = await generateImage({
      model: (openai as any).image(model || 'dall-e-3'),
      prompt,
    }) as { image?: { base64?: string; url?: string } }

    const raw = result?.image?.url || result?.image?.base64 || ''
    const imageUrl = raw.startsWith('http') ? raw : raw ? `data:image/png;base64,${raw}` : ''
    if (imageUrl) await setCache(cacheKey, imageUrl)
    return Response.json({ ok: true, imageUrl, prompt, cached: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
