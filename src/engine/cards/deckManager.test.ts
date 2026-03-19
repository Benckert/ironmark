import { describe, it, expect } from 'vitest'
import {
  createDeck,
  shuffleDeck,
  drawCards,
  drawCardsWithRng,
  discardCard,
  discardHand,
  removeCardFromDeck,
  upgradeCard,
} from './deckManager.ts'
import type { CombatState } from '@engine/types/combat.ts'
import type { Card } from '@engine/types/card.ts'
import { SeededRNG } from '../../utils/random.ts'

function makeMockCard(id: string, name: string = 'Test Card'): Card {
  return {
    id,
    name,
    type: 'spell',
    faction: 'might',
    rarity: 'common',
    cost: 1,
    effect: { type: 'damage', value: 2 },
    targetType: 'single_enemy',
    keywords: [],
    flavorText: '',
    artId: '',
    upgraded: false,
    upgradeEffect: { description: 'Cost -1', property: 'cost', modifier: -1 },
  } as Card
}

function makeMockCombatState(overrides: Partial<CombatState> = {}): CombatState {
  return {
    turn: 1,
    phase: 'player_action',
    result: 'ongoing',
    player: {
      heroId: 'hero_kael',
      hp: 28,
      maxHp: 28,
      mana: 1,
      maxMana: 1,
      armor: 0,
      equippedGear: [],
      gearInventory: [],
      heroPowerUsedThisTurn: false,
      statuses: [],
    },
    enemies: [],
    allies: [],
    drawPile: [],
    hand: [],
    discardPile: [],
    graveyard: [],
    log: [],
    ...overrides,
  }
}

describe('deckManager', () => {
  describe('createDeck', () => {
    it('creates a deck from valid card IDs', () => {
      const deck = createDeck(['might_starter_ally_001', 'might_starter_spell_001'])
      expect(deck.length).toBe(2)
      expect(deck[0].name).toBe('Ashblade Recruit')
    })

    it('skips invalid card IDs', () => {
      const deck = createDeck(['nonexistent', 'might_starter_ally_001'])
      expect(deck.length).toBe(1)
    })
  })

  describe('shuffleDeck', () => {
    it('returns all cards in a new order', () => {
      const rng = new SeededRNG('shuffle-test')
      const cards = Array.from({ length: 10 }, (_, i) => makeMockCard(`card_${i}`))
      const shuffled = shuffleDeck(cards, rng)
      expect(shuffled.length).toBe(10)
      expect(shuffled.map((c) => c.id).sort()).toEqual(cards.map((c) => c.id).sort())
    })

    it('same seed produces same shuffle', () => {
      const cards = Array.from({ length: 10 }, (_, i) => makeMockCard(`card_${i}`))
      const rng1 = new SeededRNG('same')
      const rng2 = new SeededRNG('same')
      expect(shuffleDeck(cards, rng1).map((c) => c.id)).toEqual(
        shuffleDeck(cards, rng2).map((c) => c.id),
      )
    })
  })

  describe('drawCards', () => {
    it('draws cards from drawPile to hand', () => {
      const cards = [makeMockCard('a'), makeMockCard('b'), makeMockCard('c')]
      const state = makeMockCombatState({ drawPile: cards })
      const result = drawCards(state, 2)
      expect(result.hand.length).toBe(2)
      expect(result.drawPile.length).toBe(1)
    })

    it('shuffles discard into draw when draw is empty', () => {
      const discard = [makeMockCard('a'), makeMockCard('b')]
      const state = makeMockCombatState({ drawPile: [], discardPile: discard })
      const result = drawCards(state, 1)
      expect(result.hand.length).toBe(1)
      expect(result.discardPile.length).toBe(0)
    })

    it('stops drawing when both piles are empty', () => {
      const state = makeMockCombatState({ drawPile: [], discardPile: [] })
      const result = drawCards(state, 5)
      expect(result.hand.length).toBe(0)
    })

    it('draws partial when not enough cards', () => {
      const cards = [makeMockCard('a')]
      const state = makeMockCombatState({ drawPile: cards, discardPile: [] })
      const result = drawCards(state, 5)
      expect(result.hand.length).toBe(1)
    })
  })

  describe('drawCardsWithRng', () => {
    it('shuffles discard pile with seeded RNG', () => {
      const rng = new SeededRNG('rng-draw')
      const discard = Array.from({ length: 5 }, (_, i) => makeMockCard(`card_${i}`))
      const state = makeMockCombatState({ drawPile: [], discardPile: discard })
      const result = drawCardsWithRng(state, 3, rng)
      expect(result.hand.length).toBe(3)
      expect(result.discardPile.length).toBe(0)
      expect(result.drawPile.length).toBe(2)
    })
  })

  describe('discardCard', () => {
    it('moves card from hand to discard', () => {
      const card = makeMockCard('test')
      const state = makeMockCombatState({ hand: [card] })
      const result = discardCard(state, 'test')
      expect(result.hand.length).toBe(0)
      expect(result.discardPile.length).toBe(1)
    })

    it('does nothing if card not in hand', () => {
      const state = makeMockCombatState({ hand: [makeMockCard('a')] })
      const result = discardCard(state, 'nonexistent')
      expect(result.hand.length).toBe(1)
    })
  })

  describe('discardHand', () => {
    it('moves all hand cards to discard', () => {
      const hand = [makeMockCard('a'), makeMockCard('b'), makeMockCard('c')]
      const state = makeMockCombatState({ hand, discardPile: [makeMockCard('d')] })
      const result = discardHand(state)
      expect(result.hand.length).toBe(0)
      expect(result.discardPile.length).toBe(4)
    })
  })

  describe('removeCardFromDeck', () => {
    it('removes a card by ID', () => {
      const deck = [makeMockCard('a'), makeMockCard('b'), makeMockCard('c')]
      const result = removeCardFromDeck(deck, 'b')
      expect(result.length).toBe(2)
      expect(result.find((c) => c.id === 'b')).toBeUndefined()
    })

    it('only removes first occurrence', () => {
      const deck = [makeMockCard('a'), makeMockCard('a'), makeMockCard('b')]
      const result = removeCardFromDeck(deck, 'a')
      expect(result.length).toBe(2)
      expect(result.filter((c) => c.id === 'a').length).toBe(1)
    })

    it('returns copy if card not found', () => {
      const deck = [makeMockCard('a')]
      const result = removeCardFromDeck(deck, 'nonexistent')
      expect(result.length).toBe(1)
    })
  })

  describe('upgradeCard', () => {
    it('applies upgrade effect and adds + suffix', () => {
      const card = makeMockCard('test')
      card.upgradeEffect = { description: 'Cost -1', property: 'cost', modifier: -1 }
      card.cost = 2
      const result = upgradeCard([card], 'test')
      expect(result[0].upgraded).toBe(true)
      expect(result[0].name).toBe('Test Card+')
      expect(result[0].cost).toBe(1)
    })

    it('does not upgrade already upgraded cards', () => {
      const card = makeMockCard('test')
      card.upgraded = true
      card.cost = 2
      const result = upgradeCard([card], 'test')
      expect(result[0].cost).toBe(2)
    })

    it('cost cannot go below 0', () => {
      const card = makeMockCard('test')
      card.cost = 0
      card.upgradeEffect = { description: 'Cost -1', property: 'cost', modifier: -1 }
      const result = upgradeCard([card], 'test')
      expect(result[0].cost).toBe(0)
    })
  })
})
