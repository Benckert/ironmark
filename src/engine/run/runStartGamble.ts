import type { RunStartOption } from '@engine/types/run.ts'
import { SeededRNG } from '../../utils/random.ts'

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
