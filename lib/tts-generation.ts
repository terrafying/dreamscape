/**
 * Smart TTS generation with fallback support.
 * Tries ElevenLabs first (better quality), falls back to Replicate (cheaper).
 */

import { ttsModel } from '@/lib/models'

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
 * Uses MiniMax Speech 02 HD via the official-model endpoint (no version hash;
 * model + default voice live in lib/models.ts).
 */
async function generateViaReplicate(
  text: string,
  speed = 0.85
): Promise<TTSResult | null> {
  if (!REPLICATE_KEY) return null

  try {
    const model = ttsModel.replicate()

    // Start prediction via the official-model endpoint (latest version)
    const startResponse = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${REPLICATE_KEY}`,
      },
      body: JSON.stringify({
        input: {
          text,
          voice_id: ttsModel.replicateVoice(),
          speed,
          emotion: 'auto',
          audio_format: 'mp3',
        },
      }),
    })

    if (!startResponse.ok) {
      const error = await startResponse.json().catch(() => ({}))
      console.warn(`Replicate TTS start failed (${startResponse.status}):`, error)
      return null
    }

    const prediction = await startResponse.json()
    const pollUrl: string = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`

    // Poll for completion (max 60 seconds)
    let attempts = 0
    while (attempts < 60) {
      const statusResponse = await fetch(pollUrl, {
        headers: { Authorization: `Token ${REPLICATE_KEY}` },
      })

      if (!statusResponse.ok) {
        console.warn(`Replicate TTS status check failed (${statusResponse.status})`)
        return null
      }

      const status = await statusResponse.json()

      if (status.status === 'succeeded') {
        const output = status.output
        const audioUrl = typeof output === 'string' ? output : output?.audio || output?.[0]
        if (!audioUrl || typeof audioUrl !== 'string') {
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
          model,
        }
      }

      if (status.status === 'failed' || status.status === 'canceled') {
        console.warn(`Replicate TTS: Prediction ${status.status}`, status.error)
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
  model = ttsModel.elevenlabs(),
  stability = 0.5,
  similarityBoost = 0.75,
  speed = 0.85
): Promise<TTSResult> {
  // Try ElevenLabs first (better quality)
  const elResult = await generateViaElevenLabs(text, voiceId, model, stability, similarityBoost, speed)
  if (elResult) return elResult

  // Fall back to Replicate (cheaper, no billing limits)
  const repResult = await generateViaReplicate(text, speed)
  if (repResult) return repResult

  // No provider available
  throw new Error('No TTS provider available (ElevenLabs and Replicate both unavailable)')
}
