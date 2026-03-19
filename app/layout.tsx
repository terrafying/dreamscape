import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

const SITE_URL = 'https://www.dreamscape.quest'

export const metadata: Metadata = {
  title: 'Dreamscape',
  description: 'Premium dream logging, pattern analysis, and sleep narratives — powered by AI and the stars.',
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Dreamscape',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Dreamscape',
    description: 'Log your dreams. Decode your unconscious.',
    url: SITE_URL,
    siteName: 'Dreamscape',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dreamscape',
    description: 'Log your dreams. Decode your unconscious.',
  },
  icons: {
    apple: '/icon-192.png',
    icon: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#07070f',
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
