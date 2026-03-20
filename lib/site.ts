export const SITE_URL = (
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dreamscape.quest')
).replace(/\/$/, '')

export function accountRedirectUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/account`
  }
  return `${SITE_URL}/account`
}
