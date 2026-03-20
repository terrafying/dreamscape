import { experimental_generateImage as generateImage } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { DreamLog } from '@/lib/types'

interface CardOptions {
  dreams: DreamLog[]
  storyTitle?: string
  provider?: string
  model?: string
}

function buildCardPrompt(opts: CardOptions): { prompt: string; title: string } {
  const recent = opts.dreams.slice(0, 3)
  const dominantSymbol = recent[0]?.extraction?.symbols?.[0]?.name ?? 'moon'
  const setting = recent[0]?.extraction?.setting?.type ?? 'vast open spaces'
  const tone = recent[0]?.extraction?.tone ?? 'mysterious and contemplative'
  const arc = recent[0]?.extraction?.narrative_arc ?? 'liminal'
  const emotion = recent[0]?.extraction?.emotions?.[0]?.name ?? 'wonder'

  const titleMap: Record<string, string> = {
    ascending: 'The Ascent',
    descending: 'The Descent',
    cyclical: 'The Return',
    liminal: 'The Threshold',
    transformational: 'The Becoming',
  }
  const title = opts.storyTitle
    || (titleMap[arc] ?? 'The Dream')

  const symbolDescs: Record<string, string> = {
    Library: 'an ancient floating library of silver and obsidian books, moonlight streaming through stained glass windows',
    'Glass City': 'a city of translucent glass towers reflecting a violet twilight sky',
    'Childhood Home': 'a vast familiar house with rooms that extend into forest and sky',
    'Deep Ocean': 'an ocean of liquid starlight, luminous creatures drifting in crystalline depths',
    Maze: 'a labyrinth of living hedges in perpetual golden-hour light, paths rearranging slowly',
    Snake: 'a serpent of liquid gold coiled beneath a sacred fig tree, light radiating from within',
    Flight: 'wings of light soaring over a dreamlike cityscape, shadows far below',
    Concert: 'a concert hall of light where music is visible as color and shape',
    default: `a single ${dominantSymbol.toLowerCase()} glowing with ethereal light in a cosmic landscape`,
  }

  const symbolDesc = symbolDescs[dominantSymbol] || symbolDescs.default

  const sceneMap: Record<string, string> = {
    Interior: 'inside a grand dreamlike chamber',
    Aerial: 'floating in a vast dream sky above clouds',
    Oceanic: 'at the surface of an infinite dream ocean',
    Domestic: 'in a home that opens into impossible landscapes',
    Labyrinth: 'within a shifting eternal space',
    default: `in ${setting.toLowerCase()}`,
  }
  const scene = sceneMap[setting] || sceneMap.default

  const prompt = `A single tarot card illustration. ${symbolDesc}, ${scene}.

Style: dark atmospheric fantasy illustration. Deep indigo and midnight blue dominate. Luminescent gold, violet, and silver accents. Ethereal mist. Stars. The ${emotion.toLowerCase()} mood is palpable — ${tone}.

Details: fine art illustration, cinematic composition, hyper-detailed, 8k, ethereal lighting, dreamlike atmosphere. Wide border with subtle geometric sacred geometry in silver. The composition is centered and balanced.`

  return { prompt, title }
}

function buildStoryCardPrompt(opts: CardOptions): { prompt: string; title: string } {
  const title = opts.storyTitle || 'Sleep Story'
  return {
    title,
    prompt: `A single tarot card illustration. A serene dreamer floats in a cosmic sleep between two worlds — below, a dark peaceful earth with distant city lights; above, a violet starfield with a luminous path.

Style: dark atmospheric fantasy illustration. Deep indigo and midnight blue dominate. Luminescent gold, violet, and silver accents. Ethereal mist. Stars. Peaceful, contemplative, liminal mood.

Details: fine art illustration, cinematic composition, hyper-detailed, 8k, ethereal lighting, dreamlike atmosphere. Wide border with subtle geometric sacred geometry in silver. The composition is centered and balanced.`,
  }
}

export async function POST(req: Request) {
  const { dreams, storyTitle, provider, model } = await req.json() as CardOptions

  const isStory = !dreams?.length
  const { prompt, title } = isStory
    ? buildStoryCardPrompt({ dreams, storyTitle })
    : buildCardPrompt({ dreams, storyTitle })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))

      try {
        send('status', { message: 'Rendering your dream card...' })

        const imgModel = model || 'dall-e-3'

        const result = await generateImage({
          model: openai.image(imgModel),
          prompt,
        })

        const images = (result as any).images as Array<{ base64?: string; url?: string }>
        const raw = images?.[0]?.base64 ?? images?.[0]?.url ?? ''

        send('done', { title, base64: raw })
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
      'X-Accel-Buffering': 'no',
    },
  })
}
