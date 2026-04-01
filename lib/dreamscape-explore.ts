import type { DreamLog, VisionLog } from './types'

export interface ExploreChamber {
  /** Stable id for storage and React keys */
  id: string
  symbolName: string
  meaning: string
  sourceKind: 'dream' | 'vision'
  /** Short line, e.g. "Dream · 2026-03-09" */
  sourceSummary: string
  /** 0–1 hue seed for styling */
  hue: number
  tags: string[]
}

const MAX_CHAMBERS = 8

function normalizeKey(name: string): string {
  return name.trim().toLowerCase()
}

function fnv1a(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function hueFromKey(key: string): number {
  const h = fnv1a(key)
  return (h % 360) / 360
}

function formatDreamDate(d: DreamLog): string {
  return d.date || 'unknown date'
}

function formatVisionDate(v: VisionLog): string {
  return v.date || 'unknown date'
}

type Agg = {
  key: string
  symbolName: string
  meaning: string
  score: number
  sourceKind: 'dream' | 'vision'
  sourceSummary: string
  tags: Set<string>
}

function pushTag(set: Set<string>, raw: string) {
  const t = raw.trim()
  if (t) set.add(t)
}

function upsertAgg(map: Map<string, Agg>, next: Agg) {
  const prev = map.get(next.key)
  if (!prev || next.score > prev.score) {
    const tags = new Set(prev ? [...prev.tags, ...next.tags] : next.tags)
    map.set(next.key, { ...next, tags })
    return
  }
  for (const t of next.tags) prev.tags.add(t)
}

/**
 * Collects symbols from dream and vision logs, dedupes by normalized name,
 * ranks by salience and recency, returns up to `max` chambers.
 */
export function buildExploreChambers(
  dreams: DreamLog[],
  visions: VisionLog[],
  max: number = MAX_CHAMBERS,
): ExploreChamber[] {
  const byKey = new Map<string, Agg>()
  const now = Date.now()

  const sortedDreams = [...dreams].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  for (const d of sortedDreams) {
    const ext = d.extraction
    if (!ext?.symbols?.length) continue
    const ageDays = Math.max(0, (now - (d.createdAt ?? now)) / 86400000)
    const recency = 1 / (1 + ageDays / 30)
    for (const sym of ext.symbols) {
      const key = normalizeKey(sym.name)
      if (!key) continue
      const score = sym.salience * 100 * recency
      const tags = new Set<string>()
      pushTag(tags, sym.category)
      for (const th of ext.themes) pushTag(tags, th.name)
      upsertAgg(byKey, {
        key,
        symbolName: sym.name.trim(),
        meaning: sym.meaning.trim() || 'A figure that appeared in your dreaming mind.',
        score,
        sourceKind: 'dream',
        sourceSummary: `Dream · ${formatDreamDate(d)}`,
        tags,
      })
    }
  }

  const sortedVisions = [...visions].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  for (const v of sortedVisions) {
    const ext = v.extraction
    if (!ext?.symbols?.length) continue
    const ageDays = Math.max(0, (now - (v.createdAt ?? now)) / 86400000)
    const recency = 1 / (1 + ageDays / 30)
    for (const sym of ext.symbols) {
      const key = normalizeKey(sym.name)
      if (!key) continue
      const score = sym.salience * 105 * recency
      const tags = new Set<string>()
      pushTag(tags, sym.category)
      for (const t of ext.themes) pushTag(tags, t)
      const title = ext.title?.trim()
      upsertAgg(byKey, {
        key,
        symbolName: sym.name.trim(),
        meaning: sym.meaning.trim() || 'A motif from your vision work.',
        score,
        sourceKind: 'vision',
        sourceSummary: title ? `Vision · ${title}` : `Vision · ${formatVisionDate(v)}`,
        tags,
      })
    }
  }

  const list = [...byKey.values()].sort((a, b) => b.score - a.score).slice(0, max)

  if (list.length === 0) {
    return fallbackChambers()
  }

  return list.map((agg, index) => ({
    id: `liminal-${fnv1a(agg.key).toString(36)}-${index}`,
    symbolName: agg.symbolName,
    meaning: agg.meaning,
    sourceKind: agg.sourceKind,
    sourceSummary: agg.sourceSummary,
    hue: hueFromKey(agg.key),
    tags: [...agg.tags].slice(0, 6),
  }))
}

function fallbackChambers(): ExploreChamber[] {
  return [
    {
      id: 'fallback-threshold',
      symbolName: 'Threshold',
      meaning: 'A passage between states—neither fully here nor there, where attention reshapes what comes next.',
      sourceKind: 'dream',
      sourceSummary: 'Collective pattern',
      hue: 0.78,
      tags: ['liminal', 'transition'],
    },
    {
      id: 'fallback-mirror',
      symbolName: 'Mirror',
      meaning: 'Reflection of what you already carry; the unconscious showing its face in familiar form.',
      sourceKind: 'dream',
      sourceSummary: 'Collective pattern',
      hue: 0.55,
      tags: ['reflection', 'self'],
    },
    {
      id: 'fallback-water',
      symbolName: 'Still Water',
      meaning: 'Depth and feeling; what lies beneath clear surfaces when movement stops.',
      sourceKind: 'vision',
      sourceSummary: 'Collective pattern',
      hue: 0.52,
      tags: ['emotion', 'depth'],
    },
  ]
}

export const EXPLORE_STORAGE_KEY = 'dreamscape_explore_attuned'

export function parseAttunedIds(raw: string | null): Set<string> {
  if (!raw) return new Set()
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

export function serializeAttunedIds(ids: Set<string>): string {
  return JSON.stringify([...ids])
}
