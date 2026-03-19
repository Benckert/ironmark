import { describe, it, expect } from 'vitest'
import { rollRarity, updateRarityOffset } from './rarityRoller.ts'
import { SeededRNG } from '../../utils/random.ts'

describe('rarityRoller', () => {
  describe('rollRarity', () => {
    it('returns valid rarities', () => {
      const rng = new SeededRNG('rarity-test')
      for (let i = 0; i < 100; i++) {
        const rarity = rollRarity(0, false, rng)
        expect(['common', 'uncommon', 'rare']).toContain(rarity)
      }
    })

    it('elite has higher rare chance', () => {
      let normalRareCount = 0
      let eliteRareCount = 0
      const trials = 5000

      const rng1 = new SeededRNG('normal-rarity')
      for (let i = 0; i < trials; i++) {
        if (rollRarity(0, false, rng1) === 'rare') normalRareCount++
      }

      const rng2 = new SeededRNG('elite-rarity')
      for (let i = 0; i < trials; i++) {
        if (rollRarity(0, true, rng2) === 'rare') eliteRareCount++
      }

      expect(eliteRareCount).toBeGreaterThan(normalRareCount)
    })

    it('pity timer increases rare chance', () => {
      let baseRareCount = 0
      let pityRareCount = 0
      const trials = 5000

      const rng1 = new SeededRNG('base-pity')
      for (let i = 0; i < trials; i++) {
        if (rollRarity(-5, false, rng1) === 'rare') baseRareCount++
      }

      const rng2 = new SeededRNG('high-pity')
      for (let i = 0; i < trials; i++) {
        if (rollRarity(30, false, rng2) === 'rare') pityRareCount++
      }

      expect(pityRareCount).toBeGreaterThan(baseRareCount)
    })
  })

  describe('updateRarityOffset', () => {
    it('resets to -5 when rare appears', () => {
      expect(updateRarityOffset(10, ['common', 'rare', 'common'])).toBe(-5)
    })

    it('increases by 1 when all common', () => {
      expect(updateRarityOffset(0, ['common', 'common', 'common'])).toBe(1)
    })

    it('stays same when mixed but no rare', () => {
      expect(updateRarityOffset(5, ['common', 'uncommon', 'common'])).toBe(5)
    })

    it('caps at 40', () => {
      expect(updateRarityOffset(40, ['common', 'common', 'common'])).toBe(40)
    })
  })
})
