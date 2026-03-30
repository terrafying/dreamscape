import crypto from 'crypto'

// Try to use Vercel Blob Storage, fall back to in-memory cache
let blob: any = null
try {
  blob = require('@vercel/blob')
} catch {
  // Vercel Blob not available, will use in-memory cache
}

// Fallback in-memory cache for local dev or when Blob unavailable
const memoryCache = new Map<string, { data: Buffer; timestamp: number }>()

const CACHE_TTL_DAYS = 30
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000

export function generateBlobCacheKey(payload: unknown): string {
  const str = JSON.stringify(payload)
  return `cache_${crypto.createHash('sha256').update(str).digest('hex')}`
}

/**
 * Get cached binary data (audio, images, etc.) from Blob Storage or memory
 */
export async function getCachedBlob(key: string): Promise<Buffer | null> {
  try {
    // Try Blob Storage first
    if (blob?.get) {
      try {
        const cached = await blob.get(key)
        if (cached) {
          return Buffer.from(await cached.arrayBuffer())
        }
      } catch (err) {
        // Key doesn't exist in blob storage, continue to memory cache
        if ((err as any)?.code !== 'BlobNotFound') {
          console.warn('Blob cache read failed:', err)
        }
      }
    }
  } catch (err) {
    console.warn('Blob storage unavailable, falling back to memory:', err)
  }

  // Fall back to in-memory cache
  const hit = memoryCache.get(key)
  if (!hit) return null

  // check expiration
  if (Date.now() - hit.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key)
    return null
  }
  return hit.data
}

/**
 * Cache binary data (audio, images, etc.) to Blob Storage or memory
 */
export async function setCachedBlob(key: string, data: Buffer): Promise<void> {
  try {
    // Try Blob Storage first
    if (blob?.put) {
      await blob.put(key, data, {
        contentType: 'application/octet-stream',
        addRandomSuffix: false,
      })
      return
    }
  } catch (err) {
    console.warn('Blob cache write failed, falling back to memory:', err)
  }

  // Fall back to in-memory cache
  memoryCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Delete cached blob (cleanup)
 */
export async function deleteCachedBlob(key: string): Promise<void> {
  try {
    if (blob?.delete) {
      await blob.delete(key)
    }
  } catch (err) {
    console.warn('Blob cache delete failed:', err)
  }

  memoryCache.delete(key)
}
