import { createClient } from '@supabase/supabase-js'
import type { DreamLog, DreamExtraction } from './types'

export interface DreamMatch {
  id: string
  symbol_name: string
  match_date: string
  dreamer_ids: string[]
  dreamer_count: number
  created_at: string
}

export interface MatchNotification {
  id: string
  user_id: string
  match_id: string
  symbol_name: string
  matched_dreamer_ids: string[]
  matched_count: number
  read: boolean
  created_at: string
}

export interface MatchFeedItem {
  symbol_name: string
  matched_count: number
  matched_dreamers: Array<{
    id: string
    name: string
    avatar_url?: string
    handle: string
  }>
  match_date: string
  created_at: string
}

/**
 * Find all dream matches for a given date
 * Returns symbols that were dreamed by 2+ people on the same night
 */
export async function findDreamMatches(
  supabase: ReturnType<typeof createClient>,
  targetDate: string = new Date().toISOString().split('T')[0]
): Promise<DreamMatch[]> {
  const { data, error } = await supabase
    .from('dream_matches')
    .select('*')
    .eq('match_date', targetDate)
    .order('dreamer_count', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get all matches for the current user
 */
export async function getUserMatches(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  limit: number = 50
): Promise<MatchFeedItem[]> {
  // Get user's notifications
  const { data: notifications, error: notifError } = await supabase
    .from('match_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (notifError) throw notifError
  if (!notifications || notifications.length === 0) return []

  // Get dreamer profiles for each notification
  const items: MatchFeedItem[] = []

  for (const notif of notifications as any[]) {
    const { data: dreamers, error: dreamerError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, handle')
      .in('id', notif.matched_dreamer_ids)

    if (dreamerError) {
      console.error('Error fetching dreamers:', dreamerError)
      continue
    }

    items.push({
      symbol_name: notif.symbol_name,
      matched_count: notif.matched_count,
      matched_dreamers: (dreamers || []).map((d: any) => ({
        id: d.id,
        name: d.full_name || 'Anonymous',
        avatar_url: d.avatar_url,
        handle: d.handle,
      })),
      match_date: notif.created_at.split('T')[0],
      created_at: notif.created_at,
    })
  }

  return items
}

/**
 * Get unread match count for user
 */
export async function getUnreadMatchCount(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('match_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
  return count || 0
}

/**
 * Mark match notification as read
 */
export async function markMatchAsRead(
  supabase: ReturnType<typeof createClient>,
  notificationId: string
): Promise<void> {
  // Implemented in API route instead
  const response = await fetch('/api/matches/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationId }),
  })
  if (!response.ok) throw new Error('Failed to mark match as read')
}

/**
 * Mark all match notifications as read for user
 */
export async function markAllMatchesAsRead(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  // Bulk update via API if needed
  // For now, individual notifications are marked as read via markMatchAsRead
}

/**
 * Get today's matches with dreamer details
 */
export async function getTodayMatchesWithDreamers(
  supabase: ReturnType<typeof createClient>
): Promise<
  Array<{
    symbol_name: string
    dreamer_count: number
    dreamers: Array<{
      id: string
      name: string
      avatar_url?: string
      handle: string
    }>
  }>
> {
  const today = new Date().toISOString().split('T')[0]

  const { data: matches, error: matchError } = await supabase
    .from('dream_matches')
    .select('*')
    .eq('match_date', today)
    .order('dreamer_count', { ascending: false })

  if (matchError) throw matchError
  if (!matches || matches.length === 0) return []

  const results = []

  for (const match of matches as any[]) {
    const { data: dreamers, error: dreamerError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, handle')
      .in('id', match.dreamer_ids)

    if (dreamerError) {
      console.error('Error fetching dreamers:', dreamerError)
      continue
    }

    results.push({
      symbol_name: match.symbol_name,
      dreamer_count: match.dreamer_count,
      dreamers: (dreamers || []).map((d: any) => ({
        id: d.id,
        name: d.full_name || 'Anonymous',
        avatar_url: d.avatar_url,
        handle: d.handle,
      })),
    })
  }

  return results
}

/**
 * Format match for display
 */
export function formatMatch(match: MatchFeedItem): string {
  const names = match.matched_dreamers.map((d) => d.name).join(', ')
  const count = match.matched_count
  const plural = count === 1 ? 'dreamer' : 'dreamers'
  return `You matched with ${count} ${plural} on "${match.symbol_name}"`
}
