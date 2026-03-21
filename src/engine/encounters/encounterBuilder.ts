import type { EnemyTemplate } from '@engine/types/enemy.ts'
import type { NodeType } from '@engine/types/map.ts'
import { getEnemiesByTierAndStage } from '@data/dataLoader.ts'
import { SeededRNG } from '../../utils/random.ts'

export function buildEncounter(
  mapRow: number,
  nodeType: NodeType,
  rng: SeededRNG,
  stage: number = 1,
): EnemyTemplate[] {
  if (nodeType === 'elite') {
    return buildEliteEncounter(rng, stage)
  }
  if (nodeType === 'boss') {
    return [] // Boss encounters handled separately
  }

  // Determine tier mix based on row and stage
  if (mapRow <= 2) {
    return buildTierEncounter([1], rng, rng.nextInt(1, 2), stage)
  } else if (mapRow <= 4) {
    return buildTierEncounter([1, 2], rng, rng.nextInt(2, 3), stage)
  } else {
    return buildTierEncounter([2, 3], rng, rng.nextInt(2, 3), stage)
  }
}

function buildTierEncounter(
  tiers: (1 | 2 | 3)[],
  rng: SeededRNG,
  count: number,
  stage: number,
): EnemyTemplate[] {
  const enemies: EnemyTemplate[] = []
  const usedIds = new Set<string>()

  for (let i = 0; i < count; i++) {
    const tier = rng.pick(tiers)
    const pool = getEnemiesByTierAndStage(tier, stage).filter(
      (e) => !usedIds.has(e.id) && !e.id.includes('elite_') && !e.id.includes('token'),
    )
    if (pool.length > 0) {
      const enemy = rng.pick(pool)
      enemies.push(enemy)
      usedIds.add(enemy.id)
    }
  }

  return enemies
}

export function buildEliteEncounter(rng: SeededRNG, stage: number = 1): EnemyTemplate[] {
  const elites = getEnemiesByTierAndStage(3, stage).filter((e) => e.id.includes('elite_'))
  if (elites.length === 0) return []
  return [rng.pick(elites)]
}
