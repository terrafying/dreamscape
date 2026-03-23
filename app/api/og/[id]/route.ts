import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabaseClient'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase()
  if (!supabase) {
    return new NextResponse('', { status: 404 })
  }

  const { data: dream } = await supabase
    .from('shared_dreams')
    .select('share_handle, dream_data, symbols, created_at')
    .eq('id', params.id)
    .single() as { data: { share_handle: string; dream_data: unknown; symbols: string[]; created_at: string } | null }

  if (!dream) {
    return new NextResponse('', { status: 404 })
  }

  const dreamData = dream.dream_data as {
    transcript?: string
    extraction?: {
      symbols?: { name: string; meaning: string }[]
      emotions?: { name: string }[]
      narrative_arc?: string
    }
  }

  const transcript = dreamData?.transcript ?? ''
  const excerpt = transcript.length > 200
    ? transcript.slice(0, 197) + '...'
    : transcript
  const symbols = (dreamData?.extraction?.symbols ?? []).slice(0, 3)
  const symbolText = symbols.length > 0
    ? symbols.map(s => s.name).join(' · ')
    : ''
  const handle = dream.share_handle
  const date = new Date(dream.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a14"/>
      <stop offset="100%" stop-color="#1a0a2e"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="rgba(167,139,250,0.25)" stroke-width="2" rx="24"/>
  <text x="60" y="80" font-family="Georgia, serif" font-size="28" fill="rgba(167,139,250,0.9)" letter-spacing="8">DREAMSCAPE</text>
  <text x="60" y="120" font-family="Georgia, serif" font-size="18" fill="rgba(167,139,250,0.4)" letter-spacing="4">◇ shared dream</text>
  <line x1="60" y1="150" x2="1140" y2="150" stroke="rgba(167,139,250,0.15)" stroke-width="1"/>
  <text x="60" y="200" font-family="Georgia, serif" font-size="42" fill="rgba(226,232,240,0.95)" letter-spacing="1">
    <tspan>${escapeXml(excerpt.split('\n')[0].slice(0, 60))}</tspan>
  </text>
  <text x="60" y="250" font-family="Georgia, serif" font-size="28" fill="rgba(226,232,240,0.7)" letter-spacing="1">
    <tspan>${escapeXml(excerpt.split('\n')[0].slice(60, 120) || '')}</tspan>
  </text>
  ${symbolText ? `
  <rect x="60" y="290" width="${Math.min(symbolText.length * 14 + 40, 800)}" height="44" fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.3)" stroke-width="1" rx="22"/>
  <text x="80" y="320" font-family="monospace" font-size="20" fill="rgba(251,191,36,0.9)" letter-spacing="2">${escapeXml(symbolText)}</text>` : ''}
  <line x1="60" y1="360" x2="1140" y2="360" stroke="rgba(167,139,250,0.1)" stroke-width="1"/>
  <text x="60" y="400" font-family="monospace" font-size="22" fill="rgba(167,139,250,0.7)" letter-spacing="2">@${escapeXml(handle)}</text>
  <text x="60" y="440" font-family="monospace" font-size="18" fill="rgba(167,139,250,0.4)" letter-spacing="1">${escapeXml(date)}</text>
  <text x="60" y="580" font-family="Georgia, serif" font-size="22" fill="rgba(167,139,250,0.35)" letter-spacing="2">dreamscape.quest</text>
  <text x="60" y="556" font-family="monospace" font-size="16" fill="rgba(167,139,250,0.25)" letter-spacing="1">log · interpret · share · sleep</text>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
