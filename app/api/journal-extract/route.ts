import { callLLM, type LLMProvider } from '@/lib/llm'
import { buildAstroContext, getCurrentTransits } from '@/lib/astro'
import type { BirthData } from '@/lib/types'
import { generateCacheKey, getCached, setCache } from '@/lib/cache'
import { checkAuth } from '@/lib/auth'

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied

  const { transcript, date, birthData, entryType, provider, model } = (await req.json()) as {
    transcript: string
    date: string
    birthData?: BirthData | null
    entryType: 'evening' | 'morning'
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
        send('status', { message: entryType === 'evening' ? 'Gathering your day...' : 'Landing your morning check-in...' })

        const astroCtx = buildAstroContext(date, birthData)
        const transits = getCurrentTransits(date)
        const payloadStr = transcript + date + entryType + (birthData?.date || '') + (provider || '') + (model || '')
        const cacheKey = `journal_extract_${generateCacheKey(payloadStr)}`
        const cached = await getCached<any>(cacheKey)

        if (cached) {
          send('status', { message: 'Restoring reflection from journal archive...' })
          send('extraction', { data: cached })
          send('done', {})
          controller.close()
          return
        }

        send('status', { message: 'Consulting the sky and your themes...' })

        const contextDirective = entryType === 'evening'
          ? 'This is an EVENING entry. Focus on closing the loop from today, naming gratitude, and setting sleep intentions for tonight.'
          : 'This is a MORNING entry. Focus on how they feel waking up, what matters today, and intentions for the day ahead.'

        const prompt = `You are a concise reflective journaling guide. You help the user identify emotional signal, meaningful moments, and next intentions without sounding generic.

Current date: ${date}
Journal entry type: ${entryType}
Astrological context:
${astroCtx}

${contextDirective}

---
JOURNAL TRANSCRIPT:
${transcript}
---

Return a JSON object matching EXACTLY this schema (no extra fields, no markdown fences):
{
  "mood_emotions": [string],
  "intentions": [string],
  "gratitude_moments": [string],
  "themes": [string],
  "reflection": string (2-3 sentences of clear insight tied to this entry),
  "astro_context": {
    "moon_phase": "${transits.moonPhase}",
    "moon_sign": "${transits.moonSign}",
    "cosmic_themes": [string],
    "transit_note": string (specific connection between sky context and this journal entry),
    "natal_aspects": [string]
  }
}

Guidelines:
- Provide 2-5 mood_emotions, 2-4 intentions, 2-4 gratitude_moments, 2-4 themes
- Keep language concrete and specific to the transcript
- Evening entries should include at least one sleep-supportive intention
- Morning entries should include at least one actionable daytime intention
- reflection must be 2-3 sentences, not bullet points
- natal_aspects: ${birthData ? `If relevant, include concise natal resonance notes using birth date ${birthData.date}` : 'return empty array []'}

Return only valid JSON.`

        send('status', { message: 'Composing your journal insight...' })

        const raw = await callLLM(prompt, {
          provider,
          model,
          maxTokens: 1400,
          json: true,
        })

        const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

        let extraction
        try {
          extraction = JSON.parse(cleaned)
        } catch {
          send('error', { message: 'Failed to parse journal extraction. Please try again.' })
          controller.close()
          return
        }

        await setCache(cacheKey, extraction)
        send('extraction', { data: extraction })
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
