/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use 'export' only for mobile/Capacitor builds (NEXT_OUTPUT=export npm run build:mobile)
  // For Vercel web deployment, omit output so API routes work normally
  ...(process.env.NEXT_OUTPUT === 'export' ? { output: 'export' } : {}),
}

module.exports = nextConfig
