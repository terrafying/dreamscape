import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Slice Atlas',
  description: 'Navigate a procedural 4D tesseract as 2D slices with portals, rotation planes, and optional Nano Banana vistas.',
}

export default function HypermapLayout({ children }: { children: ReactNode }) {
  return children
}
