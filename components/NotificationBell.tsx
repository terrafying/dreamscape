'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiFetch'

type NotificationType =
  | 'transit_alert'
  | 'weekly_digest'
  | 'new_follower'
  | 'dream_reaction'
  | 'circle_invite'
  | 'circle_dream'

type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  body: string
  metadata?: { link?: string } | null
  read: boolean
  created_at: string
}

function typeIcon(type: NotificationType): string {
  switch (type) {
    case 'transit_alert':
      return '✦'
    case 'weekly_digest':
      return '✉'
    case 'new_follower':
      return '◎'
    case 'dream_reaction':
      return '💭'
    case 'circle_invite':
      return '◌'
    case 'circle_dream':
      return '◈'
    default:
      return '•'
  }
}

function timeAgo(input: string): string {
  const ts = new Date(input).getTime()
  if (!Number.isFinite(ts)) return 'now'
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function NotificationBell() {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const fetchInFlightRef = useRef(false)
  const cacheRef = useRef<{ at: number; data: NotificationItem[] }>({ at: 0, data: [] })

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  const fetchNotifications = useCallback(async (force = false) => {
    if (fetchInFlightRef.current) return

    const now = Date.now()
    if (!force && now - cacheRef.current.at < 20_000) {
      setItems(cacheRef.current.data)
      return
    }

    fetchInFlightRef.current = true
    try {
      const res = await apiFetch('/api/notifications')
      const json = await res.json()
      const nextItems = Array.isArray(json?.notifications)
        ? (json.notifications as NotificationItem[])
        : []
      cacheRef.current = { at: Date.now(), data: nextItems }
      setItems(nextItems)
    } catch {
    } finally {
      fetchInFlightRef.current = false
    }
  }, [])

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))
    cacheRef.current = {
      at: Date.now(),
      data: cacheRef.current.data.map((item) => (item.id === id ? { ...item, read: true } : item)),
    }

    try {
      await apiFetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ ids: [id] }),
      })
    } catch {
    }
  }, [])

  const handleItemClick = useCallback(
    async (item: NotificationItem) => {
      if (!item.read) await markRead(item.id)
      const link = item.metadata?.link
      if (link && typeof link === 'string') {
        setOpen(false)
        router.push(link)
      }
    },
    [markRead, router]
  )

  useEffect(() => {
    void fetchNotifications(true)
    const id = setInterval(() => {
      void fetchNotifications(true)
    }, 60_000)
    return () => clearInterval(id)
  }, [fetchNotifications])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (rootRef.current.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <div ref={rootRef} className="relative flex items-center justify-center px-2">
      <button
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) void fetchNotifications(false)
        }}
        aria-label="Notifications"
        className="relative flex h-full min-h-[62px] items-center justify-center px-3 transition-opacity hover:opacity-90"
        style={{ color: 'var(--text)' }}
      >
        <span className="text-xl leading-none" style={{ fontFamily: 'monospace' }}>🔔</span>
        {unreadCount > 0 && (
          <span
            className="absolute right-2 top-3 min-w-[18px] rounded-full px-1 text-center text-[10px] font-semibold"
            style={{
              background: 'var(--violet)',
              color: '#0a0715',
              lineHeight: '18px',
              height: 18,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute bottom-[calc(100%+10px)] right-0 w-[min(92vw,360px)] overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(10, 10, 20, 0.97)',
            border: '1px solid rgba(167,139,250,0.35)',
            boxShadow: '0 16px 42px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span
              className="text-[11px] uppercase tracking-widest"
              style={{ color: 'var(--muted)', fontFamily: 'monospace' }}
            >
              Notifications
            </span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{unreadCount} unread</span>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
                No recent notifications.
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => void handleItemClick(item)}
                  className="w-full px-3 py-3 text-left transition-colors hover:bg-white/5"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: item.read ? 'transparent' : 'rgba(167,139,250,0.08)',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="pt-0.5 text-xs" style={{ color: 'var(--violet)', fontFamily: 'monospace' }}>
                      {typeIcon(item.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-xs font-medium" style={{ color: 'var(--text)', fontFamily: 'monospace' }}>
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px]" style={{ color: 'var(--muted)' }}>
                          {timeAgo(item.created_at)}
                        </span>
                      </div>
                      <p
                        className="mt-1 line-clamp-2 text-[12px]"
                        style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}
                        title={item.body}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
