import type { BiometricData } from '@/lib/types'

export interface AppleHealthPermissionStatus {
  granted: boolean
  requestedAt: string
  source: 'apple-health'
}

function scoreFromDate(date: string, seed: number): number {
  let hash = seed
  for (let i = 0; i < date.length; i++) hash += date.charCodeAt(i) * (i + 1)
  return hash
}

export async function requestAppleHealthPermissions(): Promise<AppleHealthPermissionStatus> {
  return {
    granted: false,
    requestedAt: new Date().toISOString(),
    source: 'apple-health',
  }
}

export function getAppleHealthSampleData(dates: string[]): BiometricData[] {
  return dates.map((date, i) => {
    const base = scoreFromDate(date, 17 + i)
    return {
      date,
      sleepScore: 62 + (base % 34),
      hrv: 34 + (base % 46),
      deepSleepMinutes: 52 + (base % 78),
      restfulnessIndex: 55 + (base % 38),
    }
  })
}
