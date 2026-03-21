import { create } from 'zustand'
import type { RunState, RunStartOption } from '@engine/types/run.ts'
import type { Card, GearCard } from '@engine/types/card.ts'
import type { MapNode } from '@engine/types/map.ts'
import type { EventDefinition } from '@engine/types/event.ts'
import type { ShopInventory } from '@engine/rewards/shopGenerator.ts'
import type { EventResult } from '@engine/events/eventEngine.ts'
import { getHeroById, getStarterDeck } from '@data/dataLoader.ts'
import { generateMap, navigateToNode } from '@engine/map/mapGenerator.ts'
import { generateShop } from '@engine/rewards/shopGenerator.ts'
import { selectEvent } from '@engine/events/eventEngine.ts'
import { generateRunStartOptions, applyGambleOption } from '@engine/run/runStartGamble.ts'
import { SeededRNG } from '../utils/random.ts'
import { saveActiveRun, loadActiveRun, clearActiveRun, saveRunHistory } from '../db/database.ts'
import type { RunHistoryEntry } from '@engine/types/run.ts'
import {
  createRewardActions,
  createShopActions,
  createRestActions,
  createEventActions,
} from './nodeActions.ts'

interface GameStore {
  run: RunState | null
  shop: ShopInventory | null
  currentEvent: EventDefinition | null
  runStartOptions: RunStartOption[] | null
  visitedEventIds: string[]
  shopRerollCount: number

  startNewRun: () => void
  selectHero: (heroId: string) => void
  generateGambleOptions: () => void
  selectGambleOption: (option: RunStartOption) => void
  navigateToMapNode: (node: MapNode) => void
  returnToMap: () => void

  onCombatEnd: (result: 'victory' | 'defeat', finalHp?: number, combatStats?: { turnsPlayed: number; damageDealt: number; damageReceived: number; cardsPlayed: number; enemiesKilled: number }) => void

  selectRewardCard: (card: Card) => void
  skipRewardCards: () => void
  rerollRewards: () => void
  takeGear: (gear: GearCard) => void
  skipGear: () => void
  continueFromReward: () => void

  shopBuyCard: (index: number) => void
  shopBuyGear: (index: number) => void
  shopRemoveCard: (cardId: string) => void
  shopReroll: () => void
  leaveShop: () => void

  restHeal: () => void
  restUpgrade: (cardId: string) => void
  restRemove: (cardId: string) => void

  eventChoose: (choiceIndex: number) => EventResult
  eventContinue: () => void

  advanceStage: () => void
  endRun: (result: 'victory' | 'defeat') => void
  goToMainMenu: () => void

  autoSave: () => void
  loadSavedRun: () => Promise<boolean>
  hasSavedRun: boolean

  getRng: (context: string) => SeededRNG
}

function createEmptyRun(seed: string): RunState {
  return {
    seed,
    phase: 'hero_select',
    stage: 1,
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

export const useGameStore = create<GameStore>((set, get) => {
  const accessors = {
    getRun: () => get().run,
    getShop: () => get().shop,
    getCurrentEvent: () => get().currentEvent,
    getShopRerollCount: () => get().shopRerollCount,
    setRun: (run: RunState) => set({ run }),
    setShop: (shop: ShopInventory | null) => set({ shop }),
    setShopRerollCount: (count: number) => set({ shopRerollCount: count }),
    getRng: (context: string) => {
      const run = get().run
      const seed = run?.seed ?? 'fallback'
      return new SeededRNG(seed + '_' + context)
    },
    returnToMap: () => {
      const run = get().run
      if (!run) return
      set({ run: { ...run, phase: 'map' }, shop: null, currentEvent: null })
      get().autoSave()
    },
  }

  const rewardActions = createRewardActions(accessors)
  const shopActions = createShopActions(accessors)
  const restActions = createRestActions(accessors)
  const eventActions = createEventActions(accessors)

  return {
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
      const rng = accessors.getRng('gamble')
      set({ runStartOptions: generateRunStartOptions(rng) })
    },

    selectGambleOption: (option: RunStartOption) => {
      const { run } = get()
      if (!run || !run.hero) return
      const rng = accessors.getRng('gamble_apply')
      const updatedRun = applyGambleOption({ ...run }, option, rng)

      const map = generateMap(run.seed, run.stage)
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

      if (node.type === 'shop' && run.hero) {
        const rng = accessors.getRng('shop_' + node.id)
        const shop = generateShop(run.hero.faction, run.cardRemovalCount, get().shopRerollCount, rng)
        set({ shop })
      }

      if (node.type === 'event') {
        const rng = accessors.getRng('event_' + node.id)
        const event = selectEvent(rng, get().visitedEventIds, run.stage)
        set({
          currentEvent: event,
          visitedEventIds: [...get().visitedEventIds, event.id],
        })
      }
    },

    returnToMap: accessors.returnToMap,

    onCombatEnd: (result, finalHp, combatStats) => {
      const { run } = get()
      if (!run) return

      const updatedRun: RunState = {
        ...run,
        hp: finalHp ?? run.hp,
        stats: combatStats ? {
          ...run.stats,
          turnsPlayed: run.stats.turnsPlayed + combatStats.turnsPlayed,
          damageDealt: run.stats.damageDealt + combatStats.damageDealt,
          damageReceived: run.stats.damageReceived + combatStats.damageReceived,
          cardsPlayed: run.stats.cardsPlayed + combatStats.cardsPlayed,
          enemiesKilled: run.stats.enemiesKilled + combatStats.enemiesKilled,
        } : run.stats,
      }

      if (result === 'defeat') {
        set({ run: { ...updatedRun, phase: 'defeat' } })
        return
      }

      const currentNode = run.map?.nodes.find((n) => n.id === run.currentNodeId)
      if (currentNode?.type === 'boss') {
        if (run.stage < 3) {
          // Advance to next stage
          set({ run: { ...updatedRun, phase: 'stage_transition' } })
        } else {
          set({ run: { ...updatedRun, phase: 'victory' } })
        }
        return
      }

      set({ run: { ...updatedRun, phase: 'reward' } })
    },

    ...rewardActions,
    ...shopActions,
    ...restActions,
    ...eventActions,

    advanceStage: () => {
      const { run } = get()
      if (!run || run.stage >= 3) return

      const nextStage = run.stage + 1
      const map = generateMap(run.seed, nextStage)
      set({
        run: {
          ...run,
          stage: nextStage,
          map,
          currentNodeId: 'start',
          phase: 'map',
        },
        shop: null,
        currentEvent: null,
        visitedEventIds: [],
        shopRerollCount: 0,
      })
      get().autoSave()
    },

    endRun: (result: 'victory' | 'defeat') => {
      const { run } = get()
      if (!run) return

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

    getRng: accessors.getRng,
  }
})

// Check for saved run on module load
loadActiveRun().then((data) => {
  if (data) {
    useGameStore.setState({ hasSavedRun: true })
  }
}).catch(() => {})
