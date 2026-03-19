import { callLLM, type LLMProvider } from '@/lib/llm'
import type { DreamLog, BirthData } from '@/lib/types'
import { generateCacheKey, getCached, setCache } from '@/lib/cache'
import { checkAuth } from '@/lib/auth'


function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied
  const { dreams, birthData, date, provider, model } = (await req.json()) as {
    dreams: DreamLog[]
    birthData?: BirthData | null
    date: string
    provider?: LLMProvider
    model?: string
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)))

      try {
        send('status', { message: 'Drawing from your dream world...' })

        // Extract recurring symbols & themes from recent dreams
        const recentDreams = dreams.slice(0, 6)
        
        const payloadStr = JSON.stringify(recentDreams) + date + (provider || '') + (model || '')
        const cacheKey = `story_${generateCacheKey(payloadStr)}`
        const cached = await getCached<string>(cacheKey)

        if (cached) {
          send('status', { message: 'Recalling your sleep story...' })
          send('story', { text: cached })
          send('done', {})
          controller.close()
          return
        }

        const symbols = recentDreams
          .flatMap((d) => d.extraction?.symbols?.map((s) => s.name) ?? [])
          .slice(0, 12)
          .join(', ') || 'water, light, unknown spaces'

        const themes = recentDreams
          .flatMap((d) => d.extraction?.themes?.map((t) => t.name) ?? [])
          .slice(0, 8)
          .join(', ') || 'transformation, mystery'

        const settings = recentDreams
          .map((d) => d.extraction?.setting?.type)
          .filter(Boolean)
          .slice(0, 4)
          .join(', ') || 'vast open spaces'

        const tone = recentDreams[0]?.extraction?.tone ?? 'contemplative'

        send('status', { message: 'Weaving your sleep story...' })

        const prompt = `You are a master of hypnagogic storytelling — writing sleep stories designed to gently carry the reader from waking into deep, restful sleep. Your stories draw on the reader's own dream symbols and landscape to create something that feels personally resonant and deeply familiar.

Using these recurring elements from the dreamer's recent dreams:
- Symbols: ${symbols}
- Themes: ${themes}
- Settings: ${settings}
- Overall tone: ${tone}

Write a gentle, immersive sleep story in three short chapters (each 80-120 words). Use second person ("you"). The story should:
- Begin in a recognizable, peaceful version of one of their recurring settings
- Gradually slow in pace as it progresses — longer sentences, softer imagery
- Weave in 2-3 of their symbols naturally
- End in a state of complete rest, with the protagonist gently drifting into dreamless sleep
- Never be alarming, urgent, or energetic
- Read like a guided meditation, but feel like a story

Format:
Chapter I: [title]
[text]

Chapter II: [title]
[text]

Chapter III: [title]
[text]`

        const text = await callLLM(prompt, {
          provider: provider ?? 'anthropic',
          model,
          maxTokens: 800,
        })

        await setCache(cacheKey, text)
        send('story', { text })
        send('done', {})
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : 'Generation failed' })
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
    },
  })
}
