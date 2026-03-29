import { generateImage } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { DreamLog } from '@/lib/types'
import { buildDreamCardPrompt, buildStoryCardPrompt } from '@/lib/image-prompts'

interface CardOptions {
  dreams: DreamLog[]
  storyTitle?: string
  subtitle?: string
  provider?: string
  model?: string
}

export async function POST(req: Request) {
  const { dreams, storyTitle, subtitle, model } = await req.json() as CardOptions

  const isStory = !dreams?.length
  const { prompt, title } = isStory
    ? buildStoryCardPrompt({ dreams, storyTitle, subtitle })
    : buildDreamCardPrompt({ dreams, storyTitle, subtitle })

  const imgModel = (model || 'dall-e-3').replace('dall-e-', 'dall-e-')
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))

      try {
        send('status', { message: 'Rendering your dream card...' })

        const result = await generateImage({
          model: (openai as any).image(imgModel),
          prompt,
        }) as { image?: { base64?: string; url?: string } }

        const raw = result?.image?.base64 ?? result?.image?.url ?? ''

        send('done', { title, base64: raw })
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
