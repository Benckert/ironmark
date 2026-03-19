import type { Rarity } from './card.ts'

export interface RelicEffect {
  description: string
  type: string
  value: number
  trigger: 'start_of_turn' | 'end_of_turn' | 'on_combat_start' | 'on_card_play' | 'passive'
}

export interface Relic {
  id: string
  name: string
  description: string
  rarity: Rarity
  effect: RelicEffect
  artId: string
}
