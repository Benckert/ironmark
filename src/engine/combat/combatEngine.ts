import type { Card } from '@engine/types/card.ts'
import type {
  CombatState,
  PlayerState,
} from '@engine/types/combat.ts'
import type { EnemyTemplate } from '@engine/types/enemy.ts'
import type { RunState } from '@engine/types/run.ts'
import { SeededRNG } from '../../utils/random.ts'
import { drawCardsWithRng } from '../cards/deckManager.ts'
import {
  tickStatuses,
  removeDeadEnemies,
  removeDeadAllies,
} from './keywordResolver.ts'
import {
  applyGearStartOfTurn,
  getBonusDrawFromGear,
  getSpellCostModifier,
} from '../cards/gearManager.ts'

// Re-export from split modules for backwards compatibility
export { playCard } from './cardResolver.ts'
export { useHeroPower, endPlayerTurn, endPlayerTurnWithTargets, executeEnemyPhase } from './turnResolver.ts'

let instanceCounter = 0
export function nextInstanceId(): string {
  return `inst_${++instanceCounter}`
}

export function resetInstanceCounter(): void {
  instanceCounter = 0
}

export function createEnemyInstance(template: EnemyTemplate): import('@engine/types/combat.ts').EnemyInstance {
  return {
    instanceId: nextInstanceId(),
    enemyId: template.id,
    name: template.name,
    hp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    currentIntentIndex: 0,
    intents: template.intents,
    keywords: [...template.keywords],
    statuses: [],
    buffs: { attack: 0, armor: 0 },
  }
}

export function initializeCombat(
  runState: RunState,
  enemyTemplates: EnemyTemplate[],
  rng: SeededRNG,
): CombatState {
  const enemies = enemyTemplates.map(createEnemyInstance)

  const deckCards = runState.deck.filter((c) => c.type !== 'gear')
  const shuffledDeck = rng.shuffle(deckCards)

  const player: PlayerState = {
    heroId: runState.hero?.id ?? '',
    hp: runState.hp,
    maxHp: runState.maxHp,
    mana: 0,
    maxMana: 0,
    armor: 0,
    equippedGear: [...runState.equippedGear],
    gearInventory: [...runState.gearInventory],
    heroPowerUsedThisTurn: false,
    statuses: [],
  }

  return {
    turn: 0,
    phase: 'turn_start',
    result: 'ongoing',
    player,
    enemies,
    allies: [],
    drawPile: shuffledDeck,
    hand: [],
    discardPile: [],
    graveyard: [],
    log: [],
  }
}

export function startTurn(state: CombatState, rng: SeededRNG): CombatState {
  if (state.result !== 'ongoing') return state

  const newTurn = state.turn + 1
  const maxMana = Math.min(newTurn, 8)

  let currentState: CombatState = {
    ...state,
    turn: newTurn,
    phase: 'turn_start',
    player: {
      ...state.player,
      mana: maxMana,
      maxMana: maxMana,
      armor: 0,
      heroPowerUsedThisTurn: false,
    },
    allies: state.allies.map((a) => ({ ...a, hasAttackedThisTurn: false })),
  }

  // Apply gear start-of-turn effects
  currentState = applyGearStartOfTurn(currentState)
  if (currentState.result !== 'ongoing') return currentState

  // Tick status effects (burn, poison)
  currentState = tickStatuses(currentState)
  if (currentState.result !== 'ongoing') return currentState

  // Remove dead enemies/allies from status ticks
  const { state: afterEnemyDeath } = removeDeadEnemies(currentState)
  const { state: afterAllyDeath } = removeDeadAllies(afterEnemyDeath)
  currentState = afterAllyDeath

  if (currentState.enemies.length === 0) {
    return { ...currentState, result: 'victory', phase: 'combat_over' }
  }

  // Draw cards
  const handSize = 5 + getBonusDrawFromGear(currentState.player.equippedGear)
  currentState = drawCardsWithRng(currentState, handSize, rng)

  return { ...currentState, phase: 'player_action' }
}

export function getEffectiveCost(card: Card, state: CombatState): number {
  let cost = card.cost

  // Hero passive: Lira's spells cost -1, allies cost +1
  if (state.player.heroId === 'hero_lira') {
    if (card.type === 'spell') {
      cost = Math.max(0, cost - 1)
    } else if (card.type === 'ally') {
      cost += 1
    }
  }

  // Gear modifier: spells cost more
  if (card.type === 'spell') {
    cost += getSpellCostModifier(state.player.equippedGear)
  }

  return Math.max(0, cost)
}

export function canPlayCard(state: CombatState, card: Card): boolean {
  if (state.phase !== 'player_action') return false
  if (state.result !== 'ongoing') return false

  const cost = getEffectiveCost(card, state)
  if (state.player.mana < cost) return false

  // Check ally limit per turn (Mage's Focus gear)
  if (card.type === 'ally') {
    const limitGear = state.player.equippedGear.find(
      (g) => g.downside.type === 'limit_allies_per_turn',
    )
    if (limitGear) {
      const alliesPlayedThisTurn = state.log.filter(
        (entry) =>
          entry.turn === state.turn &&
          entry.action === 'play_card' &&
          entry.description.includes('plays ally'),
      ).length
      if (alliesPlayedThisTurn >= limitGear.downside.value) return false
    }
  }

  // Max 4 allies on board
  if (card.type === 'ally' && state.allies.length >= 4) {
    return false
  }

  return true
}

export interface CombatStats {
  turnsPlayed: number
  damageDealt: number
  damageReceived: number
  cardsPlayed: number
  enemiesKilled: number
}

export function extractCombatStats(state: CombatState, initialEnemyCount: number): CombatStats {
  let damageDealt = 0
  let damageReceived = 0
  let cardsPlayed = 0

  for (const entry of state.log) {
    if (entry.action === 'play_card' && entry.target !== 'Hero' && entry.value) {
      damageDealt += entry.value
    }
    if (entry.action === 'play_card' && entry.source === 'Player') {
      cardsPlayed++
    }
    if (entry.action === 'enemy_action' && entry.target === 'Hero' && entry.value) {
      damageReceived += entry.value
    }
  }

  const survivingEnemies = state.enemies.filter((e) => e.hp > 0).length
  const enemiesKilled = initialEnemyCount - survivingEnemies

  return {
    turnsPlayed: state.turn,
    damageDealt,
    damageReceived,
    cardsPlayed,
    enemiesKilled,
  }
}

export function checkCombatEnd(state: CombatState): CombatState {
  if (state.enemies.length === 0 && state.result === 'ongoing') {
    return { ...state, result: 'victory', phase: 'combat_over' }
  }
  if (state.player.hp <= 0 && state.result === 'ongoing') {
    return { ...state, result: 'defeat', phase: 'combat_over' }
  }
  return state
}
