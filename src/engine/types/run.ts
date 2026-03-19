import type { Card, GearCard } from './card.ts'
import type { CombatState } from './combat.ts'
import type { HeroDefinition } from './hero.ts'
import type { MapState } from './map.ts'
import type { Relic } from './relic.ts'

export type RunPhase =
  | 'hero_select'
  | 'run_start_gamble'
  | 'map'
  | 'combat'
  | 'reward'
  | 'shop'
  | 'rest'
  | 'event'
  | 'boss'
  | 'victory'
  | 'defeat'
  | 'main_menu'

export interface RunStats {
  turnsPlayed: number
  damageDealt: number
  damageReceived: number
  cardsPlayed: number
  goldEarned: number
  goldSpent: number
  enemiesKilled: number
  nodesVisited: number
}

export interface RunState {
  seed: string
  phase: RunPhase
  hero: HeroDefinition | null
  hp: number
  maxHp: number
  gold: number
  deck: Card[]
  gearInventory: GearCard[]
  equippedGear: GearCard[]
  relics: Relic[]
  map: MapState | null
  currentNodeId: string | null
  combat: CombatState | null
  turnNumber: number
  rarityOffset: number
  cardRemovalCount: number
  rerollCount: number
  stats: RunStats
}

export interface RunStartOption {
  id: string
  label: string
  description: string
  riskLevel: 'safe' | 'moderate' | 'gamble'
  apply: string
  value?: number
  cardId?: string
}

export interface RunHistoryEntry {
  id: string
  timestamp: number
  seed: string
  heroId: string
  result: 'victory' | 'defeat'
  stats: RunStats
  finalDeck: string[]
  finalGear: string[]
  nodesVisited: number
  killedBy?: string
}
