import type { Card } from '@engine/types/card.ts'
import type { CombatState } from '@engine/types/combat.ts'
import { SeededRNG } from '../../utils/random.ts'
import { getCardById } from '@data/dataLoader.ts'

export function createDeck(cardIds: string[]): Card[] {
  const deck: Card[] = []
  for (const id of cardIds) {
    const card = getCardById(id)
    if (card) {
      // Create a unique instance by adding instanceId
      deck.push({ ...card })
    }
  }
  return deck
}

export function shuffleDeck(deck: readonly Card[], rng: SeededRNG): Card[] {
  return rng.shuffle(deck)
}

export function drawCards(state: CombatState, count: number): CombatState {
  let drawPile = [...state.drawPile]
  let discardPile = [...state.discardPile]
  const hand = [...state.hand]

  for (let i = 0; i < count; i++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) {
        break // No more cards to draw
      }
      // Shuffle discard into draw pile
      // We use a simple deterministic shuffle here since RNG state
      // should be managed at a higher level
      drawPile = [...discardPile]
      discardPile = []
      // Reverse as a simple deterministic shuffle for the engine
      // Real shuffle should be done with SeededRNG at combat init
      drawPile.reverse()
    }
    const card = drawPile.pop()
    if (card) {
      hand.push(card)
    }
  }

  return {
    ...state,
    drawPile,
    discardPile,
    hand,
  }
}

export function drawCardsWithRng(state: CombatState, count: number, rng: SeededRNG): CombatState {
  let drawPile = [...state.drawPile]
  let discardPile = [...state.discardPile]
  const hand = [...state.hand]

  for (let i = 0; i < count; i++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) {
        break
      }
      drawPile = rng.shuffle(discardPile)
      discardPile = []
    }
    const card = drawPile.pop()
    if (card) {
      hand.push(card)
    }
  }

  return {
    ...state,
    drawPile,
    discardPile,
    hand,
  }
}

export function discardCard(state: CombatState, cardId: string): CombatState {
  const cardIndex = state.hand.findIndex((c) => c.id === cardId)
  if (cardIndex === -1) return state

  const hand = [...state.hand]
  const discardPile = [...state.discardPile]
  const [card] = hand.splice(cardIndex, 1)
  discardPile.push(card)

  return {
    ...state,
    hand,
    discardPile,
  }
}

export function discardHand(state: CombatState): CombatState {
  return {
    ...state,
    discardPile: [...state.discardPile, ...state.hand],
    hand: [],
  }
}

export function removeCardFromDeck(deck: readonly Card[], cardId: string): Card[] {
  const index = deck.findIndex((c) => c.id === cardId)
  if (index === -1) return [...deck]
  const newDeck = [...deck]
  newDeck.splice(index, 1)
  return newDeck
}

export function upgradeCard(deck: readonly Card[], cardId: string): Card[] {
  return deck.map((card) => {
    if (card.id !== cardId || card.upgraded) return card

    const upgraded = { ...card, upgraded: true, name: card.name + '+' }
    const { property, modifier } = card.upgradeEffect

    // Apply the upgrade modifier to the appropriate property
    if (property === 'attack' && 'attack' in upgraded) {
      (upgraded as Card & { attack: number }).attack += modifier
    } else if (property === 'health' && 'health' in upgraded) {
      (upgraded as Card & { health: number }).health += modifier
    } else if (property === 'cost') {
      upgraded.cost = Math.max(0, upgraded.cost + modifier)
    } else if (property === 'effect.value' && 'effect' in upgraded) {
      const withEffect = upgraded as Card & { effect: { value: number } }
      withEffect.effect = { ...withEffect.effect, value: withEffect.effect.value + modifier }
    } else if (property === 'upside.value' && 'upside' in upgraded) {
      const withUpside = upgraded as Card & { upside: { value: number } }
      withUpside.upside = { ...withUpside.upside, value: withUpside.upside.value + modifier }
    } else if (property === 'downside.value' && 'downside' in upgraded) {
      const withDownside = upgraded as Card & { downside: { value: number } }
      withDownside.downside = { ...withDownside.downside, value: withDownside.downside.value + modifier }
    }

    return upgraded
  })
}
