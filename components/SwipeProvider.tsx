'use client'

import { useSwipeNavigation } from '@/lib/useSwipeNavigation'

interface SwipeProviderProps {
  children: React.ReactNode
}

/**
 * Provides swipe navigation for the entire app
 * Wraps the main layout to enable left/right swiping between tabs
 * 
 * Swipe behavior:
 * - Swipe left → next tab
 * - Swipe right → previous tab
 * - Threshold: 50px horizontal movement
 * - Ignores vertical swipes and form input interactions
 */
export default function SwipeProvider({ children }: SwipeProviderProps) {
  // Initialize swipe navigation hook
  useSwipeNavigation({
    threshold: 50,
    onSwipe: (direction) => {
      // Optional: Add haptic feedback or other side effects here
      // console.log(`Swiped ${direction}`)
    },
  })

  return <>{children}</>
}
