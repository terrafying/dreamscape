import { callLLMWithSource, type LLMProvider } from '@/lib/llm'
import { buildAstroContext, getCurrentTransits, getDominantTransit } from '@/lib/astro'
import type { BirthData } from '@/lib/types'
import { generateCacheKey, getCached, setCache } from '@/lib/cache'
import { checkAuth } from '@/lib/auth'


function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
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
        send('status', { message: 'Reading your dream...' })

        const astroCtx = buildAstroContext(date, birthData)
        const transits = getCurrentTransits(date)

        const payloadStr = transcript + date + (birthData?.date || '') + (provider || '') + (model || '')
        const cacheKey = `extract_${generateCacheKey(payloadStr)}`
        const cached = await getCached<any>(cacheKey)

        if (cached) {
          send('status', { message: 'Restoring analysis from dream journal...' })
          send('extraction', { data: cached })
          send('done', {})
          controller.close()
          return
        }

        send('status', { message: 'Consulting the stars...' })

        const prompt = `You are a depth-psychological dream analyst with expertise in Jungian symbolism, archetypal psychology, and astrological timing. Your interpretations are grounded, non-literal, and psychologically sophisticated — avoiding generic meanings in favor of what is specific to this dream's unique imagery.

Current date: ${date}
Astrological context:
${astroCtx}

---
DREAM TRANSCRIPT:
${transcript}
---

Analyze this dream and return a JSON object matching EXACTLY this schema (no extra fields, no markdown fences):

{
  "symbols": [
    { "name": string, "salience": number (0-1), "category": string, "meaning": string }
  ],
  "emotions": [
    { "name": string, "intensity": number (0-1), "valence": number (-1 to 1, negative=unpleasant) }
  ],
  "themes": [
    { "name": string, "confidence": number (0-1), "category": string }
  ],
  "characters": [
    { "label": string, "known": boolean, "archetype": string }
  ],
  "setting": { "type": string, "quality": string, "time": string },
  "narrative_arc": "ascending" | "descending" | "cyclical" | "fragmented" | "liminal",
  "lucidity": number (0=none, 1=semi, 2=lucid, 3=fully lucid),
  "tone": string,
  "interpretation": string (2-3 sentences of non-obvious psychological insight — specific to this dream, not generic),
  "astro_context": {
    "moon_phase": "${transits.moonPhase}",
    "moon_sign": "${transits.moonSign}",
    "cosmic_themes": [string],
    "transit_note": string (how the current sky specifically relates to this dream),
    "natal_aspects": [string] (if natal chart provided, how current transits touch natal placements; otherwise empty array)
  },
  "recommendations": [
    { "action": string (specific, doable), "timing": string, "why": string }
  ],
  "goetic_resonance": {
    "spirit": string (name of ONE of the 72 Goetic spirits whose domains/nature most resonates with this dream's imagery, themes, or emotional landscape — e.g. "Dantalion", "Phenex", "Paimon"),
    "reason": string (one sentence explaining the specific resonance between this dream and the spirit's nature — be precise about which imagery or theme connects),
    "barbarous": string (the spirit's traditional invocation words/barbarous name variants — 3-5 words, space-separated, ALL CAPS)
  }
}

Guidelines:
- Extract 3-7 symbols, 2-5 emotions, 2-4 themes
- Interpretation must be specific to this dream's unique elements, not a textbook definition
- Recommendations should be actionable within the next week, grounded in dream content
- Astro transit note should connect the specific dream imagery to the current sky
- natal_aspects: ${birthData ? `Natal Sun in ${birthData.date}, note any resonances with current transits` : 'return empty array []'}
- goetic_resonance: Choose thoughtfully from the 72 Goetic spirits based on the dream's actual imagery and themes. Examples: transformation/rebirth → Phenex; music/arts/knowledge → Paimon; reading minds/changing hearts → Dantalion; fire/cunning → Aim; invisibility/multiplicity → Bael; love/passion → Sitri or Asmodeus; finding lost things → Vassago; thunder/storms/secrets → Furfur

Return only valid JSON. No preamble, no explanation, no markdown.`

        send('status', { message: 'Weaving interpretation...' })

        const { text: raw, source } = await callLLMWithSource(prompt, {
          provider,
          model,
          maxTokens: 2000,
          json: true,
          apiKeys: {
            openai: req.headers.get('x-openai-key') || undefined,
            openrouter: req.headers.get('x-openrouter-key') || undefined,
            anthropic: req.headers.get('x-anthropic-key') || undefined,
          },
        })
        send('source', { provider: source })

        // Strip any accidental markdown fences
        const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

        let extraction
        try {
          extraction = JSON.parse(cleaned)
        } catch {
          send('error', { message: 'Failed to parse dream extraction. Please try again.' })
          controller.close()
          return
        }

        const { mergeCuratedSymbols } = await import('@/lib/symbols')
        const enriched = mergeCuratedSymbols(extraction)
        await setCache(cacheKey, enriched)
        send('extraction', { data: enriched })
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
