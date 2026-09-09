import type { DreamLog } from '@/lib/types'
import { buildDreamCardPrompt, buildStoryCardPrompt } from '@/lib/image-prompts'
import { generateImageSmart, fetchImageAsBase64 } from '@/lib/image-generation'
import { checkRateLimit, rateLimitedResponse, readJsonWithLimit, RATE_MEDIA } from '@/lib/rateLimit'

interface CardOptions {
  dreams: DreamLog[]
  storyTitle?: string
  subtitle?: string
  provider?: string
  model?: string
}

export async function POST(req: Request) {
  const rate = checkRateLimit(req, 'generate-card', RATE_MEDIA)
  if (!rate.allowed) return rateLimitedResponse(rate.retryAfterSeconds)

  const parsed = await readJsonWithLimit(req, 100_000)
  if (!parsed.ok) return parsed.response
  const { dreams, storyTitle, subtitle } = parsed.body as CardOptions

  if (dreams !== undefined && !Array.isArray(dreams)) {
    return Response.json({ error: 'dreams must be an array' }, { status: 400 })
  }

  const isStory = !dreams?.length
  const { prompt, title } = isStory
    ? buildStoryCardPrompt({ dreams, storyTitle, subtitle })
    : buildDreamCardPrompt({ dreams, storyTitle, subtitle })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))

      try {
        send('status', { message: 'Rendering your dream card...' })

        // Provider chain: Replicate Flux Schnell → Gemini (AI Gateway) → OpenAI
        const result = await generateImageSmart(prompt)
        
        // Convert to base64 if needed
        let base64 = result.base64 || ''
        if (!base64 && result.url) {
          try {
            base64 = await fetchImageAsBase64(result.url)
          } catch (err) {
            console.error('Failed to convert image to base64:', err)
            // Fall back to URL
            base64 = result.url
          }
        }

        send('done', { 
          title, 
          base64,
          provider: result.provider,
          model: result.model,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        send('error', { message: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
