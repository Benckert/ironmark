import { describe, it, expect } from 'vitest'
import { SeededRNG } from './random.ts'

describe('SeededRNG', () => {
  describe('determinism', () => {
    it('same seed produces same sequence', () => {
      const rng1 = new SeededRNG('test-seed')
      const rng2 = new SeededRNG('test-seed')
      for (let i = 0; i < 100; i++) {
        expect(rng1.next()).toBe(rng2.next())
      }
    })

    it('different seeds produce different sequences', () => {
      const rng1 = new SeededRNG('seed-a')
      const rng2 = new SeededRNG('seed-b')
      const values1 = Array.from({ length: 10 }, () => rng1.next())
      const values2 = Array.from({ length: 10 }, () => rng2.next())
      expect(values1).not.toEqual(values2)
    })
  })

  describe('next', () => {
    it('returns values between 0 and 1', () => {
      const rng = new SeededRNG('bounds-test')
      for (let i = 0; i < 1000; i++) {
        const val = rng.next()
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThan(1)
      }
    })
  })

  describe('nextInt', () => {
    it('returns integers within range', () => {
      const rng = new SeededRNG('int-test')
      for (let i = 0; i < 1000; i++) {
        const val = rng.nextInt(1, 6)
        expect(val).toBeGreaterThanOrEqual(1)
        expect(val).toBeLessThanOrEqual(6)
        expect(Number.isInteger(val)).toBe(true)
      }
    })

    it('handles single-value range', () => {
      const rng = new SeededRNG('single')
      expect(rng.nextInt(5, 5)).toBe(5)
    })
  })

  describe('pick', () => {
    it('picks element from array', () => {
      const rng = new SeededRNG('pick-test')
      const items = ['a', 'b', 'c']
      for (let i = 0; i < 100; i++) {
        expect(items).toContain(rng.pick(items))
      }
    })

    it('throws on empty array', () => {
      const rng = new SeededRNG('empty')
      expect(() => rng.pick([])).toThrow()
    })
  })

  describe('shuffle', () => {
    it('returns all elements', () => {
      const rng = new SeededRNG('shuffle-test')
      const items = [1, 2, 3, 4, 5]
      const shuffled = rng.shuffle(items)
      expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5])
    })

    it('does not mutate original', () => {
      const rng = new SeededRNG('no-mutate')
      const items = [1, 2, 3, 4, 5]
      rng.shuffle(items)
      expect(items).toEqual([1, 2, 3, 4, 5])
    })

    it('same seed produces same shuffle', () => {
      const rng1 = new SeededRNG('same-shuffle')
      const rng2 = new SeededRNG('same-shuffle')
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      expect(rng1.shuffle(items)).toEqual(rng2.shuffle(items))
    })
  })

  describe('weightedPick', () => {
    it('heavily weighted item is picked most often', () => {
      const rng = new SeededRNG('weighted')
      const items = ['common', 'rare']
      const weights = [90, 10]
      let commonCount = 0
      const trials = 1000
      for (let i = 0; i < trials; i++) {
        if (rng.weightedPick(items, weights) === 'common') {
          commonCount++
        }
      }
      expect(commonCount).toBeGreaterThan(trials * 0.8)
    })

    it('throws on mismatched lengths', () => {
      const rng = new SeededRNG('mismatch')
      expect(() => rng.weightedPick(['a', 'b'], [1])).toThrow()
    })

    it('throws on empty array', () => {
      const rng = new SeededRNG('empty')
      expect(() => rng.weightedPick([], [])).toThrow()
    })
  })
})
