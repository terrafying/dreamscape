import { getSupabase } from '@/lib/supabaseClient'
import { getDreams, saveDream, deleteDream } from '@/lib/store'
import type { DreamLog } from '@/lib/types'

const SYNC_KEY = 'dreamscape_cloud_last_synced'

export function getLastSyncedAt(): number | null {
  const v = localStorage.getItem(SYNC_KEY)
  return v ? parseInt(v, 10) : null
}

function setLastSyncedAt(ts: number) {
  localStorage.setItem(SYNC_KEY, String(ts))
}

async function pullFromCloud(userId: string): Promise<DreamLog[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_dreams')
    .select('dream_id, dream_data, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error || !data) return []
  return (data as { dream_id: string; dream_data: DreamLog; updated_at: string }[]).map((r) => r.dream_data)
}

async function pushToCloud(userId: string, dreams: DreamLog[]): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  for (const d of dreams) {
    await (supabase.from('user_dreams') as ReturnType<typeof supabase.from>).upsert({
      user_id: userId,
      dream_id: d.id,
      dream_data: d as unknown as Record<string, unknown>,
    } as any, { onConflict: 'user_id,dream_id' })
  }
}

async function deleteFromCloud(userId: string, dreamId: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase
    .from('user_dreams')
    .delete()
    .eq('user_id', userId)
    .eq('dream_id', dreamId)
}

function merge(local: DreamLog[], cloud: DreamLog[]): DreamLog[] {
  const merged = new Map<string, DreamLog>()
  for (const d of cloud) merged.set(d.id, d)
  for (const d of local) {
    const existing = merged.get(d.id)
    if (!existing || d.createdAt > existing.createdAt) merged.set(d.id, d)
  }
  return Array.from(merged.values()).sort((a, b) => b.createdAt - a.createdAt)
}

export async function syncDreams(userId: string): Promise<{ merged: DreamLog[]; pulled: number; pushed: number }> {
  const [local, cloud] = await Promise.all([getDreams(), pullFromCloud(userId)])
  const merged = merge(local, cloud)
  setLastSyncedAt(Date.now())
  for (const d of merged) await saveDream(d)
  await pushToCloud(userId, merged)
  const pulled = cloud.filter((c) => !local.find((l) => l.id === c.id)).length
  return { merged, pulled, pushed: merged.length }
}

export async function syncDream(userId: string, dream: DreamLog): Promise<void> {
  const supabase = getSupabase()
  if (!supabase || !userId) return
  await (supabase.from('user_dreams') as ReturnType<typeof supabase.from>).upsert({
    user_id: userId,
    dream_id: dream.id,
    dream_data: dream as unknown as Record<string, unknown>,
  } as any, { onConflict: 'user_id,dream_id' })
}

export async function syncDeleteDream(userId: string, dreamId: string): Promise<void> {
  await deleteDream(dreamId)
  await deleteFromCloud(userId, dreamId)
}
