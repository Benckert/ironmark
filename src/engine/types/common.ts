import type { Keyword } from './card.ts'

export interface StatusEffect {
  type: Keyword
  stacks: number
  duration?: number
}

export type TargetType =
  | 'single_enemy'
  | 'all_enemies'
  | 'single_ally'
  | 'self'
  | 'all_allies'
  | 'random_enemy'
  | 'hero'
