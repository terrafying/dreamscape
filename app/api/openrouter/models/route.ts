import { FALLBACK_OPENROUTER_MODELS, normalizeOpenRouterModels } from '@/lib/openrouterModels'

let cache: { models: string[]; expiresAt: number } | null = null

export async function GET() {
  const now = Date.now()
  if (cache && cache.expiresAt > now) {
    return Response.json({ models: cache.models, cached: true })
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dreamscape.quest',
        'X-Title': 'Dreamscape',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`)

    const payload = (await res.json()) as unknown
    const models = normalizeOpenRouterModels(payload)
    cache = { models, expiresAt: now + 60 * 60_000 }
    return Response.json(
      { models, cached: false },
      { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } },
    )
  } catch {
    return Response.json(
      { models: FALLBACK_OPENROUTER_MODELS, cached: false, fallback: true },
      { headers: { 'Cache-Control': 'public, max-age=300' } },
    )
  }
}
