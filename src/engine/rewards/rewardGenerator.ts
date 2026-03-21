import type { Card, Faction, Rarity, GearCard } from '@engine/types/card.ts'
import type { Relic } from '@engine/types/relic.ts'
import type { NodeType } from '@engine/types/map.ts'
import { SeededRNG } from '../../utils/random.ts'
import { rollRarity, updateRarityOffset } from './rarityRoller.ts'
import { getAllCards, getAllGear } from '@data/dataLoader.ts'

export interface CardRewardResult {
  cards: Card[]
  newRarityOffset: number
}

export function generateCardRewards(
  playerFaction: Faction,
  rarityOffset: number,
  isElite: boolean,
  rng: SeededRNG,
): CardRewardResult {
  const cards: Card[] = []
  const usedIds = new Set<string>()
  const rarities: Rarity[] = []

  for (let i = 0; i < 3; i++) {
    const rarity = rollRarity(rarityOffset, isElite, rng)
    rarities.push(rarity)

    const faction = rollFaction(playerFaction, rng)
    const pool = getAllCards().filter(
      (c) =>
        c.faction === faction &&
        c.rarity === rarity &&
        !usedIds.has(c.id) &&
        !c.id.includes('starter'),
    )

    if (pool.length > 0) {
      const card = rng.pick(pool)
      cards.push(card)
      usedIds.add(card.id)
    } else {
      // Fallback: any card of that rarity
      const fallback = getAllCards().filter(
        (c) => c.rarity === rarity && !usedIds.has(c.id) && !c.id.includes('starter'),
      )
      if (fallback.length > 0) {
        const card = rng.pick(fallback)
        cards.push(card)
        usedIds.add(card.id)
      }
    }
  }

  const newRarityOffset = updateRarityOffset(rarityOffset, rarities)

  return { cards, newRarityOffset }
}

function rollFaction(playerFaction: Faction, rng: SeededRNG): Faction {
  const factions: Faction[] = [playerFaction, 'might', 'wisdom', 'heart', 'neutral']
  const otherFactions = factions.filter(
    (f) => f !== playerFaction && f !== 'neutral',
  )

  // 60% own, 25% other (split), 15% neutral
  const roll = rng.next()
  if (roll < 0.6) return playerFaction
  if (roll < 0.85) return rng.pick(otherFactions)
  return 'neutral'
}

export function generateGoldReward(
  nodeType: NodeType,
  rng: SeededRNG,
): number {
  switch (nodeType) {
    case 'combat':
      return rng.nextInt(15, 25)
    case 'elite':
      return rng.nextInt(25, 40)
    case 'boss':
      return 50
    default:
      return 0
  }
}

export function generateGearReward(rng: SeededRNG): GearCard | null {
  const allGear = getAllGear()
  if (allGear.length === 0) return null
  return rng.pick(allGear)
}

export function generateRelicReward(rng: SeededRNG): Relic {
  const relics: Relic[] = [
    {
      id: 'relic_warriors_pendant',
      name: "Warrior's Pendant",
      description: 'Start each combat with 1 extra mana.',
      rarity: 'uncommon',
      effect: { description: '+1 starting mana', type: 'bonus_starting_mana', value: 1, trigger: 'on_combat_start' },
      artId: 'art_warriors_pendant',
    },
    {
      id: 'relic_lucky_coin',
      name: 'Lucky Coin',
      description: 'Gain 5 extra gold after each combat.',
      rarity: 'common',
      effect: { description: '+5 gold', type: 'bonus_gold', value: 5, trigger: 'passive' },
      artId: 'art_lucky_coin',
    },
    {
      id: 'relic_ancient_tome',
      name: 'Ancient Tome',
      description: 'Draw 1 extra card at the start of each combat.',
      rarity: 'uncommon',
      effect: { description: '+1 starting draw', type: 'bonus_starting_draw', value: 1, trigger: 'on_combat_start' },
      artId: 'art_ancient_tome',
    },
    {
      id: 'relic_blood_chalice',
      name: 'Blood Chalice',
      description: 'Gain 2 max HP after each combat victory.',
      rarity: 'rare',
      effect: { description: '+2 max HP on win', type: 'bonus_max_hp_on_win', value: 2, trigger: 'passive' },
      artId: 'art_blood_chalice',
    },
    {
      id: 'relic_iron_ring',
      name: 'Iron Ring',
      description: 'Start each combat with 2 armor.',
      rarity: 'common',
      effect: { description: '+2 starting armor', type: 'bonus_starting_armor', value: 2, trigger: 'on_combat_start' },
      artId: 'art_iron_ring',
    },
    {
      id: 'relic_ember_stone',
      name: 'Ember Stone',
      description: 'Your spells deal 1 extra damage.',
      rarity: 'uncommon',
      effect: { description: '+1 spell damage', type: 'bonus_spell_damage', value: 1, trigger: 'passive' },
      artId: 'art_ember_stone',
    },
    {
      id: 'relic_healer_charm',
      name: "Healer's Charm",
      description: 'Heal 3 HP at the end of each combat.',
      rarity: 'common',
      effect: { description: '+3 HP on combat end', type: 'heal_on_combat_end', value: 3, trigger: 'passive' },
      artId: 'art_healer_charm',
    },
    {
      id: 'relic_crystal_skull',
      name: 'Crystal Skull',
      description: 'Card rewards include an extra choice.',
      rarity: 'rare',
      effect: { description: '+1 reward choice', type: 'bonus_reward_choice', value: 1, trigger: 'passive' },
      artId: 'art_crystal_skull',
    },
  ]
  return rng.pick(relics)
}

export function calculateRerollCost(rerollCount: number): number {
  return 25 + rerollCount * 25
}

export function canAffordReroll(gold: number, rerollCount: number): boolean {
  return gold >= calculateRerollCost(rerollCount)
}
