import { create } from 'zustand'
import type { RunState, RunStartOption } from '@engine/types/run.ts'
import type { Card, GearCard } from '@engine/types/card.ts'
import type { MapNode } from '@engine/types/map.ts'
import type { EventDefinition } from '@engine/types/event.ts'
import type { ShopInventory } from '@engine/rewards/shopGenerator.ts'
import type { EventResult } from '@engine/events/eventEngine.ts'
import { getHeroById, getStarterDeck, getAllCards, getAllGear } from '@data/dataLoader.ts'
import { generateMap, navigateToNode } from '@engine/map/mapGenerator.ts'
import { generateRelicReward, calculateRerollCost } from '@engine/rewards/rewardGenerator.ts'
import { generateShop, buyCard, buyGear, buyCardRemoval } from '@engine/rewards/shopGenerator.ts'
import { selectEvent, resolveChoice } from '@engine/events/eventEngine.ts'
import { generateRunStartOptions } from '@engine/run/runStartGamble.ts'
import { removeCardFromDeck, upgradeCard } from '@engine/cards/deckManager.ts'
import { SeededRNG } from '../utils/random.ts'
import { saveActiveRun, loadActiveRun, clearActiveRun, saveRunHistory } from '../db/database.ts'
import type { RunHistoryEntry } from '@engine/types/run.ts'

interface GameStore {
  run: RunState | null
  shop: ShopInventory | null
  currentEvent: EventDefinition | null
  runStartOptions: RunStartOption[] | null
  visitedEventIds: string[]
  shopRerollCount: number

  // Navigation
  startNewRun: () => void
  selectHero: (heroId: string) => void
  generateGambleOptions: () => void
  selectGambleOption: (option: RunStartOption) => void
  navigateToMapNode: (node: MapNode) => void
  returnToMap: () => void

  // Combat integration
  onCombatEnd: (result: 'victory' | 'defeat', combatHp?: number, combatTurns?: number) => void

  // Rewards
  selectRewardCard: (card: Card) => void
  skipRewardCards: () => void
  rerollRewards: () => void
  takeGear: (gear: GearCard) => void
  skipGear: () => void
  continueFromReward: () => void

  // Shop
  shopBuyCard: (index: number) => void
  shopBuyGear: (index: number) => void
  shopRemoveCard: (cardId: string) => void
  shopReroll: () => void
  leaveShop: () => void

  // Rest
  restHeal: () => void
  restUpgrade: (cardId: string) => void
  restRemove: (cardId: string) => void

  // Events
  eventChoose: (choiceIndex: number) => EventResult
  eventContinue: () => void

  // End
  endRun: (result: 'victory' | 'defeat') => void
  goToMainMenu: () => void

  // Persistence
  autoSave: () => void
  loadSavedRun: () => Promise<boolean>
  hasSavedRun: boolean

  // Helpers
  getRng: (context: string) => SeededRNG
}

