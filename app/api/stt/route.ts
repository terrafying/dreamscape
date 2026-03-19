import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('audio') as File | null
    if (!file) return NextResponse.json({ ok: false, error: 'No audio' }, { status: 400 })

    const dg = process.env.DEEPGRAM_API_KEY
    const oai = process.env.OPENAI_API_KEY

    // Try Deepgram first
    if (dg) {
      const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2-general', {
        method: 'POST',
        headers: { Authorization: `Token ${dg}`, 'Content-Type': file.type || 'audio/webm' },
        body: file.stream(),
      })
      if (dgRes.ok) {
        const json = await dgRes.json() as any
        const text = json?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
        if (text) return NextResponse.json({ ok: true, text })
      }
    }

    // Fallback: OpenAI Whisper
    if (oai) {
      const fd = new FormData()
      fd.set('file', file, 'audio.webm')
      fd.set('model', 'whisper-1')
      const oaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${oai}` },
        body: fd as any,
      })
      if (oaiRes.ok) {
        const json = await oaiRes.json() as any
        const text = json?.text || ''
        if (text) return NextResponse.json({ ok: true, text })
      } else {
        const t = await oaiRes.text()
        return NextResponse.json({ ok: false, error: `OpenAI error: ${t}` }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: false, error: 'No STT provider configured or transcription failed' }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 })
  }
}
