type Candidate = { id: string; score: number; coolUntil: number }

// Candidate free-tier models (from your list), weighted by score (higher first)
const CANDIDATES: Candidate[] = [
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', score: 0.656, coolUntil: 0 },
  { id: 'openrouter/free', score: 0.555, coolUntil: 0 },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', score: 0.546, coolUntil: 0 },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', score: 0.546, coolUntil: 0 },
  { id: 'stepfun/step-3.5-flash:free', score: 0.516, coolUntil: 0 },
  { id: 'arcee-ai/trinity-mini:free', score: 0.504, coolUntil: 0 },
]

// Simple in-memory backoff map across a single serverless instance
const state = new Map<string, Candidate>()
for (const c of CANDIDATES) state.set(c.id, { ...c })

export function pickOpenRouterModel(preferred?: string): string {
  const now = Date.now()
  if (preferred && state.has(preferred) && (state.get(preferred)!.coolUntil <= now)) return preferred

  // choose best available (not cooling)
  const available = Array.from(state.values())
    .filter(c => c.coolUntil <= now)
    .sort((a, b) => b.score - a.score)
  return (available[0] || CANDIDATES[0]).id
}

export function markOpenRouterFailure(model: string, minutes = 10) {
  const c = state.get(model)
  if (c) c.coolUntil = Date.now() + minutes * 60_000
}

export function markOpenRouterSuccess(model: string) {
  const c = state.get(model)
  if (c) c.coolUntil = 0
}
