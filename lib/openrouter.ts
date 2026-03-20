type Candidate = { id: string; score: number; coolUntil: number }

const SEEDED: Candidate[] = [
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', score: 1.0, coolUntil: 0 },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', score: 0.70, coolUntil: 0 },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', score: 0.65, coolUntil: 0 },
  { id: 'stepfun/step-3.5-flash:free', score: 0.60, coolUntil: 0 },
  { id: 'arcee-ai/trinity-mini:free', score: 0.55, coolUntil: 0 },
]

const state = new Map<string, Candidate>()
for (const c of SEEDED) state.set(c.id, { ...c })
let lastRefresh = 0

async function refreshCandidatesIfStale() {
  const key = process.env.OPENROUTER_API_KEY
  const now = Date.now()
  if (!key || now - lastRefresh < 15 * 60_000) return
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return
    const data = await res.json() as any
    const models = Array.isArray(data?.data) ? data.data : []
    const free: string[] = []
    for (const m of models) {
      const id = m?.id || m?.name
      const price = m?.pricing || m?.price
      const isFree = typeof id === 'string' && (id.includes(':free') || (price && (price.prompt === 0 || price.completion === 0)))
      if (isFree) free.push(id)
    }
    if (free.length) {
      const ranked = free.map((id) => ({
        id,
        score: id.includes('nemotron-3-super-120b') ? 1.0 : 0.6,
        coolUntil: 0,
      }))
      state.clear()
      for (const c of ranked) state.set(c.id, c)
      lastRefresh = now
    }
  } catch {}
}

export function pickOpenRouterModel(preferred?: string): string {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  refreshCandidatesIfStale()

  const now = Date.now()
  if (preferred && state.has(preferred) && (state.get(preferred)!.coolUntil <= now)) return preferred

  const available = Array.from(state.values())
    .filter(c => c.coolUntil <= now)
    .sort((a, b) => b.score - a.score)
  return (available[0] || SEEDED[0]).id
}

export function markOpenRouterFailure(model: string, minutes = 10) {
  const c = state.get(model)
  if (c) c.coolUntil = Date.now() + minutes * 60_000
}

export function markOpenRouterSuccess(model: string) {
  const c = state.get(model)
  if (c) c.coolUntil = 0
}
