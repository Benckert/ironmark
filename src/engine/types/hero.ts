import type { Faction, Effect } from './card.ts'

export interface HeroPower {
  name: string
  description: string
  cost: number
  effect: Effect
  targetRequired: boolean
}

export interface HeroDefinition {
  id: string
  name: string
  title: string
  faction: Faction
  startingHp: number
  passive: {
    name: string
    description: string
  }
  heroPower: HeroPower
  starterDeckIds: string[]
  artId: string
}
