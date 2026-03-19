import type { Card, AllyCard, GearCard, Keyword } from './card.ts'
import type { StatusEffect } from './common.ts'
import type { Intent } from './enemy.ts'

export type TurnPhase =
  | 'player_action'
  | 'enemy_phase'
  | 'turn_start'
  | 'turn_end'
  | 'combat_over'

export interface PlayerState {
  heroId: string
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  armor: number
  equippedGear: GearCard[]
  gearInventory: GearCard[]
  heroPowerUsedThisTurn: boolean
  statuses: StatusEffect[]
}

export interface AllyInstance {
  instanceId: string
  card: AllyCard
  currentHp: number
  currentAttack: number
  statuses: StatusEffect[]
  hasAttackedThisTurn: boolean
}

export interface EnemyInstance {
  instanceId: string
  enemyId: string
  name: string
  hp: number
  maxHp: number
  attack: number
  currentIntentIndex: number
  intents: Intent[]
  keywords: Keyword[]
  statuses: StatusEffect[]
  buffs: { attack: number; armor: number }
}

export type CombatActionType =
  | 'play_card'
  | 'use_hero_power'
  | 'end_turn'
  | 'enemy_action'
  | 'ally_attack'
  | 'status_tick'
  | 'death'

export interface CombatLogEntry {
  turn: number
  action: CombatActionType
  source: string
  target?: string
  value?: number
  description: string
}

export type CombatResult = 'victory' | 'defeat' | 'ongoing'

export interface CombatState {
  turn: number
  phase: TurnPhase
  result: CombatResult
  player: PlayerState
  enemies: EnemyInstance[]
  allies: AllyInstance[]
  drawPile: Card[]
  hand: Card[]
  discardPile: Card[]
  graveyard: Card[]
  log: CombatLogEntry[]
}
