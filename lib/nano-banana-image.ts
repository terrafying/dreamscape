/**
 * Nano Banana (Gemini 2.5 Flash Image) via Vercel AI Gateway — same pattern as Vercel docs:
 * https://vercel.com/docs/ai-gateway/capabilities/image-generation/ai-sdk
 *
 * Requires AI_GATEWAY_API_KEY in local .env, or deploy on Vercel where OIDC auth is automatic.
 * Optional: NANO_BANANA_MODEL (default google/gemini-2.5-flash-image).
 */

import { gateway } from '@ai-sdk/gateway'
import { generateText } from 'ai'

const DEFAULT_MODEL = 'google/gemini-2.5-flash-image'

export async function generateNanoBananaDataUrl(prompt: string): Promise<{ dataUrl: string; mediaType: string }> {
  const modelId = process.env.NANO_BANANA_MODEL || DEFAULT_MODEL
  const result = await generateText({
    model: gateway(modelId),
    prompt,
  })

  const file = result.files.find((f) => f.mediaType?.startsWith('image/'))
  if (!file?.uint8Array?.length) {
    throw new Error(
      'Nano Banana returned no image file. Set AI_GATEWAY_API_KEY for local dev, or deploy on Vercel with AI Gateway enabled.',
    )
  }

  const mediaType = file.mediaType ?? 'image/png'
  const b64 = Buffer.from(file.uint8Array).toString('base64')
  return { dataUrl: `data:${mediaType};base64,${b64}`, mediaType }
}
