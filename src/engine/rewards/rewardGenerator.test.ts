import { describe, it, expect } from 'vitest'
import {
  generateCardRewards,
  generateGoldReward,
  generateGearReward,
  calculateRerollCost,
  canAffordReroll,
} from './rewardGenerator.ts'
import { SeededRNG } from '../../utils/random.ts'

describe('rewardGenerator', () => {
  describe('generateCardRewards', () => {
    it('returns 3 cards', () => {
      const rng = new SeededRNG('reward-test')
      const result = generateCardRewards('might', -5, false, rng)
      expect(result.cards.length).toBe(3)
    })

    it('returns no duplicate cards', () => {
      const rng = new SeededRNG('no-dup')
      const result = generateCardRewards('might', -5, false, rng)
      const ids = result.cards.map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('does not include starter cards', () => {
      const rng = new SeededRNG('no-starter')
      for (let i = 0; i < 50; i++) {
        const result = generateCardRewards('might', -5, false, rng)
        for (const card of result.cards) {
          expect(card.id).not.toContain('starter')
        }
      }
    })

    it('returns updated rarity offset', () => {
      const rng = new SeededRNG('offset-test')
      const result = generateCardRewards('might', -5, false, rng)
      expect(typeof result.newRarityOffset).toBe('number')
    })
  })

  describe('generateGoldReward', () => {
    it('normal combat gives 10-20 gold', () => {
      const rng = new SeededRNG('gold-test')
      for (let i = 0; i < 100; i++) {
        const gold = generateGoldReward('combat', rng)
        expect(gold).toBeGreaterThanOrEqual(10)
        expect(gold).toBeLessThanOrEqual(20)
      }
    })

    it('elite gives 20-35 gold', () => {
      const rng = new SeededRNG('elite-gold')
      for (let i = 0; i < 100; i++) {
        const gold = generateGoldReward('elite', rng)
        expect(gold).toBeGreaterThanOrEqual(20)
        expect(gold).toBeLessThanOrEqual(35)
      }
    })

    it('boss gives exactly 50 gold', () => {
      const rng = new SeededRNG('boss-gold')
      expect(generateGoldReward('boss', rng)).toBe(50)
    })
  })

  describe('generateGearReward', () => {
    it('returns a gear card', () => {
      const rng = new SeededRNG('gear-reward')
      const gear = generateGearReward(rng)
      expect(gear).not.toBeNull()
      expect(gear!.type).toBe('gear')
      expect(gear!.upside).toBeDefined()
      expect(gear!.downside).toBeDefined()
    })
  })

  describe('reroll costs', () => {
    it('first reroll costs 25', () => {
      expect(calculateRerollCost(0)).toBe(25)
    })

    it('second reroll costs 50', () => {
      expect(calculateRerollCost(1)).toBe(50)
    })

    it('escalates by 25 each time', () => {
      expect(calculateRerollCost(2)).toBe(75)
      expect(calculateRerollCost(3)).toBe(100)
    })

    it('canAffordReroll checks correctly', () => {
      expect(canAffordReroll(30, 0)).toBe(true) // 30 >= 25
      expect(canAffordReroll(20, 0)).toBe(false) // 20 < 25
      expect(canAffordReroll(50, 1)).toBe(true) // 50 >= 50
      expect(canAffordReroll(40, 1)).toBe(false) // 40 < 50
    })
  })
})
