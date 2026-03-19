import type { EventDefinition, EventEffect } from '@engine/types/event.ts'
import type { Card, Faction, GearCard, Rarity } from '@engine/types/card.ts'
import { SeededRNG } from '../../utils/random.ts'
import { getAllEvents, getAllCards, getAllGear } from '@data/dataLoader.ts'

export function selectEvent(
  rng: SeededRNG,
  visitedEventIds: string[],
): EventDefinition {
  const allEvents = getAllEvents()
  const unvisited = allEvents.filter((e) => !visitedEventIds.includes(e.id))
  const pool = unvisited.length > 0 ? unvisited : allEvents
  return rng.pick(pool)
}

export interface EventResult {
  hpDelta: number
  maxHpDelta: number
  goldDelta: number
  addedCards: Card[]
  addedGear: GearCard[]
  addCurse: boolean
  extraEnemy: boolean
  revealMap: boolean
  skipNode: boolean
  outcomeDescription: string
}

export function resolveChoice(
  event: EventDefinition,
  choiceIndex: number,
  playerFaction: Faction,
  rng: SeededRNG,
): EventResult {
  const choice = event.choices[choiceIndex]
  if (!choice) {
    return emptyResult('Invalid choice.')
  }

  const result: EventResult = {
    hpDelta: 0,
    maxHpDelta: 0,
    goldDelta: 0,
    addedCards: [],
    addedGear: [],
    addCurse: false,
    extraEnemy: false,
    revealMap: false,
    skipNode: false,
    outcomeDescription: choice.outcome.description,
  }

  for (const effect of choice.outcome.effects) {
    applyEffect(effect, result, playerFaction, rng)
  }

  return result
}

function applyEffect(
  effect: EventEffect,
  result: EventResult,
  playerFaction: Faction,
  rng: SeededRNG,
): void {
  switch (effect.type) {
    case 'heal':
      result.hpDelta += effect.value ?? 0
      break
    case 'damage':
      result.hpDelta -= effect.value ?? 0
      break
    case 'gold':
      result.goldDelta += effect.value ?? 0
      break
    case 'max_hp':
      result.maxHpDelta += effect.value ?? 0
      break
    case 'add_curse':
      result.addCurse = true
      break
    case 'extra_enemy':
      result.extraEnemy = true
      break
    case 'reveal_map':
      result.revealMap = true
      break
    case 'skip_node':
      result.skipNode = true
      break
    case 'add_card': {
      const rarity = (effect.cardRarity as Rarity) ?? 'uncommon'
      const faction = effect.cardFaction === 'any' ? undefined : playerFaction
      const pool = getAllCards().filter(
        (c) =>
          c.rarity === rarity &&
          !c.id.includes('starter') &&
          (faction ? c.faction === faction : true),
      )
      if (pool.length > 0) {
        result.addedCards.push(rng.pick(pool))
      }
      break
    }
    case 'add_gear': {
      const rarity = (effect.cardRarity as Rarity) ?? 'common'
      const pool = getAllGear().filter((g) => g.rarity === rarity)
      if (pool.length > 0) {
        result.addedGear.push(rng.pick(pool))
      }
      break
    }
    case 'remove_card':
      // Handled by UI (player picks which card to remove)
      break
  }
}

function emptyResult(description: string): EventResult {
  return {
    hpDelta: 0,
    maxHpDelta: 0,
    goldDelta: 0,
    addedCards: [],
    addedGear: [],
    addCurse: false,
    extraEnemy: false,
    revealMap: false,
    skipNode: false,
    outcomeDescription: description,
  }
}
