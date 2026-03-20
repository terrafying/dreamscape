export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dreamscape.quest').replace(/\/$/, '')

export function accountRedirectUrl(): string {
  return `${SITE_URL}/account`
}
