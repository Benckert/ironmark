import { describe, it, expect } from 'vitest'
import {
  getAllCards,
  getAllGear,
  getAllEnemies,
  getAllBosses,
  getAllHeroes,
  getAllEvents,
  getCardById,
  getGearById,
  getEnemyById,
  getHeroById,
  getStarterDeck,
  getCardsByFaction,
  getEnemiesByTier,
  validateData,
} from './dataLoader.ts'

describe('dataLoader', () => {
  describe('validateData', () => {
    it('should return no errors for valid data', () => {
      const errors = validateData()
      expect(errors).toEqual([])
    })
  })

  describe('card data integrity', () => {
    it('should have at least 47 unique non-gear cards', () => {
      const cards = getAllCards()
      expect(cards.length).toBeGreaterThanOrEqual(47)
    })

    it('should have at least 9 gear cards', () => {
      const gear = getAllGear()
      expect(gear.length).toBeGreaterThanOrEqual(9)
    })

    it('should have unique IDs across all cards', () => {
      const cards = getAllCards()
      const gear = getAllGear()
      const ids = [...cards, ...gear].map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have valid costs (0-8) for all cards', () => {
      const cards = getAllCards()
      const gear = getAllGear()
      for (const card of [...cards, ...gear]) {
        expect(card.cost).toBeGreaterThanOrEqual(0)
        expect(card.cost).toBeLessThanOrEqual(8)
      }
    })

    it('every gear card should have upside and downside', () => {
      const gear = getAllGear()
      for (const g of gear) {
        expect(g.upside).toBeDefined()
        expect(g.upside.description).toBeTruthy()
        expect(g.downside).toBeDefined()
        expect(g.downside.description).toBeTruthy()
      }
    })

    it('should have cards from all factions', () => {
      const factions = ['might', 'wisdom', 'heart', 'neutral']
      for (const faction of factions) {
        const cards = getCardsByFaction(faction)
        expect(cards.length).toBeGreaterThan(0)
      }
    })
  })

  describe('hero data integrity', () => {
    it('should have at least 2 heroes', () => {
      const heroes = getAllHeroes()
      expect(heroes.length).toBeGreaterThanOrEqual(2)
    })

    it('each hero should have exactly 10 starter deck cards', () => {
      const heroes = getAllHeroes()
      for (const hero of heroes) {
        expect(hero.starterDeckIds.length).toBe(10)
      }
    })

    it('all starter deck card references should exist', () => {
      const heroes = getAllHeroes()
      for (const hero of heroes) {
        const deck = getStarterDeck(hero.id)
        expect(deck.length).toBe(10)
      }
    })

    it('heroes should have valid starting HP', () => {
      const heroes = getAllHeroes()
      for (const hero of heroes) {
        expect(hero.startingHp).toBeGreaterThan(0)
        expect(hero.startingHp).toBeLessThanOrEqual(40)
      }
    })
  })

  describe('enemy data integrity', () => {
    it('should have at least 15 enemies', () => {
      const enemies = getAllEnemies()
      expect(enemies.length).toBeGreaterThanOrEqual(15)
    })

    it('all enemies should have positive HP', () => {
      const enemies = getAllEnemies()
      for (const enemy of enemies) {
        expect(enemy.hp).toBeGreaterThan(0)
      }
    })

    it('should have enemies in all 3 tiers', () => {
      for (const tier of [1, 2, 3] as const) {
        const enemies = getEnemiesByTier(tier)
        expect(enemies.length).toBeGreaterThan(0)
      }
    })

    it('all enemies should have at least 1 intent', () => {
      const enemies = getAllEnemies()
      for (const enemy of enemies) {
        expect(enemy.intents.length).toBeGreaterThan(0)
      }
    })

    it('should have at least 1 boss', () => {
      const bosses = getAllBosses()
      expect(bosses.length).toBeGreaterThan(0)
    })
  })

  describe('event data integrity', () => {
    it('should have at least 5 events', () => {
      const events = getAllEvents()
      expect(events.length).toBeGreaterThanOrEqual(5)
    })

    it('each event should have at least 2 choices', () => {
      const events = getAllEvents()
      for (const event of events) {
        expect(event.choices.length).toBeGreaterThanOrEqual(2)
      }
    })
  })

  describe('lookup functions', () => {
    it('getCardById should return correct card', () => {
      const card = getCardById('might_starter_ally_001')
      expect(card).toBeDefined()
      expect(card?.name).toBe('Ashblade Recruit')
    })

    it('getGearById should return correct gear', () => {
      const gear = getGearById('might_gear_001')
      expect(gear).toBeDefined()
      expect(gear?.name).toBe('Iron Gauntlets')
    })

    it('getEnemyById should return correct enemy', () => {
      const enemy = getEnemyById('enemy_goblin_scout')
      expect(enemy).toBeDefined()
      expect(enemy?.name).toBe('Goblin Scout')
    })

    it('getHeroById should return correct hero', () => {
      const hero = getHeroById('hero_kael')
      expect(hero).toBeDefined()
      expect(hero?.name).toBe('Kael')
    })

    it('should return undefined for non-existent IDs', () => {
      expect(getCardById('nonexistent')).toBeUndefined()
      expect(getGearById('nonexistent')).toBeUndefined()
      expect(getEnemyById('nonexistent')).toBeUndefined()
      expect(getHeroById('nonexistent')).toBeUndefined()
    })
  })
})
