import type { RunStartOption, RunState } from '@engine/types/run.ts'
import type { Card } from '@engine/types/card.ts'
import { SeededRNG } from '../../utils/random.ts'
import { getAllCards, getAllGear } from '@data/dataLoader.ts'
import { removeCardFromDeck } from '../cards/deckManager.ts'
import { equipGear } from '../cards/gearManager.ts'
import { generateRelicReward } from '../rewards/rewardGenerator.ts'

const SAFE_OPTIONS: Omit<RunStartOption, 'id'>[] = [
  {
    label: 'Gold Purse',
    description: 'Start with extra gold.',
    riskLevel: 'safe',
    apply: 'gold',
    value: 50,
  },
  {
    label: 'Trim the Fat',
    description: 'Remove 1 starter card from your deck.',
    riskLevel: 'safe',
    apply: 'remove_starter',
  },
  {
    label: 'Fortify',
    description: 'Gain 3 max HP.',
    riskLevel: 'safe',
    apply: 'max_hp',
    value: 3,
  },
  {
    label: 'Common Gift',
    description: 'Gain a random Common card.',
    riskLevel: 'safe',
    apply: 'add_card',
    value: 0,
  },
]

const MODERATE_OPTIONS: Omit<RunStartOption, 'id'>[] = [
  {
    label: 'Risky Find',
    description: 'Gain a random Uncommon card, but lose 5 HP.',
    riskLevel: 'moderate',
    apply: 'uncommon_card_lose_hp',
    value: 5,
  },
  {
    label: "Fool's Gold",
    description: 'Gain 40 gold, but add a Curse to your deck.',
    riskLevel: 'moderate',
    apply: 'gold_and_curse',
    value: 40,
  },
  {
    label: 'Scavenged Gear',
    description: 'Gain a random piece of gear (no choice).',
    riskLevel: 'moderate',
    apply: 'random_gear',
  },
]

const GAMBLE_OPTIONS: Omit<RunStartOption, 'id'>[] = [
  {
    label: "Fortune's Wheel",
    description: 'Start with a random Rare relic. Could be amazing... or terrible.',
    riskLevel: 'gamble',
    apply: 'random_relic',
  },
  {
    label: 'Chaos Deck',
    description: 'Replace your entire starter deck with random cards.',
    riskLevel: 'gamble',
    apply: 'transform_deck',
  },
  {
    label: 'All or Nothing',
    description: 'Gain a Rare card and 30 gold, but lose 8 max HP.',
    riskLevel: 'gamble',
    apply: 'rare_card_lose_max_hp',
    value: 8,
  },
]

export function generateRunStartOptions(rng: SeededRNG): RunStartOption[] {
  const safe1 = rng.pick(SAFE_OPTIONS)
  const safe2Candidates = SAFE_OPTIONS.filter((o) => o.apply !== safe1.apply)
  const safe2 = rng.pick(safe2Candidates)
  const moderate = rng.pick(MODERATE_OPTIONS)
  const gamble = rng.pick(GAMBLE_OPTIONS)

  return [
    { ...safe1, id: 'option_1' },
    { ...safe2, id: 'option_2' },
    { ...moderate, id: 'option_3' },
    { ...gamble, id: 'option_4' },
  ]
}

export function applyGambleOption(run: RunState, option: RunStartOption, rng: SeededRNG): RunState {
  const updatedRun = { ...run }

  switch (option.apply) {
    case 'gold':
      updatedRun.gold += option.value ?? 50
      updatedRun.stats = { ...updatedRun.stats, goldEarned: updatedRun.stats.goldEarned + (option.value ?? 50) }
      break
    case 'remove_starter': {
      const starters = updatedRun.deck.filter((c) => c.id.includes('starter'))
      if (starters.length > 0) {
        const toRemove = rng.pick(starters)
        updatedRun.deck = removeCardFromDeck(updatedRun.deck, toRemove.id)
      }
      break
    }
    case 'max_hp':
      updatedRun.maxHp += option.value ?? 3
      updatedRun.hp += option.value ?? 3
      break
    case 'add_card': {
      const commons = getAllCards().filter((c) => c.rarity === 'common' && !c.id.includes('starter'))
      if (commons.length > 0) {
        updatedRun.deck = [...updatedRun.deck, rng.pick(commons)]
      }
      break
    }
    case 'uncommon_card_lose_hp': {
      const uncommons = getAllCards().filter((c) => c.rarity === 'uncommon')
      if (uncommons.length > 0) {
        updatedRun.deck = [...updatedRun.deck, rng.pick(uncommons)]
      }
      updatedRun.hp = Math.max(1, updatedRun.hp - (option.value ?? 5))
      break
    }
    case 'gold_and_curse':
      updatedRun.gold += option.value ?? 40
      updatedRun.stats = { ...updatedRun.stats, goldEarned: updatedRun.stats.goldEarned + (option.value ?? 40) }
      break
    case 'random_gear': {
      const gear = getAllGear()
      if (gear.length > 0) {
        const picked = rng.pick(gear)
        const equipped = equipGear(updatedRun.equippedGear, [...updatedRun.gearInventory, picked], picked)
        updatedRun.gearInventory = equipped.gearInventory
        updatedRun.equippedGear = equipped.equippedGear
      }
      break
    }
    case 'random_relic': {
      const relic = generateRelicReward(rng)
      updatedRun.relics = [...updatedRun.relics, relic]
      break
    }
    case 'transform_deck': {
      const allCards = getAllCards().filter((c) => !c.id.includes('starter'))
      const newDeck: Card[] = []
      for (let idx = 0; idx < updatedRun.deck.length; idx++) {
        if (allCards.length > 0) {
          newDeck.push(rng.pick(allCards))
        }
      }
      updatedRun.deck = newDeck
      break
    }
    case 'rare_card_lose_max_hp': {
      const rares = getAllCards().filter((c) => c.rarity === 'rare')
      if (rares.length > 0) {
        updatedRun.deck = [...updatedRun.deck, rng.pick(rares)]
      }
      updatedRun.gold += 30
      updatedRun.maxHp = Math.max(1, updatedRun.maxHp - (option.value ?? 8))
      updatedRun.hp = Math.min(updatedRun.hp, updatedRun.maxHp)
      break
    }
  }

  return updatedRun
}
