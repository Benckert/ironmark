import type { Keyword, Effect } from './card.ts'

export type IntentType = 'attack' | 'defend' | 'buff' | 'debuff' | 'summon' | 'heal' | 'unknown'

export interface Intent {
  type: IntentType
  value: number
  description: string
  effect?: Effect
  summonId?: string
}

export interface EnemyTemplate {
  id: string
  name: string
  hp: number
  attack: number
  tier: 1 | 2 | 3
  intents: Intent[]
  keywords: Keyword[]
  statusOnDeath?: Effect
  artId: string
}
