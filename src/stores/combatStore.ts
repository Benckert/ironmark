import { create } from 'zustand'
import type { CombatState } from '@engine/types/combat.ts'
import type { EnemyTemplate } from '@engine/types/enemy.ts'
import type { RunState } from '@engine/types/run.ts'
import type { Card, SpellCard } from '@engine/types/card.ts'
import type { HeroDefinition } from '@engine/types/hero.ts'
import { SeededRNG } from '../utils/random.ts'
import {
  initializeCombat,
  startTurn,
  playCard as enginePlayCard,
  endPlayerTurn,
  endPlayerTurnWithTargets,
  executeEnemyPhase,
  canPlayCard as engineCanPlayCard,
  useHeroPower as engineUseHeroPower,
  getEffectiveCost,
} from '@engine/combat/combatEngine.ts'

interface CombatStore {
  combat: CombatState | null
  rng: SeededRNG | null
  heroDefinition: HeroDefinition | null
  selectedCardId: string | null
  targetingMode: boolean
  animatingEnemyPhase: boolean
  allyTargetingMode: boolean
  allyTargets: Record<string, string> // allyInstanceId -> enemyInstanceId
  currentAllyTargetIndex: number

  initCombat: (runState: RunState, enemies: EnemyTemplate[], seed: string) => void
  beginTurn: () => void
  selectCard: (cardId: string | null) => void
  playCard: (cardId: string, targetId?: string) => void
  useHeroPower: (targetId?: string) => void
  endTurn: () => void
  assignAllyTarget: (enemyInstanceId: string) => void
  canPlay: (card: Card) => boolean
  getCardCost: (card: Card) => number
  needsTarget: (card: Card) => boolean
  reset: () => void
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  combat: null,
  rng: null,
  heroDefinition: null,
  selectedCardId: null,
  targetingMode: false,
  animatingEnemyPhase: false,
  allyTargetingMode: false,
  allyTargets: {},
  currentAllyTargetIndex: 0,

  initCombat: (runState, enemies, seed) => {
    const rng = new SeededRNG(seed + '_combat')
    const combat = initializeCombat(runState, enemies, rng)
    // Immediately start turn 1 to avoid double-increment from effects
    const combatWithFirstTurn = startTurn(combat, rng)
    set({
      combat: combatWithFirstTurn,
      rng,
      heroDefinition: runState.hero,
      selectedCardId: null,
      targetingMode: false,
      animatingEnemyPhase: false,
    })
  },

  beginTurn: () => {
    const { combat, rng } = get()
    if (!combat || !rng || combat.result !== 'ongoing') return
    const newState = startTurn(combat, rng)
    set({ combat: newState })
  },

  selectCard: (cardId) => {
    const { combat, rng } = get()
    if (!combat || !cardId) {
      set({ selectedCardId: null, targetingMode: false })
      return
    }
    const card = combat.hand.find((c) => c.id === cardId)
    if (!card || !engineCanPlayCard(combat, card)) {
      set({ selectedCardId: null, targetingMode: false })
      return
    }

    // Check if card needs targeting
    const needsTarget =
      (card.type === 'spell' &&
        ((card as SpellCard).targetType === 'single_enemy' ||
          (card as SpellCard).targetType === 'single_ally')) ||
      false

    if (needsTarget) {
      set({ selectedCardId: cardId, targetingMode: true })
    } else {
      // Play immediately
      const newState = enginePlayCard(combat, cardId, undefined, rng ?? undefined)
      set({ combat: newState, selectedCardId: null, targetingMode: false })
    }
  },

  playCard: (cardId, targetId) => {
    const { combat, rng } = get()
    if (!combat) return
    const newState = enginePlayCard(combat, cardId, targetId, rng ?? undefined)
    set({ combat: newState, selectedCardId: null, targetingMode: false })
  },

  useHeroPower: (targetId) => {
    const { combat, heroDefinition, rng } = get()
    if (!combat || !heroDefinition) return
    const newState = engineUseHeroPower(combat, targetId, heroDefinition, rng ?? undefined)
    set({ combat: newState })
  },

  endTurn: () => {
    const { combat, rng } = get()
    if (!combat || combat.phase !== 'player_action') return

    // If there are allies and multiple enemies, enter ally targeting mode
    const attackableAllies = combat.allies.filter((a) => a.currentHp > 0 && !a.hasAttackedThisTurn)
    if (attackableAllies.length > 0 && combat.enemies.filter((e) => e.hp > 0).length > 1) {
      set({
        allyTargetingMode: true,
        allyTargets: {},
        currentAllyTargetIndex: 0,
      })
      return
    }

    // Single or no enemies — proceed with auto-targeting
    set({ animatingEnemyPhase: true })
    let newState = endPlayerTurn(combat, rng ?? undefined)
    if (newState.result === 'ongoing') {
      newState = executeEnemyPhase(newState, rng ?? undefined)
    }
    set({ combat: newState, animatingEnemyPhase: false })
  },

  assignAllyTarget: (enemyInstanceId: string) => {
    const { combat, rng, allyTargets, currentAllyTargetIndex } = get()
    if (!combat) return

    const attackableAllies = combat.allies.filter((a) => a.currentHp > 0 && !a.hasAttackedThisTurn)
    const currentAlly = attackableAllies[currentAllyTargetIndex]
    if (!currentAlly) return

    const newTargets = { ...allyTargets, [currentAlly.instanceId]: enemyInstanceId }
    const nextIndex = currentAllyTargetIndex + 1

    if (nextIndex >= attackableAllies.length) {
      // All allies targeted — execute turn with targets
      set({ allyTargetingMode: false, animatingEnemyPhase: true })
      let newState = endPlayerTurnWithTargets(combat, newTargets, rng ?? undefined)
      if (newState.result === 'ongoing') {
        newState = executeEnemyPhase(newState, rng ?? undefined)
      }
      set({ combat: newState, animatingEnemyPhase: false, allyTargets: {}, currentAllyTargetIndex: 0 })
    } else {
      set({ allyTargets: newTargets, currentAllyTargetIndex: nextIndex })
    }
  },

  canPlay: (card) => {
    const { combat } = get()
    if (!combat) return false
    return engineCanPlayCard(combat, card)
  },

  getCardCost: (card) => {
    const { combat } = get()
    if (!combat) return card.cost
    return getEffectiveCost(card, combat)
  },

  needsTarget: (card) => {
    if (card.type === 'spell') {
      const spell = card as SpellCard
      return spell.targetType === 'single_enemy' || spell.targetType === 'single_ally'
    }
    return false
  },

  reset: () => {
    set({
      combat: null,
      rng: null,
      heroDefinition: null,
      selectedCardId: null,
      targetingMode: false,
      animatingEnemyPhase: false,
      allyTargetingMode: false,
      allyTargets: {},
      currentAllyTargetIndex: 0,
    })
  },
}))
