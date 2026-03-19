import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@stores/gameStore.ts'
import { useCombatStore } from '@stores/combatStore.ts'
import { buildEncounter } from '@engine/encounters/encounterBuilder.ts'
import { getAllBosses } from '@data/dataLoader.ts'
import { generateCardRewards, generateGoldReward, generateGearReward, calculateRerollCost, canAffordReroll } from '@engine/rewards/rewardGenerator.ts'
import { SeededRNG } from './utils/random.ts'
import MainMenu from '@components/screens/MainMenu.tsx'
import HeroSelect from '@components/screens/HeroSelect.tsx'
import RunStartGamble from '@components/screens/RunStartGamble.tsx'
import MapScreen from '@components/screens/MapScreen.tsx'
import CombatScreen from '@components/screens/CombatScreen.tsx'
import RewardScreen from '@components/screens/RewardScreen.tsx'
import ShopScreen from '@components/screens/ShopScreen.tsx'
import RestScreen from '@components/screens/RestScreen.tsx'
import EventScreen from '@components/screens/EventScreen.tsx'
import VictoryScreen from '@components/screens/VictoryScreen.tsx'
import DefeatScreen from '@components/screens/DefeatScreen.tsx'
import type { Card, GearCard } from '@engine/types/card.ts'
import type { EnemyTemplate } from '@engine/types/enemy.ts'
import { useState } from 'react'

function App() {
  const run = useGameStore((s) => s.run)
  const shop = useGameStore((s) => s.shop)
  const currentEvent = useGameStore((s) => s.currentEvent)
  const runStartOptions = useGameStore((s) => s.runStartOptions)

  const startNewRun = useGameStore((s) => s.startNewRun)
  const selectHero = useGameStore((s) => s.selectHero)
  const generateGambleOptions = useGameStore((s) => s.generateGambleOptions)
  const selectGambleOption = useGameStore((s) => s.selectGambleOption)
  const navigateToMapNode = useGameStore((s) => s.navigateToMapNode)
  const onCombatEnd = useGameStore((s) => s.onCombatEnd)
  const goToMainMenu = useGameStore((s) => s.goToMainMenu)

  const initCombat = useCombatStore((s) => s.initCombat)

  const phase = run?.phase ?? 'main_menu'

  // Generate gamble options when entering that phase
  useEffect(() => {
    if (phase === 'run_start_gamble' && !runStartOptions) {
      generateGambleOptions()
    }
  }, [phase, runStartOptions])

  // Initialize combat when entering combat/boss phase
  useEffect(() => {
    if (!run || !run.map || !run.hero) return
    if (phase !== 'combat' && phase !== 'boss') return

    const currentNode = run.map.nodes.find((n) => n.id === run.currentNodeId)
    if (!currentNode) return

    let enemies: EnemyTemplate[]
    if (phase === 'boss') {
      const bosses = getAllBosses()
      enemies = bosses.length > 0 ? [bosses[0]] : []
    } else {
      const rng = new SeededRNG(run.seed + '_encounter_' + run.currentNodeId)
      enemies = buildEncounter(currentNode.row, currentNode.type, rng)
    }

    if (enemies.length > 0) {
      initCombat(run, enemies, run.seed + '_combat_' + run.currentNodeId)
    }
  }, [phase, run?.currentNodeId])

  const hasSavedRun = useGameStore((s) => s.hasSavedRun)
  const loadSavedRun = useGameStore((s) => s.loadSavedRun)

  const screenContent = (() => {
    if (phase === 'main_menu' || !run) {
      return (
        <MainMenu
          onNewRun={() => { startNewRun() }}
          onContinue={() => { loadSavedRun() }}
          hasSavedRun={hasSavedRun}
        />
      )
    }
    if (phase === 'hero_select') return <HeroSelect onSelect={selectHero} />
    if (phase === 'run_start_gamble') {
      if (!runStartOptions) return null
      return <RunStartGamble options={runStartOptions} onSelect={selectGambleOption} />
    }
    if (phase === 'map') {
      if (!run.map) return null
      return (
        <MapScreen
          map={run.map}
          playerHp={run.hp}
          playerMaxHp={run.maxHp}
          gold={run.gold}
          deckSize={run.deck.length}
          onSelectNode={navigateToMapNode}
        />
      )
    }
    if (phase === 'combat' || phase === 'boss') return <CombatScreen onCombatEnd={onCombatEnd} />
    if (phase === 'reward') return <RewardScreenWrapper />
    if (phase === 'shop') {
      if (!shop) return null
      return (
        <ShopScreen
          shop={shop}
          gold={run.gold}
          deck={run.deck}
          canAffordRemoval={run.gold >= shop.cardRemovalCost}
          onBuyCard={useGameStore.getState().shopBuyCard}
          onBuyGear={useGameStore.getState().shopBuyGear}
          onRemoveCard={useGameStore.getState().shopRemoveCard}
          onRerollShop={useGameStore.getState().shopReroll}
          onLeave={useGameStore.getState().leaveShop}
        />
      )
    }
    if (phase === 'rest') {
      return (
        <RestScreen
          hp={run.hp}
          maxHp={run.maxHp}
          healAmount={Math.floor(run.maxHp * 0.3)}
          deck={run.deck}
          onHeal={useGameStore.getState().restHeal}
          onUpgrade={useGameStore.getState().restUpgrade}
          onRemove={useGameStore.getState().restRemove}
          onContinue={useGameStore.getState().returnToMap}
        />
      )
    }
    if (phase === 'event') {
      if (!currentEvent) return null
      return (
        <EventScreen
          event={currentEvent}
          onChoose={useGameStore.getState().eventChoose}
          onContinue={useGameStore.getState().eventContinue}
        />
      )
    }
    if (phase === 'victory') {
      return (
        <VictoryScreen
          stats={run.stats}
          deckSize={run.deck.length}
          gearCount={run.gearInventory.length}
          onMainMenu={goToMainMenu}
        />
      )
    }
    if (phase === 'defeat') {
      return (
        <DefeatScreen
          stats={run.stats}
          nodesVisited={run.stats.nodesVisited}
          onMainMenu={goToMainMenu}
        />
      )
    }
    return null
  })()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {screenContent}
      </motion.div>
    </AnimatePresence>
  )
}

