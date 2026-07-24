/**
 * Unified image generation with provider fallback.
 * Chain order: Replicate Flux Schnell (cheapest) → Gemini 2.5 Flash Image via
 * Vercel AI Gateway (quality) → OpenAI (last resort).
 *
 * Model IDs live in lib/models.ts — never hardcode provider version hashes here.
 */

import { gateway } from '@ai-sdk/gateway'
import { generateText } from 'ai'
import { imageModel } from '@/lib/models'

export interface ImageResult {
  url?: string
  base64?: string
  mediaType?: string
  model: string
  provider: 'replicate' | 'gemini' | 'openai'
}

/**
 * Generate image via Replicate using the official-model endpoint
 * (resolves the latest model version server-side — no version hashes).
 */
async function generateViaReplicate(prompt: string): Promise<ImageResult> {
  const key = process.env.REPLICATE_API_TOKEN
  if (!key) throw new Error('REPLICATE_API_TOKEN is not set')
  const model = imageModel.replicate()

  const startResponse = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${key}`,
    },
    body: JSON.stringify({
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'webp',
      },
    }),
  })

  if (!startResponse.ok) {
    const error = await startResponse.json().catch(() => ({}))
    throw new Error(`Replicate start failed (${startResponse.status}): ${JSON.stringify(error)}`)
  }

  const prediction = await startResponse.json()
  const pollUrl: string = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`

  // Poll for completion (max 60 seconds)
  let attempts = 0
  while (attempts < 60) {
    const statusResponse = await fetch(pollUrl, {
      headers: { Authorization: `Token ${key}` },
    })

    if (!statusResponse.ok) {
      throw new Error(`Replicate status check failed (${statusResponse.status})`)
    }

    const status = await statusResponse.json()

    if (status.status === 'succeeded') {
      const output = status.output
      const imageUrl = Array.isArray(output) ? output[0] : output
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Replicate: No image URL in output')
      }
      return { url: imageUrl, mediaType: 'image/webp', model, provider: 'replicate' }
    }

    if (status.status === 'failed' || status.status === 'canceled') {
      throw new Error(`Replicate: Prediction ${status.status}: ${JSON.stringify(status.error)}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
    attempts++
  }

  throw new Error('Replicate: Prediction timeout')
}

/**
 * Generate image via Gemini 2.5 Flash Image through the Vercel AI Gateway.
 * Locally requires AI_GATEWAY_API_KEY; on Vercel, OIDC auth is automatic.
 */
async function generateViaGemini(prompt: string): Promise<ImageResult> {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL) {
    throw new Error('AI Gateway not configured (set AI_GATEWAY_API_KEY or deploy on Vercel)')
  }
  const model = imageModel.gemini()
  const result = await generateText({
    model: gateway(model),
    prompt,
  })

  const file = result.files.find((f) => f.mediaType?.startsWith('image/'))
  if (!file?.uint8Array?.length) {
    throw new Error('Gemini returned no image file')
  }

  const mediaType = file.mediaType ?? 'image/png'
  return {
    base64: Buffer.from(file.uint8Array).toString('base64'),
    mediaType,
    model,
    provider: 'gemini',
  }
}

/**
 * Generate image via OpenAI (last resort).
 * No response_format param: gpt-image models reject it and url is the
 * default for dall-e — handle both url and b64_json response shapes.
 */
async function generateViaOpenAI(prompt: string): Promise<ImageResult> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not set')
  const model = imageModel.openai()

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size: '1024x1024',
      n: 1,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`OpenAI failed (${response.status}): ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  const item = data.data?.[0]

  if (item?.url) {
    return { url: item.url, mediaType: 'image/png', model, provider: 'openai' }
  }
  if (item?.b64_json) {
    return { base64: item.b64_json, mediaType: 'image/png', model, provider: 'openai' }
  }
  throw new Error('OpenAI: No image URL or b64_json in response')
}

/**
 * Smart image generation with fallback.
 * Tries Replicate Flux Schnell → Gemini (AI Gateway) → OpenAI.
 */
export async function generateImageSmart(prompt: string): Promise<ImageResult> {
  const errors: string[] = []

  try {
    return await generateViaReplicate(prompt)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('Replicate error:', msg)
    errors.push(`Replicate: ${msg}`)
  }

  try {
    return await generateViaGemini(prompt)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('Gemini error:', msg)
    errors.push(`Gemini: ${msg}`)
  }

  try {
    return await generateViaOpenAI(prompt)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('OpenAI error:', msg)
    errors.push(`OpenAI: ${msg}`)
  }

  throw new Error(`No image generation provider available. Errors: ${errors.join(' | ')}`)
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
