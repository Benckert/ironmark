import Dexie from 'dexie'
import type { RunHistoryEntry } from '@engine/types/run.ts'

export interface SerializedRunState {
  id: string
  data: string // JSON-serialized RunState
  timestamp: number
}

export interface MetaProgressEntry {
  key: string
  value: number
}

class IronmarkDB extends Dexie {
  activeRun!: Dexie.Table<SerializedRunState, string>
  runHistory!: Dexie.Table<RunHistoryEntry, string>
  metaProgress!: Dexie.Table<MetaProgressEntry, string>

  constructor() {
    super('ironmark')
    this.version(1).stores({
      activeRun: 'id',
      runHistory: 'id, timestamp, result',
      metaProgress: 'key',
    })
  }
}

export const db = new IronmarkDB()

// Active run persistence
export async function saveActiveRun(runStateJson: string): Promise<void> {
  await db.activeRun.put({
    id: 'current',
    data: runStateJson,
    timestamp: Date.now(),
  })
}

export async function loadActiveRun(): Promise<string | null> {
  const entry = await db.activeRun.get('current')
  return entry?.data ?? null
}

export async function clearActiveRun(): Promise<void> {
  await db.activeRun.delete('current')
}

// Run history
export async function saveRunHistory(entry: RunHistoryEntry): Promise<void> {
  await db.runHistory.put(entry)
}

export async function getRunHistory(): Promise<RunHistoryEntry[]> {
  return db.runHistory.orderBy('timestamp').reverse().toArray()
}

export async function getRunCount(): Promise<number> {
  return db.runHistory.count()
}

export async function getVictoryCount(): Promise<number> {
  return db.runHistory.where('result').equals('victory').count()
}

// Meta-progression
export async function getMetaProgress(key: string): Promise<number> {
  const entry = await db.metaProgress.get(key)
  return entry?.value ?? 0
}

export async function setMetaProgress(key: string, value: number): Promise<void> {
  await db.metaProgress.put({ key, value })
}

export async function incrementMetaProgress(key: string, amount: number = 1): Promise<number> {
  const current = await getMetaProgress(key)
  const newValue = current + amount
  await setMetaProgress(key, newValue)
  return newValue
}
