import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface SwipeConfig {
  threshold?: number
  onSwipe?: (direction: 'left' | 'right') => void
}

/**
 * Hook for detecting swipe gestures and navigating between tabs
 * Follows the same pattern as DreamOracle card swipes
 */
export function useSwipeNavigation(config: SwipeConfig = {}) {
  const { threshold = 50, onSwipe } = config
  const router = useRouter()
  const pathname = usePathname()
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  // Guard: only process touchend when touchstart was accepted (not a form/no-swipe target)
  const swipeEnabled = useRef(false)

  // Determine current hour for Dusk/Dawn toggle
  function isEveningHour(): boolean {
    const h = new Date().getHours()
    return h >= 18 || h < 5
  }

  // Map pathname to tab index
  function getTabIndex(path: string): number {
    const tabs = [
      { href: '/', label: 'Altar' },
      { href: isEveningHour() ? '/journal' : '/log', label: 'Dusk/Dawn' },
      { href: '/reading', label: 'Reading' },
      { href: '/dreamscape', label: 'Sleep' },
      { href: '/strata', label: 'Strata' },
    ]

    // Check exact match first
    const exactMatch = tabs.findIndex(t => t.href === path)
    if (exactMatch !== -1) return exactMatch

    // Check if path starts with tab href (for nested routes)
    for (let i = 0; i < tabs.length; i++) {
      // Don't match the root '/' for all routes
      if (tabs[i].href !== '/' && path.startsWith(tabs[i].href + '/')) {
        return i
      }
    }

    // Default to Altar
    return 0
  }

  // Get tab href by index
  function getTabHref(index: number): string {
    const tabs = [
      { href: '/', label: 'Altar' },
      { href: isEveningHour() ? '/journal' : '/log', label: 'Dusk/Dawn' },
      { href: '/reading', label: 'Reading' },
      { href: '/dreamscape', label: 'Sleep' },
      { href: '/strata', label: 'Strata' },
    ]
    return tabs[((index % tabs.length) + tabs.length) % tabs.length].href
  }

  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    // Don't swipe if user is interacting with form elements or opted-out containers
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.closest('[data-no-swipe]') ||
      target.closest('[contenteditable]')
    ) {
      swipeEnabled.current = false
      return
    }

    swipeEnabled.current = true
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  // Handle touch end
  const handleTouchEnd = (e: TouchEvent) => {
    // Reject if the start was on a form element (guard against stale coordinates)
    if (!swipeEnabled.current) return

    // Reject if user selected text — they were highlighting, not swiping
    const selection = window.getSelection()
    if (selection && selection.type === 'Range' && selection.toString().length > 0) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY

    const diffX = touchStartX.current - touchEndX
    const diffY = Math.abs(touchStartY.current - touchEndY)

    // Only register as swipe if:
    // 1. Horizontal distance > threshold
    // 2. Horizontal movement dominates vertical (ratio > 1.5 to avoid diagonal false triggers)
    if (Math.abs(diffX) > threshold && Math.abs(diffX) > diffY * 1.5) {
      const currentIndex = getTabIndex(pathname)
      let nextIndex: number

      if (diffX > 0) {
        // Swiped left → next tab
        nextIndex = (currentIndex + 1) % 5
        onSwipe?.('left')
      } else {
        // Swiped right → previous tab
        nextIndex = (currentIndex - 1 + 5) % 5
        onSwipe?.('right')
      }

      const nextHref = getTabHref(nextIndex)
      router.push(nextHref)
    }
  }

  useEffect(() => {
    // Add touch listeners to document
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pathname])
}
