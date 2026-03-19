import type { CombatState, AllyInstance, EnemyInstance } from '@engine/types/combat.ts'
import type { StatusEffect } from '@engine/types/common.ts'
import type { SpellCard } from '@engine/types/card.ts'
import { dealDamageToEnemy, dealDamageToHero } from './damageResolver.ts'

export function resolveStrike(
  state: CombatState,
  ally: AllyInstance,
  targetEnemyId: string,
): CombatState {
  if (!ally.card.keywords.includes('strike') || !ally.card.strikeEffect) {
    return state
  }

  const effect = ally.card.strikeEffect

  switch (effect.type) {
    case 'damage': {
      const { state: newState } = dealDamageToEnemy(
        state,
        targetEnemyId,
        effect.value,
        `${ally.card.name} (Strike)`,
      )
      return newState
    }
    case 'apply_status': {
      if (effect.statusType) {
        return applyStatusToEnemy(state, targetEnemyId, {
          type: effect.statusType,
          stacks: effect.value,
        })
      }
      return state
    }
    case 'buff_attack': {
      const allyIndex = state.allies.findIndex((a) => a.instanceId === ally.instanceId)
      if (allyIndex === -1) return state
      const allies = [...state.allies]
      allies[allyIndex] = {
        ...allies[allyIndex],
        currentAttack: allies[allyIndex].currentAttack + effect.value,
      }
      return { ...state, allies }
    }
    case 'draw': {
      // Draw effects will be handled by combat engine
      return state
    }
    default:
      return state
  }
}

export function resolveDeathblow(
  state: CombatState,
  ally: AllyInstance,
): CombatState {
  if (!ally.card.keywords.includes('deathblow') || !ally.card.deathblowEffect) {
    return state
  }

  const effect = ally.card.deathblowEffect

  switch (effect.type) {
    case 'damage': {
      // Deal damage to all enemies
      let currentState = state
      for (const enemy of currentState.enemies) {
        if (enemy.hp > 0) {
          const { state: newState } = dealDamageToEnemy(
            currentState,
            enemy.instanceId,
            effect.value,
            `${ally.card.name} (Deathblow)`,
          )
          currentState = newState
        }
      }
      return currentState
    }
    case 'draw': {
      // Will be handled by combat engine
      return state
    }
    case 'heal': {
      return state
    }
    default:
      return state
  }
}

export function resolveEcho(
  state: CombatState,
  card: SpellCard,
): CombatState {
  if (!card.keywords.includes('echo')) return state

  // Add a copy back to hand (echo only works once)
  const echoCopy = { ...card, keywords: card.keywords.filter((k) => k !== 'echo') }
  return {
    ...state,
    hand: [...state.hand, echoCopy],
  }
}

export function findTauntTarget(allies: readonly AllyInstance[]): AllyInstance | null {
  for (const ally of allies) {
    if (
      ally.card.keywords.includes('taunt') &&
      ally.currentHp > 0 &&
      !ally.statuses.some((s) => s.type === 'ward' && s.stacks <= 0)
    ) {
      return ally
    }
  }
  return null
}

export function applyStatusToEnemy(
  state: CombatState,
  enemyInstanceId: string,
  status: StatusEffect,
): CombatState {
  const enemyIndex = state.enemies.findIndex((e) => e.instanceId === enemyInstanceId)
  if (enemyIndex === -1) return state

  const enemy = state.enemies[enemyIndex]
  const existingIndex = enemy.statuses.findIndex((s) => s.type === status.type)
  let statuses: StatusEffect[]

  if (existingIndex !== -1) {
    // Stack additively for burn/poison
    statuses = [...enemy.statuses]
    statuses[existingIndex] = {
      ...statuses[existingIndex],
      stacks: statuses[existingIndex].stacks + status.stacks,
    }
  } else {
    statuses = [...enemy.statuses, status]
  }

  const enemies = [...state.enemies]
  enemies[enemyIndex] = { ...enemies[enemyIndex], statuses }
  return { ...state, enemies }
}

export function applyStatusToAlly(
  state: CombatState,
  allyInstanceId: string,
  status: StatusEffect,
): CombatState {
  const allyIndex = state.allies.findIndex((a) => a.instanceId === allyInstanceId)
  if (allyIndex === -1) return state

  const ally = state.allies[allyIndex]
  const existingIndex = ally.statuses.findIndex((s) => s.type === status.type)
  let statuses: StatusEffect[]

  if (existingIndex !== -1) {
    statuses = [...ally.statuses]
    statuses[existingIndex] = {
      ...statuses[existingIndex],
      stacks: statuses[existingIndex].stacks + status.stacks,
    }
  } else {
    statuses = [...ally.statuses, status]
  }

  const allies = [...state.allies]
  allies[allyIndex] = { ...allies[allyIndex], statuses }
  return { ...state, allies }
}

export function tickStatuses(state: CombatState): CombatState {
  let currentState = state

  // Tick burn/poison on enemies
  for (const enemy of currentState.enemies) {
    if (enemy.hp <= 0) continue

    for (const status of enemy.statuses) {
      if (status.type === 'burn' || status.type === 'poison') {
        const { state: newState } = dealDamageToEnemy(
          currentState,
          enemy.instanceId,
          status.stacks,
          `${status.type} (${status.stacks})`,
        )
        currentState = newState
      }
    }
  }

  // Tick burn/poison on hero
  for (const status of currentState.player.statuses) {
    if (status.type === 'burn' || status.type === 'poison') {
      const { state: newState } = dealDamageToHero(
        currentState,
        status.stacks,
        `${status.type} (${status.stacks})`,
      )
      currentState = newState
    }
  }

  return currentState
}

export function removeDeadEnemies(state: CombatState): { state: CombatState; deadEnemies: EnemyInstance[] } {
  const alive: EnemyInstance[] = []
  const dead: EnemyInstance[] = []

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      dead.push(enemy)
    } else {
      alive.push(enemy)
    }
  }

  return {
    state: { ...state, enemies: alive },
    deadEnemies: dead,
  }
}

export function removeDeadAllies(state: CombatState): { state: CombatState; deadAllies: AllyInstance[] } {
  const alive: AllyInstance[] = []
  const dead: AllyInstance[] = []

  for (const ally of state.allies) {
    if (ally.currentHp <= 0) {
      dead.push(ally)
    } else {
      alive.push(ally)
    }
  }

  // Dead allies go to graveyard
  const graveyard = [...state.graveyard, ...dead.map((a) => a.card)]

  return {
    state: { ...state, allies: alive, graveyard },
    deadAllies: dead,
  }
}
