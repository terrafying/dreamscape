import type { BiometricData } from '@/lib/types'

export interface OuraAuthorizationStatus {
  authorized: boolean
  requestedAt: string
  source: 'oura'
}

function scoreFromDate(date: string, seed: number): number {
  let hash = seed
  for (let i = 0; i < date.length; i++) hash += date.charCodeAt(i) * (i + 2)
  return hash
}

export async function requestOuraPermissions(): Promise<OuraAuthorizationStatus> {
  return {
    authorized: false,
    requestedAt: new Date().toISOString(),
    source: 'oura',
  }
}

export function getOuraSampleData(dates: string[]): BiometricData[] {
  return dates.map((date, i) => {
    const base = scoreFromDate(date, 31 + i)
    return {
      date,
      sleepScore: 58 + (base % 38),
      hrv: 30 + (base % 52),
      deepSleepMinutes: 48 + (base % 84),
      restfulnessIndex: 50 + (base % 44),
    }
  })
}
