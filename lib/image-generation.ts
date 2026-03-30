/**
 * Smart image generation with fallback support.
 * Tries Replicate first (cheaper, no billing limits), falls back to OpenAI.
 */

const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN
const OPENAI_KEY = process.env.OPENAI_API_KEY

interface ImageResult {
  url?: string
  base64?: string
  model: string
  provider: 'openrouter' | 'openai'
}

/**
 * Generate image via Replicate (preferred: cheaper, no billing limits)
 * Uses Flux Schnell (fast, free tier available)
 */
async function generateViaReplicate(prompt: string, model = 'black-forest-labs/flux-schnell'): Promise<ImageResult | null> {
  if (!REPLICATE_KEY) return null

  try {
    // Start prediction
    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${REPLICATE_KEY}`,
      },
      body: JSON.stringify({
        version: model === 'black-forest-labs/flux-schnell' 
          ? '3f0457e4a4202e302f7a14bdd7df1b04a3eccd2e' // Flux Schnell
          : 'a25d7920246ce30010671ca59a0f1450733641ae', // SDXL
        input: {
          prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 4,
          guidance_scale: 7.5,
        },
      }),
    })

    if (!startResponse.ok) {
      const error = await startResponse.json().catch(() => ({}))
      console.warn(`Replicate start failed (${startResponse.status}):`, error)
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
        console.warn(`Replicate status check failed (${statusResponse.status})`)
        return null
      }

      const status = await statusResponse.json()

      if (status.status === 'succeeded') {
        const imageUrl = status.output?.[0]
        if (!imageUrl) {
          console.warn('Replicate: No image URL in output')
          return null
        }
        return {
          url: imageUrl,
          model,
          provider: 'openrouter', // Keep as openrouter for compatibility
        }
      }

      if (status.status === 'failed') {
        console.warn('Replicate: Prediction failed', status.error)
        return null
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }

    console.warn('Replicate: Prediction timeout')
    return null
  } catch (err) {
    console.warn('Replicate error:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Generate image via OpenAI (fallback)
 */
async function generateViaOpenAI(prompt: string, model = 'dall-e-3'): Promise<ImageResult | null> {
  if (!OPENAI_KEY) return null

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        size: '1024x1024',
        n: 1,
        response_format: 'url',
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.warn(`OpenAI failed (${response.status}):`, error)
      return null
    }

    const data = await response.json()
    const imageUrl = data.data?.[0]?.url

    if (!imageUrl) {
      console.warn('OpenAI: No image URL in response')
      return null
    }

    return {
      url: imageUrl,
      model,
      provider: 'openai',
    }
  } catch (err) {
    console.warn('OpenAI error:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Smart image generation with fallback.
 * Tries Replicate first (cheaper, no billing limits), falls back to OpenAI.
 */
export async function generateImageSmart(prompt: string): Promise<ImageResult> {
  // Try Replicate first (cheaper, no billing limits)
  const repResult = await generateViaReplicate(prompt, 'black-forest-labs/flux-schnell')
  if (repResult) return repResult

  // Fall back to OpenAI
  const oaiResult = await generateViaOpenAI(prompt, 'dall-e-3')
  if (oaiResult) return oaiResult

  // No provider available
  throw new Error('No image generation provider available (Replicate and OpenAI both unavailable)')
}

/**
 * Fetch image URL and convert to base64 (for SSE responses)
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return base64
  } catch (err) {
    console.error('Failed to convert image to base64:', err)
    throw err
  }
}
