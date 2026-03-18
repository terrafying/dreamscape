import crypto from 'crypto'

// A simple in-memory cache. For a production Vercel deployment, 
// this should ideally be backed by Vercel KV or Redis.
const cache = new Map<string, { data: unknown; timestamp: number }>()

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export function generateCacheKey(payload: unknown): string {
  const str = JSON.stringify(payload)
  return crypto.createHash('sha256').update(str).digest('hex')
}

export async function getCached<T>(key: string): Promise<T | null> {
  const hit = cache.get(key)
  if (!hit) return null
  
  // check expiration
  if (Date.now() - hit.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit.data as T
}

export async function setCache(key: string, data: unknown): Promise<void> {
  cache.set(key, { data, timestamp: Date.now() })
}
