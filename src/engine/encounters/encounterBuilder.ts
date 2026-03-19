import type { EnemyTemplate } from '@engine/types/enemy.ts'
import type { NodeType } from '@engine/types/map.ts'
import { getEnemiesByTier } from '@data/dataLoader.ts'
import { SeededRNG } from '../../utils/random.ts'

export function buildEncounter(
  mapRow: number,
  nodeType: NodeType,
  rng: SeededRNG,
): EnemyTemplate[] {
  if (nodeType === 'elite') {
    return buildEliteEncounter(rng)
  }
  if (nodeType === 'boss') {
    return [] // Boss encounters handled separately
  }

  // Determine tier mix based on row
  if (mapRow <= 2) {
    return buildTierEncounter([1], rng, rng.nextInt(1, 2))
  } else if (mapRow <= 4) {
    return buildTierEncounter([1, 2], rng, rng.nextInt(2, 3))
  } else {
    return buildTierEncounter([2, 3], rng, rng.nextInt(2, 3))
  }
}

function buildTierEncounter(
  tiers: (1 | 2 | 3)[],
  rng: SeededRNG,
  count: number,
): EnemyTemplate[] {
  const enemies: EnemyTemplate[] = []
  const usedIds = new Set<string>()

  for (let i = 0; i < count; i++) {
    const tier = rng.pick(tiers)
    const pool = getEnemiesByTier(tier).filter(
      (e) => !usedIds.has(e.id) && !e.id.startsWith('enemy_elite_') && !e.id.includes('token'),
    )
    if (pool.length > 0) {
      const enemy = rng.pick(pool)
      enemies.push(enemy)
      usedIds.add(enemy.id)
    }
  }

  return enemies
}

export function buildEliteEncounter(rng: SeededRNG): EnemyTemplate[] {
  const elites = getEnemiesByTier(3).filter((e) => e.id.startsWith('enemy_elite_'))
  if (elites.length === 0) return []
  return [rng.pick(elites)]
}
