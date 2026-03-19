export type CardType = 'ally' | 'spell' | 'gear'
export type Faction = 'might' | 'wisdom' | 'heart' | 'neutral'
export type Rarity = 'common' | 'uncommon' | 'rare'
export type Keyword =
  | 'strike'
  | 'echo'
  | 'blessing'
  | 'ward'
  | 'taunt'
  | 'deathblow'
  | 'burn'
  | 'poison'
  | 'fury'

export interface Effect {
  type:
    | 'damage'
    | 'heal'
    | 'draw'
    | 'armor'
    | 'apply_status'
    | 'summon'
    | 'destroy'
    | 'buff_attack'
    | 'buff_health'
    | 'mana_gain'
  value: number
  target?: string
  statusType?: Keyword
  duration?: number
}

export interface GearEffect {
  description: string
  type: string
  value: number
  trigger?: 'start_of_turn' | 'end_of_turn' | 'on_play' | 'on_attack' | 'passive'
}

export interface UpgradeEffect {
  description: string
  property: string
  modifier: number
}

export interface BaseCard {
  id: string
  name: string
  type: CardType
  faction: Faction
  rarity: Rarity
  cost: number
  keywords: Keyword[]
  flavorText: string
  artId: string
  upgraded: boolean
  upgradeEffect: UpgradeEffect
}

export interface AllyCard extends BaseCard {
  type: 'ally'
  attack: number
  health: number
  strikeEffect?: Effect
  deathblowEffect?: Effect
}

export interface SpellCard extends BaseCard {
  type: 'spell'
  effect: Effect
  targetType:
    | 'single_enemy'
    | 'all_enemies'
    | 'single_ally'
    | 'self'
    | 'all_allies'
    | 'random_enemy'
}

export interface GearCard extends BaseCard {
  type: 'gear'
  upside: GearEffect
  downside: GearEffect
}

export type Card = AllyCard | SpellCard | GearCard
