import type { CombatState } from '@engine/types/combat.ts'
import { SeededRNG } from '../../utils/random.ts'
import { drawCardsWithRng, discardHand } from '../cards/deckManager.ts'
import {
  dealDamageToEnemy,
  healAlly,
} from './damageResolver.ts'
import {
  resolveStrike,
  resolveDeathblow,
  removeDeadEnemies,
  removeDeadAllies,
} from './keywordResolver.ts'
import {
  advanceEnemyIntent,
  executeEnemyIntent,
} from '../encounters/enemyAI.ts'
import {
  applyGearEndOfTurn,
} from '../cards/gearManager.ts'

export function useHeroPower(
  state: CombatState,
  targetId?: string,
  heroDefinition?: { heroPower: { cost: number; effect: { type: string; value: number } } },
  rng?: SeededRNG,
): CombatState {
  if (state.player.heroPowerUsedThisTurn) return state
  if (!heroDefinition) return state

  const cost = heroDefinition.heroPower.cost
  if (state.player.mana < cost) return state

  let currentState: CombatState = {
    ...state,
    player: {
      ...state.player,
      mana: state.player.mana - cost,
      heroPowerUsedThisTurn: true,
    },
  }

  const effect = heroDefinition.heroPower.effect

  switch (effect.type) {
    case 'damage': {
      if (targetId) {
        const { state: newState } = dealDamageToEnemy(currentState, targetId, effect.value, 'Hero Power')
        currentState = newState
      }
      break
    }
    case 'draw': {
      if (rng) {
        currentState = drawCardsWithRng(currentState, effect.value, rng)
      }
      break
    }
    case 'buff_health': {
      if (targetId) {
        const allyIndex = currentState.allies.findIndex((a) => a.instanceId === targetId)
        if (allyIndex !== -1) {
          const allies = [...currentState.allies]
          allies[allyIndex] = {
            ...allies[allyIndex],
            currentHp: allies[allyIndex].currentHp + effect.value,
            statuses: [...allies[allyIndex].statuses, { type: 'ward', stacks: 1 }],
          }
          currentState = { ...currentState, allies }
        }
      }
      break
    }
    default:
      break
  }

  // Check for enemy deaths
  const { state: afterDeath } = removeDeadEnemies(currentState)
  currentState = afterDeath

  if (currentState.enemies.length === 0) {
    return { ...currentState, result: 'victory', phase: 'combat_over' }
  }

  return currentState
}

function resolveAllyAttacks(
  state: CombatState,
  getTargetId: (allyInstanceId: string) => string | undefined,
  rng?: SeededRNG,
): CombatState {
  let currentState = state

  for (const ally of currentState.allies) {
    if (ally.currentHp <= 0 || ally.hasAttackedThisTurn) continue
    if (currentState.enemies.length === 0) break

    const targetId = getTargetId(ally.instanceId) ?? currentState.enemies[0]?.instanceId
    const target = currentState.enemies.find((e) => e.instanceId === targetId && e.hp > 0)
    const resolvedTarget = target ?? currentState.enemies.find((e) => e.hp > 0)
    if (!resolvedTarget) break

    const { state: afterDamage } = dealDamageToEnemy(
      currentState,
      resolvedTarget.instanceId,
      ally.currentAttack,
      ally.card.name,
    )
    currentState = afterDamage

    // Resolve Strike
    currentState = resolveStrike(currentState, ally, resolvedTarget.instanceId, rng)

    // Mark as attacked
    const allyIndex = currentState.allies.findIndex((a) => a.instanceId === ally.instanceId)
    if (allyIndex !== -1) {
      const allies = [...currentState.allies]
      allies[allyIndex] = { ...allies[allyIndex], hasAttackedThisTurn: true }
      currentState = { ...currentState, allies }
    }

    // Remove dead enemies after each attack
    const { state: afterRemove } = removeDeadEnemies(currentState)
    currentState = afterRemove
  }

  return currentState
}

function finalizePlayerTurn(state: CombatState, rng?: SeededRNG): CombatState {
  let currentState = state

  // Remove dead allies and resolve deathblows
  const { state: afterAllyDeath, deadAllies } = removeDeadAllies(currentState)
  currentState = afterAllyDeath
  for (const deadAlly of deadAllies) {
    currentState = resolveDeathblow(currentState, deadAlly, rng)
  }

  // Check victory after ally attacks
  if (currentState.enemies.length === 0) {
    return { ...currentState, result: 'victory', phase: 'combat_over' }
  }

  // Apply gear end-of-turn effects
  currentState = applyGearEndOfTurn(currentState)

  // Orin's passive: heal lowest HP ally for 2
  if (currentState.player.heroId === 'hero_orin' && currentState.allies.length > 0) {
    const lowestAlly = [...currentState.allies].sort((a, b) => a.currentHp - b.currentHp)[0]
    if (lowestAlly) {
      currentState = healAlly(currentState, lowestAlly.instanceId, 2)
    }
  }

  // Discard remaining hand
  currentState = discardHand(currentState)

  return { ...currentState, phase: 'enemy_phase' }
}

export function endPlayerTurn(state: CombatState, rng?: SeededRNG): CombatState {
  if (state.phase !== 'player_action') return state

  const afterAttacks = resolveAllyAttacks(
    state,
    () => undefined, // auto-target: always uses leftmost enemy (default)
    rng,
  )

  return finalizePlayerTurn(afterAttacks, rng)
}

export function endPlayerTurnWithTargets(
  state: CombatState,
  allyTargets: Record<string, string>,
  rng?: SeededRNG,
): CombatState {
  if (state.phase !== 'player_action') return state

  const afterAttacks = resolveAllyAttacks(
    state,
    (allyInstanceId) => allyTargets[allyInstanceId],
    rng,
  )

  return finalizePlayerTurn(afterAttacks, rng)
}

export function executeEnemyPhase(state: CombatState, rng?: SeededRNG): CombatState {
  if (state.phase !== 'enemy_phase') return state

  let currentState = state

  for (const enemy of [...currentState.enemies]) {
    if (enemy.hp <= 0) continue

    const currentEnemy = currentState.enemies.find((e) => e.instanceId === enemy.instanceId)
    if (!currentEnemy || currentEnemy.hp <= 0) continue

    currentState = executeEnemyIntent(currentState, currentEnemy)

    if (currentState.result === 'defeat') {
      return { ...currentState, phase: 'combat_over' }
    }

    // Remove dead allies and resolve deathblows
    const { state: afterAllyDeath, deadAllies } = removeDeadAllies(currentState)
    currentState = afterAllyDeath
    for (const deadAlly of deadAllies) {
      currentState = resolveDeathblow(currentState, deadAlly, rng)
    }

    // Advance enemy intent
    const enemyIndex = currentState.enemies.findIndex(
      (e) => e.instanceId === currentEnemy.instanceId,
    )
    if (enemyIndex !== -1) {
      const enemies = [...currentState.enemies]
      enemies[enemyIndex] = advanceEnemyIntent(enemies[enemyIndex])
      currentState = { ...currentState, enemies }
    }
  }

  return { ...currentState, phase: 'turn_end' }
}
