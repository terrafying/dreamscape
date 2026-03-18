import { callLLM, type LLMProvider } from '@/lib/llm'
import { buildAstroContext } from '@/lib/astro'
import type { DreamLog, BirthData } from '@/lib/types'



function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
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
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)))
      }

      try {
        send('status', { message: 'Gathering your dream threads...' })

        const astroCtx = buildAstroContext(date, birthData)

        const dreamSummaries = dreams
          .slice(0, 10)
          .map((d, i) => {
            const e = d.extraction
            if (!e) return `Dream ${i + 1} (${d.date}): ${d.transcript.slice(0, 200)}`
            return `Dream ${i + 1} (${d.date}):
- Symbols: ${e.symbols.map((s) => s.name).join(', ')}
- Emotions: ${e.emotions.map((em) => `${em.name} (${em.valence > 0 ? '+' : ''}${em.valence.toFixed(1)})`).join(', ')}
- Themes: ${e.themes.map((t) => t.name).join(', ')}
- Narrative arc: ${e.narrative_arc}
- Tone: ${e.tone}
- Interpretation: ${e.interpretation}`
          })
          .join('\n\n')

        send('status', { message: 'Finding the patterns...' })

        const prompt = `You are a depth-psychological dream analyst writing a personal, intimate letter to the dreamer. You have reviewed their recent dreams and are synthesizing the patterns into a letter that feels like it comes from a wise, caring mirror — not clinical, not generic, but deeply personal.

Current date: ${date}
Astrological context:
${astroCtx}

RECENT DREAMS:
${dreamSummaries}

Write a dream letter in two parts:

PART 1 — THE LETTER (flowing prose, 4-6 paragraphs):
Address the dreamer directly ("you"). Weave together the recurring symbols, emotional currents, and evolving themes across these dreams. Note what is changing, what is recurring, what seems to be trying to break through. Reference specific dream images to anchor the letter. The tone should be warm, insightful, and slightly mysterious — like receiving a letter from your own unconscious. End with what the dreams collectively seem to be preparing you for.

PART 2 — STRUCTURED DATA (return as JSON after the letter, separated by ---JSON---):
{
  "key_patterns": [
    { "pattern": string, "frequency": number (how many dreams show this), "significance": string }
  ],
  "emotional_arc": string (how emotional tone has shifted across the dreams),
  "dominant_symbol": { "name": string, "meaning": string },
  "recommendations": [
    { "action": string, "timing": string, "why": string }
  ],
  "closing_theme": string (the central message of this dream sequence in one sentence)
}

Format your response as:
[The letter prose here]

---JSON---
[The JSON object here]`

        send('status', { message: 'Writing your letter...' })

        const raw = await callLLM(prompt, {
          provider,
          model,
          maxTokens: 3000,
        })

        const parts = raw.split('---JSON---')
        const letterProse = parts[0].trim()
        let structured = null

        if (parts[1]) {
          try {
            const jsonRaw = parts[1].replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
            structured = JSON.parse(jsonRaw)
          } catch {
            // structured data is optional
          }
        }

        send('letter', { prose: letterProse, structured })
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