// Reward screen wrapper handles reward generation state
function RewardScreenWrapper() {
  const run = useGameStore((s) => s.run)!
  const selectRewardCard = useGameStore((s) => s.selectRewardCard)
  const skipRewardCards = useGameStore((s) => s.skipRewardCards)
  const takeGear = useGameStore((s) => s.takeGear)
  const skipGear = useGameStore((s) => s.skipGear)
  const continueFromReward = useGameStore((s) => s.continueFromReward)

  const currentNode = run.map?.nodes.find((n) => n.id === run.currentNodeId)
  const isElite = currentNode?.type === 'elite'

  const [rerollCount, setRerollCount] = useState(0)
  const [cardRewards, setCardRewards] = useState<{ cards: Card[]; goldEarned: number; gearChoice: GearCard | null }>(() => {
    const rng = new SeededRNG(run.seed + '_reward_' + run.currentNodeId)
    const nodeType = currentNode?.type ?? 'combat'
    const goldEarned = generateGoldReward(nodeType, rng)
    const { cards } = generateCardRewards(run.hero!.faction, run.rarityOffset, isElite, rng)
    const gearChoice = isElite ? generateGearReward(rng) : null
    return { cards, goldEarned, gearChoice }
  })

  // Apply gold on first render
  useEffect(() => {
    if (cardRewards.goldEarned > 0) {
      useGameStore.setState((state) => ({
        run: state.run ? {
          ...state.run,
          gold: state.run.gold + cardRewards.goldEarned,
          stats: { ...state.run.stats, goldEarned: state.run.stats.goldEarned + cardRewards.goldEarned },
        } : state.run,
      }))
    }
  }, [])

  const handleReroll = () => {
    const cost = calculateRerollCost(rerollCount)
    if (run.gold < cost) return

    useGameStore.setState((state) => ({
      run: state.run ? {
        ...state.run,
        gold: state.run.gold - cost,
        stats: { ...state.run.stats, goldSpent: state.run.stats.goldSpent + cost },
      } : state.run,
    }))

    const newRerollCount = rerollCount + 1
    setRerollCount(newRerollCount)
    const rng = new SeededRNG(run.seed + '_reward_reroll_' + newRerollCount)
    const { cards } = generateCardRewards(run.hero!.faction, run.rarityOffset, isElite, rng)
    setCardRewards((prev) => ({ ...prev, cards }))
  }

  const rerollCost = calculateRerollCost(rerollCount)

  return (
    <RewardScreen
      goldEarned={cardRewards.goldEarned}
      cardChoices={cardRewards.cards}
      gearChoice={cardRewards.gearChoice}
      currentGold={run.gold}
      rerollCount={rerollCount}
      onSelectCard={selectRewardCard}
      onSkipCards={skipRewardCards}
      onReroll={handleReroll}
      onTakeGear={takeGear}
      onSkipGear={skipGear}
      onContinue={continueFromReward}
      canAffordReroll={canAffordReroll(run.gold, rerollCount)}
      rerollCost={rerollCost}
    />
  )
}

export default App
