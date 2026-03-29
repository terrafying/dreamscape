import { generateImage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { checkAuth } from '@/lib/auth'
import { buildVisionImagePrompt } from '@/lib/sigil'
import type { VisionExtraction } from '@/lib/types'

export async function POST(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied

  const { extraction, model } = await req.json() as {
    extraction: VisionExtraction
    model?: string
  }

  const prompt = buildVisionImagePrompt(
    extraction?.title || 'Vision Ritual',
    extraction?.distilled_intention || extraction?.invocation || 'A future-facing ceremonial intention',
    extraction?.visual_motifs || [],
    extraction?.color_palette || [],
  )

  try {
    const result = await generateImage({
      model: (openai as any).image(model || 'dall-e-3'),
      prompt,
    }) as { image?: { base64?: string; url?: string } }

    const raw = result?.image?.url || result?.image?.base64 || ''
    const imageUrl = raw.startsWith('http') ? raw : raw ? `data:image/png;base64,${raw}` : ''
    return Response.json({ ok: true, imageUrl, prompt })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
