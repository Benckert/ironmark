import { describe, it, expect } from 'vitest'
import { generateShop, buyCard, buyGear, buyCardRemoval } from './shopGenerator.ts'
import { SeededRNG } from '../../utils/random.ts'

describe('shopGenerator', () => {
  describe('generateShop', () => {
    it('generates 3 cards and 2 gear', () => {
      const rng = new SeededRNG('shop-test')
      const shop = generateShop('might', 0, 0, rng)
      expect(shop.cards.length).toBe(3)
      expect(shop.gear.length).toBe(2)
    })

    it('cards have valid prices', () => {
      const rng = new SeededRNG('price-test')
      const shop = generateShop('wisdom', 0, 0, rng)
      for (const item of shop.cards) {
        expect(item.price).toBeGreaterThanOrEqual(15)
        expect(item.price).toBeLessThanOrEqual(80)
        expect(item.sold).toBe(false)
      }
    })

    it('gear has valid prices', () => {
      const rng = new SeededRNG('gear-price')
      const shop = generateShop('heart', 0, 0, rng)
      for (const item of shop.gear) {
        expect(item.price).toBeGreaterThanOrEqual(25)
        expect(item.price).toBeLessThanOrEqual(95)
        expect(item.sold).toBe(false)
      }
    })

    it('card removal cost escalates', () => {
      const rng = new SeededRNG('removal')
      const shop0 = generateShop('might', 0, 0, rng)
      expect(shop0.cardRemovalCost).toBe(35)

      const rng2 = new SeededRNG('removal2')
      const shop1 = generateShop('might', 1, 0, rng2)
      expect(shop1.cardRemovalCost).toBe(50)

      const rng3 = new SeededRNG('removal3')
      const shop2 = generateShop('might', 2, 0, rng3)
      expect(shop2.cardRemovalCost).toBe(65)
    })

    it('reroll cost escalates', () => {
      const rng = new SeededRNG('reroll')
      const shop0 = generateShop('might', 0, 0, rng)
      expect(shop0.rerollCost).toBe(5)

      const rng2 = new SeededRNG('reroll2')
      const shop1 = generateShop('might', 0, 1, rng2)
      expect(shop1.rerollCost).toBe(10)
    })

    it('no duplicate cards', () => {
      const rng = new SeededRNG('dupes')
      const shop = generateShop('might', 0, 0, rng)
      const ids = shop.cards.map((c) => c.item.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('no starter cards in shop', () => {
      for (let i = 0; i < 10; i++) {
        const rng = new SeededRNG(`starter-check-${i}`)
        const shop = generateShop('might', 0, 0, rng)
        for (const item of shop.cards) {
          expect(item.item.id).not.toContain('starter')
        }
      }
    })
  })

  describe('buyCard', () => {
    it('buys a card and deducts gold', () => {
      const rng = new SeededRNG('buy-card')
      const shop = generateShop('might', 0, 0, rng)
      const price = shop.cards[0].price
      const result = buyCard(shop, 0, 200)

      expect(result).not.toBeNull()
      expect(result!.newGold).toBe(200 - price)
      expect(result!.shop.cards[0].sold).toBe(true)
      expect(result!.card.id).toBe(shop.cards[0].item.id)
    })

    it('returns null if not enough gold', () => {
      const rng = new SeededRNG('no-gold')
      const shop = generateShop('might', 0, 0, rng)
      const result = buyCard(shop, 0, 0)
      expect(result).toBeNull()
    })

    it('returns null if already sold', () => {
      const rng = new SeededRNG('sold')
      const shop = generateShop('might', 0, 0, rng)
      const result1 = buyCard(shop, 0, 500)
      const result2 = buyCard(result1!.shop, 0, 500)
      expect(result2).toBeNull()
    })
  })

  describe('buyGear', () => {
    it('buys gear and deducts gold', () => {
      const rng = new SeededRNG('buy-gear')
      const shop = generateShop('might', 0, 0, rng)
      const price = shop.gear[0].price
      const result = buyGear(shop, 0, 200)

      expect(result).not.toBeNull()
      expect(result!.newGold).toBe(200 - price)
      expect(result!.shop.gear[0].sold).toBe(true)
    })
  })

  describe('buyCardRemoval', () => {
    it('deducts gold for card removal', () => {
      const rng = new SeededRNG('remove')
      const shop = generateShop('might', 0, 0, rng)
      const result = buyCardRemoval(shop, 100)

      expect(result).not.toBeNull()
      expect(result!.newGold).toBe(65)
      expect(result!.newCardRemovalCost).toBe(50)
    })

    it('returns null if not enough gold', () => {
      const rng = new SeededRNG('no-remove')
      const shop = generateShop('might', 0, 0, rng)
      const result = buyCardRemoval(shop, 20)
      expect(result).toBeNull()
    })
  })
})
