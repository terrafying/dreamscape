import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Dreamscape',
  description: 'Premium dream logging, pattern analysis, and sleep narratives',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
        <main className="flex-1" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          {children}
        </main>
        <Nav />
      </body>
    </html>
  )
}
