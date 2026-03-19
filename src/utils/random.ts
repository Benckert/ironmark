import seedrandom from 'seedrandom'

export class SeededRNG {
  private rng: seedrandom.PRNG

  constructor(seed: string) {
    this.rng = seedrandom(seed)
  }

  next(): number {
    return this.rng()
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array')
    }
    return array[this.nextInt(0, array.length - 1)]
  }

  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      const temp = result[i]
      result[i] = result[j]
      result[j] = temp
    }
    return result
  }

  weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights must have same length')
    }
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array')
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let roll = this.next() * totalWeight
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i]
      if (roll <= 0) {
        return items[i]
      }
    }
    return items[items.length - 1]
  }
}
