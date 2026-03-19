import type { Card, GearCard } from './card.ts'
import type { Relic } from './relic.ts'

export interface RewardState {
  goldEarned: number
  cardChoices: Card[]
  gearChoice: GearCard | null
  relicChoice: Relic | null
  rerollCount: number
  selectedCardIndex: number | null
  phase: 'revealing' | 'choosing' | 'done'
}
