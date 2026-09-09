/**
 * Lightweight observability funnel — no dependency, no DSN required.
 *
 * Every paid provider call (LLM, image, video, audio, TTS) and every captured
 * error emits ONE structured JSON line to the server log. On Vercel these are
 * greppable in Log Drains immediately:
 *
 *   vercel logs | grep '"ds_event":"generation"'
 *   vercel logs | grep '"ds_event":"error"'
 *
 * If ERROR_WEBHOOK_URL is set, errors are also POSTed there (works with a
 * Discord webhook, n8n, or a Sentry tunnel). Swapping in @sentry/nextjs later
 * means replacing these two functions — call sites won't change.
 */

type GenerationKind = 'text' | 'image' | 'video' | 'audio' | 'tts'

export interface GenerationMetric {
  kind: GenerationKind
  provider: string
  model?: string
  modelVersion?: string
  outcome: 'success' | 'error' | 'cache_hit'
  durationMs?: number
  surface?: string
}

function emit(payload: Record<string, unknown>) {
  try {
    console.log(JSON.stringify({ ds_ts: new Date().toISOString(), ...payload }))
  } catch {
    /* logging must never throw */
  }
}

export function trackGeneration(m: GenerationMetric): void {
  emit({ ds_event: 'generation', ...m })
}

export async function captureError(scope: string, err: unknown, ctx: Record<string, unknown> = {}): Promise<void> {
  const message = err instanceof Error ? err.message : String(err)
  emit({
    ds_event: 'error',
    scope,
    message,
    stack: err instanceof Error ? err.stack?.split('\n').slice(0, 4).join(' | ') : undefined,
    ...ctx,
  })

  const hook = process.env.ERROR_WEBHOOK_URL
  if (!hook) return
  try {
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, message, ctx }),
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    /* webhook failure must never mask the original error */
  }
}
