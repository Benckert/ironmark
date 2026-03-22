import type { CombatState, EnemyInstance, AllyInstance } from '@engine/types/combat.ts'
import type { Intent } from '@engine/types/enemy.ts'
import { dealDamageToHero, dealDamageToAlly } from '../combat/damageResolver.ts'
import { findTauntTarget } from '../combat/keywordResolver.ts'
import { SeededRNG } from '../../utils/random.ts'

export function getEnemyIntent(enemy: EnemyInstance): Intent {
  return enemy.intents[enemy.currentIntentIndex % enemy.intents.length]
}

export function advanceEnemyIntent(enemy: EnemyInstance): EnemyInstance {
  return {
    ...enemy,
    currentIntentIndex: (enemy.currentIntentIndex + 1) % enemy.intents.length,
  }
}

/**
 * Picks the best attack target for an enemy.
 * Priority: taunt > low-HP ally > random ally (70%) vs hero (30%).
 * If no allies exist, always attacks hero.
 */
function chooseAttackTarget(
  allies: readonly AllyInstance[],
  rng?: SeededRNG,
): { type: 'hero' } | { type: 'ally'; instanceId: string } {
  const livingAllies = allies.filter((a) => a.currentHp > 0)

  // Taunt always takes priority
  const tauntTarget = findTauntTarget(livingAllies)
  if (tauntTarget) {
    return { type: 'ally', instanceId: tauntTarget.instanceId }
  }

  // No allies on board → attack hero
  if (livingAllies.length === 0) {
    return { type: 'hero' }
  }

  // 70% chance to attack an ally, 30% chance to attack hero
  const roll = rng ? rng.next() : 0.5
  if (roll < 0.7) {
    // Target lowest-HP ally
    const sorted = [...livingAllies].sort(
      (a, b) => a.currentHp - b.currentHp,
    )
    return { type: 'ally', instanceId: sorted[0].instanceId }
  }

  return { type: 'hero' }
}

export function executeEnemyIntent(
  state: CombatState,
  enemy: EnemyInstance,
  rng?: SeededRNG,
): CombatState {
  if (enemy.hp <= 0) return state

  const intent = getEnemyIntent(enemy)
  let currentState = state

  switch (intent.type) {
    case 'attack': {
      const damage = intent.value + enemy.buffs.attack

      const target = chooseAttackTarget(currentState.allies, rng)
      if (target.type === 'ally') {
        const { state: newState } = dealDamageToAlly(
          currentState,
          target.instanceId,
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
