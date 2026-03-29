import { callLLMWithSource, type LLMProvider } from '@/lib/llm'
import { buildAstroContext, getCurrentTransits } from '@/lib/astro'
import { generateCacheKey, getCached, setCache } from '@/lib/cache'
import { checkAuth } from '@/lib/auth'
import { buildSigilRecipe } from '@/lib/sigil'
import type { BirthData, VisionExtraction } from '@/lib/types'

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function asStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values
    .map((value) => {
      if (typeof value === 'string') return value.trim()
      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>
        for (const key of ['name', 'meaning', 'title', 'label']) {
          if (typeof record[key] === 'string') return record[key].trim()
        }
      }
      return ''
    })
    .filter(Boolean)
}

function normalizeExtraction(raw: unknown): VisionExtraction {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const colorPalette = asStringArray(data.color_palette).slice(0, 4)
  const intention = typeof data.distilled_intention === 'string' && data.distilled_intention.trim()
    ? data.distilled_intention.trim()
    : 'I call my future into form with clarity and devotion.'
  const sigilRecipe = buildSigilRecipe(
    typeof data.invocation === 'string' && data.invocation.trim() ? data.invocation.trim() : intention,
    colorPalette,
  )

  const symbols = Array.isArray(data.symbols)
    ? data.symbols
        .map((value) => {
          const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
          const name = typeof record.name === 'string' ? record.name.trim() : ''
          if (!name) return null
          return {
            name,
            salience: typeof record.salience === 'number' ? Math.max(0, Math.min(1, record.salience)) : 0.65,
            category: typeof record.category === 'string' ? record.category : 'symbol',
            meaning: typeof record.meaning === 'string' ? record.meaning : '',
          }
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    : []

  const emotions = Array.isArray(data.emotions)
    ? data.emotions
        .map((value) => {
          const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
          const name = typeof record.name === 'string' ? record.name.trim() : ''
          if (!name) return null
          return {
            name,
            intensity: typeof record.intensity === 'number' ? Math.max(0, Math.min(1, record.intensity)) : 0.65,
            valence: typeof record.valence === 'number' ? Math.max(-1, Math.min(1, record.valence)) : 0.35,
          }
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    : []

  const blockers = Array.isArray(data.blockers)
    ? data.blockers
        .map((value) => {
          const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
          const name = typeof record.name === 'string' ? record.name.trim() : ''
          if (!name) return null
          return {
            name,
            reframing: typeof record.reframing === 'string' ? record.reframing : '',
            action: typeof record.action === 'string' ? record.action : '',
          }
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    : []

  const ritualSteps = Array.isArray(data.ritual_steps)
    ? data.ritual_steps
        .map((value) => {
          const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
          const action = typeof record.action === 'string' ? record.action.trim() : ''
          if (!action) return null
          return {
            action,
            timing: typeof record.timing === 'string' ? record.timing : 'this week',
            why: typeof record.why === 'string' ? record.why : '',
          }
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    : []

  return {
    title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Vision Ritual',
    distilled_intention: intention,
    invocation: typeof data.invocation === 'string' && data.invocation.trim() ? data.invocation.trim() : intention,
    symbols: symbols.slice(0, 6),
    emotions: emotions.slice(0, 5),
    themes: asStringArray(data.themes).slice(0, 5),
    blockers: blockers.slice(0, 4),
    visual_motifs: asStringArray(data.visual_motifs).slice(0, 6),
    color_palette: colorPalette.length > 0 ? colorPalette : ['#f4c95d', '#c084fc', '#94a3b8'],
    ritual_steps: ritualSteps.slice(0, 4),
    sigil_recipe: sigilRecipe,
  }
}

export async function POST(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied

  const { transcript, date, birthData, provider, model } = (await req.json()) as {
    transcript: string
    date: string
    birthData?: BirthData | null
    provider?: LLMProvider
    model?: string
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)))
      }

      try {
        send('status', { message: 'Condensing your vision...' })

        const astroCtx = buildAstroContext(date, birthData)
        const transits = getCurrentTransits(date)
        const payloadStr = transcript + date + (birthData?.date || '') + (provider || '') + (model || '')
        const cacheKey = `vision_extract_${generateCacheKey(payloadStr)}`
        const cached = await getCached<VisionExtraction>(cacheKey)

        if (cached) {
          send('status', { message: 'Restoring your ritual from the archive...' })
          send('extraction', { data: cached })
          send('done', {})
          controller.close()
          return
        }

        send('status', { message: 'Tracing the symbolic pattern...' })

        const prompt = `You are an esoteric creative guide helping a user distill a future-facing desire into a symbolic vision ritual. Draw influence from classical sigil principles, ceremonial symbolism, theosophy, the Golden Dawn, and Austin Osman Spare, but keep the result psychologically grounded and creatively useful rather than dogmatic.

Current date: ${date}
Astrological context:
${astroCtx}

Current sky facts:
- Moon phase: ${transits.moonPhase}
- Moon sign: ${transits.moonSign}

---
VISION TRANSCRIPT:
${transcript}
---

Return a JSON object matching EXACTLY this schema:
{
  "title": string,
  "distilled_intention": string,
  "invocation": string,
  "symbols": [
    { "name": string, "salience": number, "category": string, "meaning": string }
  ],
  "emotions": [
    { "name": string, "intensity": number, "valence": number }
  ],
  "themes": [string],
  "blockers": [
    { "name": string, "reframing": string, "action": string }
  ],
  "visual_motifs": [string],
  "color_palette": [string],
  "ritual_steps": [
    { "action": string, "timing": string, "why": string }
  ]
}

Guidelines:
- Make the desire concrete and future-facing.
- The distilled intention should be vivid, concise, and affirmative.
- The invocation should feel ceremonial and memorable.
- Give 3-6 symbols and 2-4 ritual steps.
- Color palette should use hex strings.
- No markdown, no commentary, only valid JSON.`

        const { text: raw, source } = await callLLMWithSource(prompt, {
          provider,
          model,
          maxTokens: 1800,
          json: true,
          apiKeys: {
            openai: req.headers.get('x-openai-key') || undefined,
            openrouter: req.headers.get('x-openrouter-key') || undefined,
            anthropic: req.headers.get('x-anthropic-key') || undefined,
          },
        })
        send('source', { provider: source })

        const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

        let parsed: unknown
        try {
          parsed = JSON.parse(cleaned)
        } catch {
          send('error', { message: 'Failed to parse vision ritual. Please try again.' })
          controller.close()
          return
        }

        const normalized = normalizeExtraction(parsed)
        await setCache(cacheKey, normalized)
        send('extraction', { data: normalized })
        send('done', {})
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        send('error', { message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
