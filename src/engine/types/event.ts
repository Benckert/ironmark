export interface EventOutcome {
  description: string
  effects: EventEffect[]
}

export interface EventEffect {
  type: 'heal' | 'damage' | 'gold' | 'add_card' | 'remove_card' | 'add_gear' | 'max_hp' | 'add_curse' | 'extra_enemy' | 'reveal_map' | 'skip_node'
  value?: number
  cardId?: string
  cardRarity?: string
  cardFaction?: string
}

export interface EventChoice {
  label: string
  description: string
  outcome: EventOutcome
}

export interface EventDefinition {
  id: string
  name: string
  narrative: string
  choices: EventChoice[]
  artId: string
}
