import { callLLMWithSource, type LLMProvider } from '@/lib/llm'
import { checkAuth } from '@/lib/auth'

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied

  const { intention, journal, provider, model } = (await req.json()) as {
    intention: string
    journal: string
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
        send('status', { message: 'Weaving synchronicities...' })

        const prompt = `You are a synchromystic oracle, interpreting a physical journey (a 'Wander' or 'Dreamwalk') taken by the user. 
The user set a specific intention, traveled to randomly generated coordinates, and wrote a journal entry about what they found.

Intention: "${intention}"
Findings: "${journal}"

Weave these two elements together to reveal the underlying archetype and meaning of their journey. Find the hidden, poetic connection between their intent and the physical reality they encountered.

Return a JSON object matching EXACTLY this schema (no extra fields, no markdown fences):
{
  "archetype": string (A 2-4 word archetypal title for their journey, e.g., "The Forgotten Threshold", "Mirror of the Deep"),
  "meaning": string (1-2 sentences summarizing the direct symbolic meaning of what they found),
  "insight": string (2-3 sentences of deep, non-obvious psychological or spiritual insight connecting their intention to their findings)
}

Return only valid JSON. No preamble, no explanation, no markdown.`

        const { text: raw, source } = await callLLMWithSource(prompt, {
          provider,
          model,
          maxTokens: 800,
          json: true,
          apiKeys: {
            openai: req.headers.get('x-openai-key') || undefined,
            openrouter: req.headers.get('x-openrouter-key') || undefined,
            anthropic: req.headers.get('x-anthropic-key') || undefined,
          },
        })
        
        send('source', { provider: source })

        const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

        let extraction
        try {
          extraction = JSON.parse(cleaned)
        } catch {
          send('error', { message: 'Failed to parse narrative. Please try again.' })
          controller.close()
          return
        }

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
