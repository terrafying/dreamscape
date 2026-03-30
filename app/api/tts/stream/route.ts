import { NextResponse } from 'next/server'
import { generateCacheKey, getCached, setCache } from '@/lib/cache'
import { generateBlobCacheKey, getCachedBlob, setCachedBlob } from '@/lib/blob-cache'
import { generateTTSSmart } from '@/lib/tts-generation'

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
  const { text, voiceId, model = 'eleven_multilingual_v2', stability = 0.5, similarityBoost = 0.75, speed = 0.85 } = await req.json() as TTSOptions
  if (!text || !voiceId) {
    return NextResponse.json({ ok: false, error: 'text and voiceId required' }, { status: 400 })
  }

  const blobCacheKey = generateBlobCacheKey({ text, voiceId, model, stability, similarityBoost, speed })
  
  // Try blob cache first (persistent across deploys)
  const cachedBlob = await getCachedBlob(blobCacheKey)
  if (cachedBlob) {
    return new Response(new Uint8Array(cachedBlob), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=2592000, immutable',
        'X-Dreamscape-TTS-Cache': 'HIT-BLOB',
      },
    })
  }

  try {
    // Use smart fallback: ElevenLabs first, then Replicate
    const result = await generateTTSSmart(text, voiceId, model, stability, similarityBoost, speed)
    
    // Cache the audio in blob storage (persistent, 30-day TTL)
    await setCachedBlob(blobCacheKey, result.audioBuffer)

    return new Response(new Uint8Array(result.audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=2592000, immutable',
        'X-Dreamscape-TTS-Cache': 'MISS',
        'X-Dreamscape-TTS-Provider': result.provider,
        'X-Dreamscape-TTS-Model': result.model,
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
