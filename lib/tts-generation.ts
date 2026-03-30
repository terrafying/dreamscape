/**
 * Smart TTS generation with fallback support.
 * Tries ElevenLabs first (better quality), falls back to Replicate (cheaper).
 */

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY
const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN

interface TTSResult {
  audioBuffer: Buffer
  provider: 'elevenlabs' | 'replicate'
  model: string
}

/**
 * Generate TTS via ElevenLabs (preferred: better quality, natural voices)
 */
async function generateViaElevenLabs(
  text: string,
  voiceId: string,
  model = 'eleven_multilingual_v2',
  stability = 0.5,
  similarityBoost = 0.75,
  speed = 0.85
): Promise<TTSResult | null> {
  if (!ELEVENLABS_KEY) return null

  try {
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

    const resp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body,
        signal: AbortSignal.timeout(60_000),
      }
    )

    if (!resp.ok) {
      const err = await resp.text()
      console.warn(`ElevenLabs failed (${resp.status}):`, err)
      return null
    }

    const audioBuffer = Buffer.from(await resp.arrayBuffer())
    return {
      audioBuffer,
      provider: 'elevenlabs',
      model,
    }
  } catch (err) {
    console.warn('ElevenLabs error:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Generate TTS via Replicate (fallback: cheaper, no billing limits)
 * Uses Coqui TTS (open source, good quality)
 */
async function generateViaReplicate(
  text: string,
  voiceId: string
): Promise<TTSResult | null> {
  if (!REPLICATE_KEY) return null

  try {
    // Map ElevenLabs voice IDs to speaker names (Replicate uses speaker names)
    // For now, use a default speaker if mapping not found
    const speakerMap: Record<string, string> = {
      '21m00Tcm4TlvDq8ikWAM': 'p225', // Rachel → p225
      'EXAVITQu4vr4xnSDxMaL': 'p226', // Bella → p226
      'IZSifMMVzhvvsNo7aZ0E': 'p227', // Antoni → p227
      'TxGEqnHWrfWFTfGW9XjX': 'p228', // Elli → p228
      'VR6AewLVsFNMjlBFvXnJ': 'p229', // Josh → p229
      'pNInz6obpgDQGcFmaJgB': 'p230', // Arnold → p230
      'EL1pdR02b3DQrJLSCgaG': 'p231', // Sam → p231
    }

    const speaker = speakerMap[voiceId] || 'p225' // Default to p225 if not found

    // Start prediction
    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${REPLICATE_KEY}`,
      },
      body: JSON.stringify({
        version: 'f6fa537afc617ee169b7db263bfb2167a512f489b434e66e12fb5e11a7f8a0a9', // Coqui TTS
        input: {
          text,
          speaker,
          language: 'en',
        },
      }),
    })

    if (!startResponse.ok) {
      const error = await startResponse.json().catch(() => ({}))
      console.warn(`Replicate TTS start failed (${startResponse.status}):`, error)
      return null
    }

    const prediction = await startResponse.json()
    const predictionId = prediction.id

    // Poll for completion (max 60 seconds)
    let attempts = 0
    while (attempts < 60) {
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { Authorization: `Token ${REPLICATE_KEY}` },
      })

      if (!statusResponse.ok) {
        console.warn(`Replicate TTS status check failed (${statusResponse.status})`)
        return null
      }

      const status = await statusResponse.json()

      if (status.status === 'succeeded') {
        const audioUrl = status.output
        if (!audioUrl) {
          console.warn('Replicate TTS: No audio URL in output')
          return null
        }

        // Download the audio file
        const audioResponse = await fetch(audioUrl)
        if (!audioResponse.ok) {
          console.warn(`Failed to download audio from ${audioUrl}`)
          return null
        }

        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer())
        return {
          audioBuffer,
          provider: 'replicate',
          model: 'coqui-tts',
        }
      }

      if (status.status === 'failed') {
        console.warn('Replicate TTS: Prediction failed', status.error)
        return null
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }

    console.warn('Replicate TTS: Prediction timeout')
    return null
  } catch (err) {
    console.warn('Replicate TTS error:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Smart TTS generation with fallback.
 * Tries ElevenLabs first (better quality), falls back to Replicate (cheaper).
 */
export async function generateTTSSmart(
  text: string,
  voiceId: string,
  model = 'eleven_multilingual_v2',
  stability = 0.5,
  similarityBoost = 0.75,
  speed = 0.85
): Promise<TTSResult> {
  // Try ElevenLabs first (better quality)
  const elResult = await generateViaElevenLabs(text, voiceId, model, stability, similarityBoost, speed)
  if (elResult) return elResult

  // Fall back to Replicate (cheaper, no billing limits)
  const repResult = await generateViaReplicate(text, voiceId)
  if (repResult) return repResult

  // No provider available
  throw new Error('No TTS provider available (ElevenLabs and Replicate both unavailable)')
}
