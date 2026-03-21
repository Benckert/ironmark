import type { Card, GearCard } from '@engine/types/card.ts'
import type { RunState } from '@engine/types/run.ts'
import type { EventDefinition } from '@engine/types/event.ts'
import type { ShopInventory } from '@engine/rewards/shopGenerator.ts'
import type { EventResult } from '@engine/events/eventEngine.ts'
import { calculateRerollCost } from '@engine/rewards/rewardGenerator.ts'
import { generateShop, buyCard, buyGear, buyCardRemoval } from '@engine/rewards/shopGenerator.ts'
import { resolveChoice } from '@engine/events/eventEngine.ts'
import { removeCardFromDeck, upgradeCard } from '@engine/cards/deckManager.ts'
import { equipGear } from '@engine/cards/gearManager.ts'
import { SeededRNG } from '../utils/random.ts'

interface StoreAccessors {
  getRun: () => RunState | null
  getShop: () => ShopInventory | null
  getCurrentEvent: () => EventDefinition | null
  getShopRerollCount: () => number
  setRun: (run: RunState) => void
  setShop: (shop: ShopInventory | null) => void
  setShopRerollCount: (count: number) => void
  getRng: (context: string) => SeededRNG
  returnToMap: () => void
}

export function createRewardActions(access: StoreAccessors) {
  return {
    selectRewardCard: (card: Card) => {
      const run = access.getRun()
      if (!run) return
      access.setRun({ ...run, deck: [...run.deck, card] })
    },

    skipRewardCards: () => {
      // No state change needed
    },

    rerollRewards: () => {
      const run = access.getRun()
      if (!run || !run.hero) return
      const cost = calculateRerollCost(run.rerollCount)
      if (run.gold < cost) return

      access.setRun({
        ...run,
        gold: run.gold - cost,
        rerollCount: run.rerollCount + 1,
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + cost },
      })
    },

    takeGear: (gear: GearCard) => {
      const run = access.getRun()
      if (!run) return
      const equipped = equipGear(run.equippedGear, [...run.gearInventory, gear], gear)
      access.setRun({ ...run, gearInventory: equipped.gearInventory, equippedGear: equipped.equippedGear })
    },

    skipGear: () => {
      // No state change needed
    },

    continueFromReward: () => {
      access.returnToMap()
    },
  }
}

export function createShopActions(access: StoreAccessors) {
  return {
    shopBuyCard: (index: number) => {
      const run = access.getRun()
      const shop = access.getShop()
      if (!run || !shop) return
      const result = buyCard(shop, index, run.gold)
      if (!result) return
      access.setRun({
        ...run,
        gold: result.newGold,
        deck: [...run.deck, result.card],
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + (run.gold - result.newGold) },
      })
      access.setShop(result.shop)
    },

    shopBuyGear: (index: number) => {
      const run = access.getRun()
      const shop = access.getShop()
      if (!run || !shop) return
      const result = buyGear(shop, index, run.gold)
      if (!result) return
      const equipped = equipGear(run.equippedGear, [...run.gearInventory, result.gear], result.gear)
      access.setRun({
        ...run,
        gold: result.newGold,
        gearInventory: equipped.gearInventory,
        equippedGear: equipped.equippedGear,
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + (run.gold - result.newGold) },
      })
      access.setShop(result.shop)
    },

    shopRemoveCard: (cardId: string) => {
      const run = access.getRun()
      const shop = access.getShop()
      if (!run || !shop) return
      const result = buyCardRemoval(shop, run.gold)
      if (!result) return
      access.setRun({
        ...run,
        gold: result.newGold,
        deck: removeCardFromDeck(run.deck, cardId),
        cardRemovalCount: run.cardRemovalCount + 1,
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + (run.gold - result.newGold) },
      })
      access.setShop({ ...shop, cardRemovalCost: result.newCardRemovalCost })
    },

    shopReroll: () => {
      const run = access.getRun()
      const shop = access.getShop()
      if (!run || !shop || !run.hero || run.gold < shop.rerollCost) return

      const newShopRerollCount = access.getShopRerollCount() + 1
      const cost = shop.rerollCost
      const rng = access.getRng('shop_reroll_' + newShopRerollCount)
      const newShop = generateShop(run.hero.faction, run.cardRemovalCount, newShopRerollCount, rng)

      access.setRun({
        ...run,
        gold: run.gold - cost,
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + cost },
      })
      access.setShop(newShop)
      access.setShopRerollCount(newShopRerollCount)
    },

    leaveShop: () => {
      access.returnToMap()
    },
  }
}

export function createRestActions(access: StoreAccessors) {
  return {
    restHeal: () => {
      const run = access.getRun()
      if (!run) return
      const healAmount = Math.floor(run.maxHp * 0.3)
      const newHp = Math.min(run.hp + healAmount, run.maxHp)
      access.setRun({ ...run, hp: newHp })
    },

    restUpgrade: (cardId: string) => {
      const run = access.getRun()
      if (!run) return
      const newDeck = upgradeCard(run.deck, cardId)
      access.setRun({ ...run, deck: newDeck })
    },

    restRemove: (cardId: string) => {
      const run = access.getRun()
      if (!run) return
      access.setRun({ ...run, deck: removeCardFromDeck(run.deck, cardId) })
    },
  }
}

export function createEventActions(access: StoreAccessors) {
  return {
    eventChoose: (choiceIndex: number): EventResult => {
      const run = access.getRun()
      const currentEvent = access.getCurrentEvent()
      if (!run || !currentEvent || !run.hero) {
        return {
          hpDelta: 0, maxHpDelta: 0, goldDelta: 0,
          addedCards: [], addedGear: [],
          addCurse: false, extraEnemy: false, revealMap: false, skipNode: false,
          outcomeDescription: 'Error',
        }
      }
      const rng = access.getRng('event_choice')
      const result = resolveChoice(currentEvent, choiceIndex, run.hero.faction, rng)

      const newHp = Math.max(1, Math.min(run.hp + result.hpDelta, run.maxHp + result.maxHpDelta))
      const newMaxHp = Math.max(1, run.maxHp + result.maxHpDelta)
      const newGold = Math.max(0, run.gold + result.goldDelta)

      let updatedGearInventory = [...run.gearInventory]
      let updatedEquippedGear = [...run.equippedGear]
      for (const gear of result.addedGear) {
        const equipped = equipGear(updatedEquippedGear, [...updatedGearInventory, gear], gear)
        updatedEquippedGear = equipped.equippedGear
        updatedGearInventory = equipped.gearInventory
      }

      access.setRun({
        ...run,
        hp: newHp,
        maxHp: newMaxHp,
        gold: newGold,
        deck: [...run.deck, ...result.addedCards],
        gearInventory: updatedGearInventory,
        equippedGear: updatedEquippedGear,
        stats: {
          ...run.stats,
          goldEarned: run.stats.goldEarned + Math.max(0, result.goldDelta),
          goldSpent: run.stats.goldSpent + Math.max(0, -result.goldDelta),
        },
      })

      return result
    },

    eventContinue: () => {
      access.returnToMap()
    },
  }
}
