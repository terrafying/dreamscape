import { registerPlugin, Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import type { BiometricData } from './types'

interface CloudStorePlugin {
  get(options: { key: string }): Promise<{ value: string }>
  set(options: { key: string; value: string }): Promise<void>
  remove(options: { key: string }): Promise<void>
}

const CloudStore = registerPlugin<CloudStorePlugin>('CloudStore')
const BIOMETRICS_KEY = 'dreamscape_biometrics'

async function getStorageValue(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await CloudStore.get({ key })
      return value || null
    } catch {
      const { value } = await Preferences.get({ key })
      return value
    }
  }
  return localStorage.getItem(key)
}

async function setStorageValue(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CloudStore.set({ key, value })
    } catch {
      await Preferences.set({ key, value })
    }
  } else {
    localStorage.setItem(key, value)
  }
}

async function removeStorageValue(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CloudStore.remove({ key })
    } catch {
      await Preferences.remove({ key })
    }
  } else {
    localStorage.removeItem(key)
  }
}

function normalizeBiometricData(data: BiometricData[]): BiometricData[] {
  const map = new Map<string, BiometricData>()
  for (const item of data) {
    map.set(item.date, item)
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
}

export async function getBiometricData(): Promise<BiometricData[]> {
  try {
    const raw = await getStorageValue(BIOMETRICS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return normalizeBiometricData(parsed)
  } catch {
    return []
  }
}

export async function saveBiometricData(entry: BiometricData): Promise<void> {
  const current = await getBiometricData()
  const next = normalizeBiometricData([entry, ...current])
  await setStorageValue(BIOMETRICS_KEY, JSON.stringify(next))
}

export async function saveBiometricDataBatch(entries: BiometricData[]): Promise<void> {
  const current = await getBiometricData()
  const next = normalizeBiometricData([...entries, ...current])
  await setStorageValue(BIOMETRICS_KEY, JSON.stringify(next))
}

export async function deleteBiometricData(date: string): Promise<void> {
  const current = await getBiometricData()
  const next = current.filter((item) => item.date !== date)
  await setStorageValue(BIOMETRICS_KEY, JSON.stringify(next))
}

export async function clearBiometricData(): Promise<void> {
  await removeStorageValue(BIOMETRICS_KEY)
}
