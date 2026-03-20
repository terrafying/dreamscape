import { NextResponse } from 'next/server'

interface TTSOptions {
  text: string
  voiceId: string
  model?: string
  stability?: number
  similarityBoost?: number
  speed?: number
}

function parseVoices(raw: string | undefined): Array<{ id: string; label: string }> {
  if (!raw) return []
  return raw.split(',').map((pair) => {
    const colon = pair.indexOf(':')
    if (colon === -1) return { id: pair.trim(), label: pair.trim() }
    return { id: pair.slice(0, colon).trim(), label: pair.slice(colon + 1).trim() }
  }).filter((v) => v.id)
}

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 })
  }

  const { text, voiceId, model = 'eleven_multilingual_v2', stability = 0.5, similarityBoost = 0.75, speed = 0.85 } = await req.json() as TTSOptions
  if (!text || !voiceId) {
    return NextResponse.json({ ok: false, error: 'text and voiceId required' }, { status: 400 })
  }

  const body = JSON.stringify({
    model_id: model,
    text,
    voice_settings: {
      stability,
      similarity_boost: similarityBoost,
      use_speaker_boost: true,
      speed,
    },
  })

  try {
    const resp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body,
        signal: AbortSignal.timeout(60_000),
      }
    )

    if (!resp.ok) {
      const err = await resp.text()
      return NextResponse.json({ ok: false, error: `ElevenLabs error ${resp.status}: ${err}` }, { status: 502 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        if (!resp.body) { controller.close(); return }
        const reader = resp.body.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'TTS stream failed'
    return NextResponse.json({ ok: false, error: msg }, { status: 502 })
  }
}

export async function GET() {
  const raw = process.env.NEXT_PUBLIC_ELEVENLABS_VOICES
  const voices = parseVoices(raw)
  const defaultVoice = voices[0]?.id ?? ''
  return NextResponse.json({ ok: true, voices, defaultVoice })
}
