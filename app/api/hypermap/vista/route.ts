import { NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import { generateImageSmart, fetchImageAsBase64 } from '@/lib/image-generation'

export async function POST(req: Request) {
  const denied = checkAuth(req)
  if (denied) return denied

  let body: { prompt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt || prompt.length > 8000) {
    return NextResponse.json({ error: 'prompt required (max 8000 chars)' }, { status: 400 })
  }

  try {
    const result = await generateImageSmart(prompt)
    const mediaType = result.mediaType ?? 'image/png'
    const base64 = result.base64 ?? (result.url ? await fetchImageAsBase64(result.url) : '')
    if (!base64) throw new Error('No image produced')
    return NextResponse.json({ ok: true, dataUrl: `data:${mediaType};base64,${base64}`, mediaType })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