function createEmptyRun(seed: string): RunState {
  return {
    seed,
    phase: 'hero_select',
    hero: null,
    hp: 0,
    maxHp: 0,
    gold: 0,
    deck: [],
    gearInventory: [],
    equippedGear: [],
    relics: [],
    map: null,
    currentNodeId: null,
    combat: null,
    turnNumber: 0,
    rarityOffset: -5,
    cardRemovalCount: 0,
    rerollCount: 0,
    stats: {
      turnsPlayed: 0,
      damageDealt: 0,
      damageReceived: 0,
      cardsPlayed: 0,
      goldEarned: 0,
      goldSpent: 0,
      enemiesKilled: 0,
      nodesVisited: 0,
    },
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  run: null,
  shop: null,
  currentEvent: null,
  runStartOptions: null,
  visitedEventIds: [],
  shopRerollCount: 0,
  hasSavedRun: false,

  startNewRun: () => {
    const seed = 'run-' + Date.now() + '-' + Math.floor(Math.random() * 10000)
    set({
      run: createEmptyRun(seed),
      shop: null,
      currentEvent: null,
      runStartOptions: null,
      visitedEventIds: [],
      shopRerollCount: 0,
    })
  },

  selectHero: (heroId: string) => {
    const { run } = get()
    if (!run) return
    const hero = getHeroById(heroId)
    if (!hero) return
    const deck = getStarterDeck(heroId)

    set({
      run: {
        ...run,
        hero,
        hp: hero.startingHp,
        maxHp: hero.startingHp,
        deck,
        phase: 'run_start_gamble',
      },
    })
  },

  generateGambleOptions: () => {
    const { run } = get()
    if (!run) return
    const rng = get().getRng('gamble')
    set({ runStartOptions: generateRunStartOptions(rng) })
  },

  selectGambleOption: (option: RunStartOption) => {
    const { run } = get()
    if (!run || !run.hero) return
    const rng = get().getRng('gamble_apply')
    let updatedRun = { ...run }

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
        // Curse: for MVP, just a minor penalty acknowledged
        break
      case 'random_gear': {
        const gear = getAllGear()
        if (gear.length > 0) {
          const picked = rng.pick(gear)
          updatedRun.gearInventory = [...updatedRun.gearInventory, picked]
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
        for (let i = 0; i < updatedRun.deck.length; i++) {
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

    // Generate map and transition
    const map = generateMap(run.seed)
    updatedRun.map = map
    updatedRun.currentNodeId = 'start'
    updatedRun.phase = 'map'

    set({ run: updatedRun, runStartOptions: null })
  },

  navigateToMapNode: (node: MapNode) => {
    const { run } = get()
    if (!run || !run.map) return

    const newMap = navigateToNode(run.map, node.id)
    if (!newMap) return

    const updatedRun: RunState = {
      ...run,
      map: newMap,
      currentNodeId: node.id,
      stats: { ...run.stats, nodesVisited: run.stats.nodesVisited + 1 },
    }

    // Determine phase based on node type
    switch (node.type) {
      case 'combat':
      case 'elite':
        updatedRun.phase = 'combat'
        break
      case 'boss':
        updatedRun.phase = 'boss'
        break
      case 'shop':
        updatedRun.phase = 'shop'
        break
      case 'rest':
        updatedRun.phase = 'rest'
        break
      case 'event':
        updatedRun.phase = 'event'
        break
      default:
        updatedRun.phase = 'map'
    }

    set({ run: updatedRun })

    // Set up shop if needed
    if (node.type === 'shop' && run.hero) {
      const rng = get().getRng('shop_' + node.id)
      const shop = generateShop(run.hero.faction, run.cardRemovalCount, get().shopRerollCount, rng)
      set({ shop })
    }

    // Set up event if needed
    if (node.type === 'event') {
      const rng = get().getRng('event_' + node.id)
      const event = selectEvent(rng, get().visitedEventIds)
      set({
        currentEvent: event,
        visitedEventIds: [...get().visitedEventIds, event.id],
      })
    }
  },

  returnToMap: () => {
    const { run } = get()
    if (!run) return
    set({ run: { ...run, phase: 'map' }, shop: null, currentEvent: null })
    // Auto-save when returning to map
    get().autoSave()
  },

  onCombatEnd: (result: 'victory' | 'defeat', combatHp?: number, combatTurns?: number) => {
    const { run } = get()
    if (!run) return

    // Sync HP and stats back from combat
    const updatedRun = {
      ...run,
      hp: combatHp ?? run.hp,
      stats: {
        ...run.stats,
        turnsPlayed: run.stats.turnsPlayed + (combatTurns ?? 0),
      },
    }

    if (result === 'defeat') {
      set({ run: { ...updatedRun, phase: 'defeat' } })
      return
    }

    // Victory — check if it was boss
    const currentNode = run.map?.nodes.find((n) => n.id === run.currentNodeId)
    if (currentNode?.type === 'boss') {
      set({ run: { ...updatedRun, phase: 'victory' } })
      return
    }

    // Regular combat/elite victory — go to reward
    set({ run: { ...updatedRun, phase: 'reward' } })
  },

  selectRewardCard: (card: Card) => {
    const { run } = get()
    if (!run) return
    set({ run: { ...run, deck: [...run.deck, card] } })
  },

  skipRewardCards: () => {
    // No state change needed
  },

  rerollRewards: () => {
    const { run } = get()
    if (!run || !run.hero) return
    const cost = calculateRerollCost(run.rerollCount)
    if (run.gold < cost) return

    set({
      run: {
        ...run,
        gold: run.gold - cost,
        rerollCount: run.rerollCount + 1,
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + cost },
      },
    })
  },

  takeGear: (gear: GearCard) => {
    const { run } = get()
    if (!run) return
    set({ run: { ...run, gearInventory: [...run.gearInventory, gear] } })
  },

  skipGear: () => {
    // No state change needed
  },

  continueFromReward: () => {
    get().returnToMap()
  },

  shopBuyCard: (index: number) => {
    const { run, shop } = get()
    if (!run || !shop) return
    const result = buyCard(shop, index, run.gold)
    if (!result) return
    set({
      run: {
        ...run,
        gold: result.newGold,
        deck: [...run.deck, result.card],
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + (run.gold - result.newGold) },
      },
      shop: result.shop,
    })
  },

  shopBuyGear: (index: number) => {
    const { run, shop } = get()
    if (!run || !shop) return
    const result = buyGear(shop, index, run.gold)
    if (!result) return
    set({
      run: {
        ...run,
        gold: result.newGold,
        gearInventory: [...run.gearInventory, result.gear],
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + (run.gold - result.newGold) },
      },
      shop: result.shop,
    })
  },

  shopRemoveCard: (cardId: string) => {
    const { run, shop } = get()
    if (!run || !shop) return
    const result = buyCardRemoval(shop, run.gold)
    if (!result) return
    set({
      run: {
        ...run,
        gold: result.newGold,
        deck: removeCardFromDeck(run.deck, cardId),
        cardRemovalCount: run.cardRemovalCount + 1,
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + (run.gold - result.newGold) },
      },
      shop: { ...shop, cardRemovalCost: result.newCardRemovalCost },
    })
  },

  shopReroll: () => {
    const { run, shop } = get()
    if (!run || !shop || !run.hero || run.gold < shop.rerollCost) return

    const newShopRerollCount = get().shopRerollCount + 1
    const cost = shop.rerollCost
    const rng = get().getRng('shop_reroll_' + newShopRerollCount)
    const newShop = generateShop(run.hero.faction, run.cardRemovalCount, newShopRerollCount, rng)

    set({
      run: {
        ...run,
        gold: run.gold - cost,
        stats: { ...run.stats, goldSpent: run.stats.goldSpent + cost },
      },
      shop: newShop,
      shopRerollCount: newShopRerollCount,
    })
  },

  leaveShop: () => {
    get().returnToMap()
  },

  restHeal: () => {
    const { run } = get()
    if (!run) return
    const healAmount = Math.floor(run.maxHp * 0.3)
    const newHp = Math.min(run.hp + healAmount, run.maxHp)
    set({ run: { ...run, hp: newHp } })
  },

  restUpgrade: (cardId: string) => {
    const { run } = get()
    if (!run) return
    const newDeck = upgradeCard(run.deck, cardId)
    set({ run: { ...run, deck: newDeck } })
  },

  restRemove: (cardId: string) => {
    const { run } = get()
    if (!run) return
    set({ run: { ...run, deck: removeCardFromDeck(run.deck, cardId) } })
  },

  eventChoose: (choiceIndex: number): EventResult => {
    const { run, currentEvent } = get()
    if (!run || !currentEvent || !run.hero) {
      return {
        hpDelta: 0, maxHpDelta: 0, goldDelta: 0,
        addedCards: [], addedGear: [],
        addCurse: false, extraEnemy: false, revealMap: false, skipNode: false,
        outcomeDescription: 'Error',
      }
    }
    const rng = get().getRng('event_choice')
    const result = resolveChoice(currentEvent, choiceIndex, run.hero.faction, rng)

    // Apply effects to run state
    const newHp = Math.max(1, Math.min(run.hp + result.hpDelta, run.maxHp + result.maxHpDelta))
    const newMaxHp = Math.max(1, run.maxHp + result.maxHpDelta)
    const newGold = Math.max(0, run.gold + result.goldDelta)

    set({
      run: {
        ...run,
        hp: newHp,
        maxHp: newMaxHp,
        gold: newGold,
        deck: [...run.deck, ...result.addedCards],
        gearInventory: [...run.gearInventory, ...result.addedGear],
        stats: {
          ...run.stats,
          goldEarned: run.stats.goldEarned + Math.max(0, result.goldDelta),
          goldSpent: run.stats.goldSpent + Math.max(0, -result.goldDelta),
        },
      },
    })

    return result
  },

  eventContinue: () => {
    get().returnToMap()
  },

  endRun: (result: 'victory' | 'defeat') => {
    const { run } = get()
    if (!run) return

    // Save to run history
    const entry: RunHistoryEntry = {
      id: run.seed + '_' + Date.now(),
      timestamp: Date.now(),
      seed: run.seed,
      heroId: run.hero?.id ?? 'unknown',
      result,
      stats: run.stats,
      finalDeck: run.deck.map((c) => c.id),
      finalGear: run.gearInventory.map((g) => g.id),
      nodesVisited: run.stats.nodesVisited,
    }
    saveRunHistory(entry).catch(() => {})
    clearActiveRun().catch(() => {})
  },

  goToMainMenu: () => {
    const { run } = get()
    // If run ended (victory/defeat), clear save
    if (run && (run.phase === 'victory' || run.phase === 'defeat')) {
      get().endRun(run.phase === 'victory' ? 'victory' : 'defeat')
    }
    set({
      run: null,
      shop: null,
      currentEvent: null,
      runStartOptions: null,
      visitedEventIds: [],
      shopRerollCount: 0,
      hasSavedRun: false,
    })
  },

  autoSave: () => {
    const { run } = get()
    if (!run) return
    const json = JSON.stringify(run)
    saveActiveRun(json).catch(() => {})
  },

  loadSavedRun: async (): Promise<boolean> => {
    const json = await loadActiveRun()
    if (!json) return false
    try {
      const run = JSON.parse(json) as RunState
      set({ run, hasSavedRun: false })
      return true
    } catch {
      return false
    }
  },

  getRng: (context: string): SeededRNG => {
    const { run } = get()
    const seed = run?.seed ?? 'fallback'
    return new SeededRNG(seed + '_' + context)
  },
}))

// Check for saved run on module load
loadActiveRun().then((data) => {
  if (data) {
    useGameStore.setState({ hasSavedRun: true })
  }
}).catch(() => {})
