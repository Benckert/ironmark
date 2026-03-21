import type { Card, GearCard, Faction, Rarity } from '@engine/types/card.ts'
import { SeededRNG } from '../../utils/random.ts'
import { getAllCards, getAllGear } from '@data/dataLoader.ts'

export interface ShopItem<T> {
  item: T
  price: number
  sold: boolean
}

export interface ShopInventory {
  cards: ShopItem<Card>[]
  gear: ShopItem<GearCard>[]
  cardRemovalCost: number
  rerollCost: number
  rerollCount: number
}

const CARD_PRICES: Record<Rarity, [number, number]> = {
  common: [15, 25],
  uncommon: [35, 50],
  rare: [60, 80],
}

const GEAR_PRICES: Record<Rarity, [number, number]> = {
  common: [25, 35],
  uncommon: [45, 65],
  rare: [75, 95],
}

export function generateShop(
  playerFaction: Faction,
  cardRemovalCount: number,
  shopRerollCount: number,
  rng: SeededRNG,
): ShopInventory {
  const cards = generateShopCards(playerFaction, rng)
  const gear = generateShopGear(rng)

  return {
    cards,
    gear,
    cardRemovalCost: 35 + cardRemovalCount * 15,
    rerollCost: 5 + shopRerollCount * 5,
    rerollCount: shopRerollCount,
  }
}

function generateShopCards(playerFaction: Faction, rng: SeededRNG): ShopItem<Card>[] {
  const pool = getAllCards().filter((c) => !c.id.includes('starter'))
  const usedIds = new Set<string>()
  const result: ShopItem<Card>[] = []

  for (let i = 0; i < 3; i++) {
    // Weight toward player faction
    const roll = rng.next()
    const faction = roll < 0.5 ? playerFaction : undefined

    let candidates = faction
      ? pool.filter((c) => c.faction === faction && !usedIds.has(c.id))
      : pool.filter((c) => !usedIds.has(c.id))

    if (candidates.length === 0) {
      candidates = pool.filter((c) => !usedIds.has(c.id))
    }

    if (candidates.length > 0) {
      const card = rng.pick(candidates)
      usedIds.add(card.id)
      result.push({
        item: card,
        price: rollPrice(CARD_PRICES[card.rarity], rng),
        sold: false,
      })
    }
  }

  return result
}

function generateShopGear(rng: SeededRNG): ShopItem<GearCard>[] {
  const pool = getAllGear()
  const usedIds = new Set<string>()
  const result: ShopItem<GearCard>[] = []

  for (let i = 0; i < 2; i++) {
    const candidates = pool.filter((g) => !usedIds.has(g.id))
    if (candidates.length > 0) {
      const gear = rng.pick(candidates)
      usedIds.add(gear.id)
      result.push({
        item: gear,
        price: rollPrice(GEAR_PRICES[gear.rarity], rng),
        sold: false,
      })
    }
  }

  return result
}

function rollPrice([min, max]: [number, number], rng: SeededRNG): number {
  return rng.nextInt(min, max)
}

export function buyCard(
  shop: ShopInventory,
  index: number,
  gold: number,
): { shop: ShopInventory; card: Card; newGold: number } | null {
  const item = shop.cards[index]
  if (!item || item.sold || gold < item.price) return null

  const newCards = [...shop.cards]
  newCards[index] = { ...item, sold: true }

  return {
    shop: { ...shop, cards: newCards },
    card: item.item,
    newGold: gold - item.price,
  }
}

export function buyGear(
  shop: ShopInventory,
  index: number,
  gold: number,
): { shop: ShopInventory; gear: GearCard; newGold: number } | null {
  const item = shop.gear[index]
  if (!item || item.sold || gold < item.price) return null

  const newGear = [...shop.gear]
  newGear[index] = { ...item, sold: true }

  return {
    shop: { ...shop, gear: newGear },
    gear: item.item,
    newGold: gold - item.price,
  }
}

export function buyCardRemoval(
  shop: ShopInventory,
  gold: number,
): { newGold: number; newCardRemovalCost: number } | null {
  if (gold < shop.cardRemovalCost) return null

  return {
    newGold: gold - shop.cardRemovalCost,
    newCardRemovalCost: shop.cardRemovalCost + 15,
  }
}
