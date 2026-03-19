import type { CombatState, EnemyInstance } from '@engine/types/combat.ts'
import type { Intent } from '@engine/types/enemy.ts'
import { dealDamageToHero, dealDamageToAlly } from '../combat/damageResolver.ts'
import { findTauntTarget } from '../combat/keywordResolver.ts'

export function getEnemyIntent(enemy: EnemyInstance): Intent {
  return enemy.intents[enemy.currentIntentIndex % enemy.intents.length]
}

export function advanceEnemyIntent(enemy: EnemyInstance): EnemyInstance {
  return {
    ...enemy,
    currentIntentIndex: (enemy.currentIntentIndex + 1) % enemy.intents.length,
  }
}

export function executeEnemyIntent(
  state: CombatState,
  enemy: EnemyInstance,
): CombatState {
  if (enemy.hp <= 0) return state

  const intent = getEnemyIntent(enemy)
  let currentState = state

  switch (intent.type) {
    case 'attack': {
      const damage = intent.value + enemy.buffs.attack

      // Check for taunt target
      const tauntTarget = findTauntTarget(currentState.allies)
      if (tauntTarget) {
        const { state: newState } = dealDamageToAlly(
          currentState,
          tauntTarget.instanceId,
          damage,
          enemy.name,
        )
        currentState = newState
      } else {
        const { state: newState } = dealDamageToHero(currentState, damage, enemy.name)
        currentState = newState
      }
      break
    }

    case 'defend': {
      if (intent.effect) {
        const enemyIndex = currentState.enemies.findIndex(
          (e) => e.instanceId === enemy.instanceId,
        )
        if (enemyIndex !== -1) {
          const enemies = [...currentState.enemies]
          enemies[enemyIndex] = {
            ...enemies[enemyIndex],
            buffs: {
              ...enemies[enemyIndex].buffs,
              armor: enemies[enemyIndex].buffs.armor + intent.effect.value,
            },
          }
          currentState = { ...currentState, enemies }
        }
      }
      break
    }

    case 'buff': {
      if (intent.effect) {
        const enemyIndex = currentState.enemies.findIndex(
          (e) => e.instanceId === enemy.instanceId,
        )
        if (enemyIndex !== -1) {
          const enemies = [...currentState.enemies]
          if (intent.effect.type === 'buff_attack') {
            enemies[enemyIndex] = {
              ...enemies[enemyIndex],
              buffs: {
                ...enemies[enemyIndex].buffs,
                attack: enemies[enemyIndex].buffs.attack + intent.effect.value,
              },
            }
          }
          currentState = { ...currentState, enemies }
        }
      }
      break
    }

    case 'debuff': {
      if (intent.effect && intent.effect.type === 'apply_status' && intent.effect.statusType) {
        // Apply status to hero
        const statuses = [...currentState.player.statuses]
        const existingIndex = statuses.findIndex(
          (s) => s.type === intent.effect!.statusType,
        )
        if (existingIndex !== -1) {
          statuses[existingIndex] = {
            ...statuses[existingIndex],
            stacks: statuses[existingIndex].stacks + intent.effect.value,
          }
        } else {
          statuses.push({
            type: intent.effect.statusType,
            stacks: intent.effect.value,
          })
        }
        currentState = {
          ...currentState,
          player: { ...currentState.player, statuses },
        }
      }
      break
    }

    case 'heal': {
      if (intent.effect) {
        // Heal all enemies
        const enemies = currentState.enemies.map((e) => {
          if (e.hp <= 0) return e
          return {
            ...e,
            hp: Math.min(e.maxHp, e.hp + intent.effect!.value),
          }
        })
        currentState = { ...currentState, enemies }
      }
      break
    }

    case 'summon': {
      // Summon handling is done by combat engine since it needs access to enemy data
      break
    }

    default:
      break
  }

  return currentState
}
