import { NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import { generateNanoBananaDataUrl } from '@/lib/nano-banana-image'

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
    const { dataUrl, mediaType } = await generateNanoBananaDataUrl(prompt)
    return NextResponse.json({ ok: true, dataUrl, mediaType })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
