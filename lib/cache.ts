import crypto from 'crypto'

// Try to use Vercel KV (Redis), fall back to in-memory cache
let kv: any = null
try {
  kv = require('@vercel/kv').kv
} catch {
  // Vercel KV not available, will use in-memory cache
}

// Fallback in-memory cache for local dev or when KV unavailable
const memoryCache = new Map<string, { data: unknown; timestamp: number }>()

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000

export function generateCacheKey(payload: unknown): string {
  const str = JSON.stringify(payload)
  return crypto.createHash('sha256').update(str).digest('hex')
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first
    if (kv) {
      const cached = await kv.get(key)
      if (cached) {
        return JSON.parse(cached) as T
      }
      return null
    }
  } catch (err) {
    console.warn('KV cache read failed, falling back to memory:', err)
  }

  // Fall back to in-memory cache
  const hit = memoryCache.get(key)
  if (!hit) return null

  // check expiration
  if (Date.now() - hit.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key)
    return null
  }
  return hit.data as T
}

export async function setCache(key: string, data: unknown): Promise<void> {
  try {
    // Try Redis first
    if (kv) {
      await kv.setex(key, CACHE_TTL_SECONDS, JSON.stringify(data))
      return
    }
  } catch (err) {
    console.warn('KV cache write failed, falling back to memory:', err)
  }

  // Fall back to in-memory cache
  memoryCache.set(key, { data, timestamp: Date.now() })
}
