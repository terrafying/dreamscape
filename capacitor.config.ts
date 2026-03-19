import type { CapacitorConfig } from '@capacitor/cli';

const isProduction = process.env.NODE_ENV === 'production'

const config: CapacitorConfig = {
  appId: 'com.terrafying.dreamscape',
  appName: 'Dreamscape',
  webDir: 'out',
  // In production native builds, API calls go to the Vercel deployment.
  // Remove `server` block entirely when building the final App Store binary
  // (the static export bundles the app and calls the URL via NEXT_PUBLIC_API_BASE_URL).
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
