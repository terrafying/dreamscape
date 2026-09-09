import {
  DEFAULT_OPENROUTER_MODEL,
  FALLBACK_OPENROUTER_MODELS,
  OPENROUTER_AUTO,
  isFreeModel,
  rankOpenRouterCatalog,
} from '@/lib/openrouterModels'

type Candidate = { id: string; score: number; coolUntil: number }

const SEEDED: Candidate[] = FALLBACK_OPENROUTER_MODELS.map((id, index) => ({
  id,
  score: Math.max(1 - index * 0.08, 0.4),
  coolUntil: 0,
}))

const state = new Map<string, Candidate>()
for (const c of SEEDED) state.set(c.id, { ...c })

// Sentinel model used before the first successful catalog refresh: resolved to
// the top-ranked model at call time instead of a hardcoded id.
const AUTO_SENTINEL = '__openrouter_auto__'
let autoCandidate: Candidate | null = { id: AUTO_SENTINEL, score: 10, coolUntil: 0 }
let lastRefresh = 0
// Auto-resolved picks stick for this long so consecutive calls don't thrash
// between models when the catalog ranking shifts.
const AUTO_STICKY_MS = 60 * 60_000
let stickyAutoModel: { id: string; until: number } | null = null

const env = (name: string): string | undefined => {
  const v = process.env?.[name]
  return v && v.trim() ? v : undefined
}

/**
 * Deployment-pinned auto pick (OPENROUTER_MODEL). When set, "auto" resolves to
 * this instead of live catalog ranking — the operator takes responsibility for
 * keeping it current. Otherwise the live "best cheap right now" ranking wins.
 */
function pinnedAutoModel(): string | undefined {
  return env('OPENROUTER_MODEL')
}

/**
 * Top model from the last catalog fetch. Falls back through the live ranking
 * to the seeded list so this never returns empty or the auto sentinel.
 */
function bestAvailableModel(now: number): string {
  if (stickyAutoModel && stickyAutoModel.until > now && stickyAutoModel.id !== AUTO_SENTINEL) {
    return stickyAutoModel.id
  }
  if (autoCandidate && autoCandidate.id !== AUTO_SENTINEL) {
    const live = state.get(autoCandidate.id)
    // Respect cooldowns on the ranked pick — if it's cooling, next-ranked wins.
    if (live && live.coolUntil <= now) return live.id
  }
  const available = Array.from(state.values())
    .filter((c) => c.coolUntil <= now)
    .sort((a, b) => b.score - a.score)
  return (available[0] || SEEDED[0] || { id: DEFAULT_OPENROUTER_MODEL }).id
}

async function refreshCandidatesIfStale() {
  const now = Date.now()
  if (now - lastRefresh < 15 * 60_000) return
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dreamscape.quest',
        'X-Title': 'Dreamscape',
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return
    const data = await res.json() as any
    const ranked = rankOpenRouterCatalog(data, 50)
    if (!ranked.length) return

    // Cooldowns must survive the refresh — a model marked failing 30s ago
    // shouldn't get resurrected by a catalog snapshot.
    const previous = new Map(state)
    state.clear()
    for (const m of ranked) {
      const id = m.resolvedId
      const prev = previous.get(id)
      const score = (isFreeModel(m) ? 3 : 2) + m.resolvedId.length / 10_000
      state.set(id, { id, score, coolUntil: prev?.coolUntil ?? 0 })
    }
    const top = ranked[0]
    autoCandidate = { id: top.resolvedId, score: 10, coolUntil: 0 }
    stickyAutoModel = { id: top.resolvedId, until: Date.now() + AUTO_STICKY_MS }
    lastRefresh = Date.now()
  } catch {}
}

export function pickOpenRouterModel(preferred?: string): string {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  refreshCandidatesIfStale()

  const now = Date.now()
  const pinned = pinnedAutoModel()

  // Explicit user choice always wins (unless it's cooling down).
  if (preferred && preferred.trim() && preferred.trim() !== OPENROUTER_AUTO) {
    const choice = preferred.trim()
    if (pinned && preferred === pinned) return choice
    const known = state.get(choice)
    if (known) {
      if (known.coolUntil <= now) return choice
    } else {
      // Unknown model (e.g. brand-new catalog, or user typed a niche id):
      // optimistically honor it and let the failure cooldown correct us.
      return choice
    }
    // Known but cooling — fall through to auto.
  }

  if (pinned) return pinned
  return bestAvailableModel(now)
}

export function markOpenRouterFailure(model: string, minutes = 10) {
  // Unknown models get a temporary state entry so the cooldown actually bites.
  if (!state.has(model)) state.set(model, { id: model, score: 0, coolUntil: 0 })
  const c = state.get(model)
  if (c) c.coolUntil = Date.now() + minutes * 60_000
  if (stickyAutoModel?.id === model) stickyAutoModel = null
}

export function markOpenRouterSuccess(model: string) {
  if (!state.has(model)) state.set(model, { id: model, score: 0, coolUntil: 0 })
  const c = state.get(model)
  if (c) c.coolUntil = 0
}
