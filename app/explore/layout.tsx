import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Liminal Atlas',
  description: 'Walk the symbols drawn from your dreams and visions—a simple exploration with hyperdimensional atmosphere.',
}

export default function ExploreLayout({ children }: { children: ReactNode }) {
  return children
}
