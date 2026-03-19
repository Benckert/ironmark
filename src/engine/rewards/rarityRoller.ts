import type { Rarity } from '@engine/types/card.ts'
import { SeededRNG } from '../../utils/random.ts'

interface RarityWeights {
  common: number
  uncommon: number
  rare: number
}

const normalWeights: RarityWeights = { common: 60, uncommon: 37, rare: 3 }
const eliteWeights: RarityWeights = { common: 50, uncommon: 40, rare: 10 }

export function rollRarity(
  rarityOffset: number,
  isElite: boolean,
  rng: SeededRNG,
): Rarity {
  const base = isElite ? eliteWeights : normalWeights
  const adjustedRare = Math.max(0, base.rare + rarityOffset)
  const adjustedCommon = Math.max(0, base.common - Math.max(0, rarityOffset))

  const rarities: Rarity[] = ['common', 'uncommon', 'rare']
  const weights = [adjustedCommon, base.uncommon, adjustedRare]

  return rng.weightedPick(rarities, weights)
}

export function updateRarityOffset(
  currentOffset: number,
  offeredRarities: Rarity[],
): number {
  const hasRare = offeredRarities.includes('rare')
  if (hasRare) {
    return -5 // Reset
  }

  const allCommon = offeredRarities.every((r) => r === 'common')
  if (allCommon) {
    return Math.min(currentOffset + 1, 40)
  }

  return currentOffset
}
