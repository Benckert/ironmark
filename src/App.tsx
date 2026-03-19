import { useState } from 'react'
import CombatScreen from '@components/screens/CombatScreen.tsx'
import { useCombatStore } from '@stores/combatStore.ts'
import { getHeroById, getStarterDeck } from '@data/dataLoader.ts'
import { getEnemyById } from '@data/dataLoader.ts'
import type { RunState } from '@engine/types/run.ts'
import type { EnemyTemplate } from '@engine/types/enemy.ts'

type AppScreen = 'menu' | 'combat' | 'result'

function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')
  const [result, setResult] = useState<'victory' | 'defeat' | null>(null)
  const initCombat = useCombatStore((s) => s.initCombat)
  const reset = useCombatStore((s) => s.reset)

  const startTestCombat = () => {
    const hero = getHeroById('hero_kael')!
    const deck = getStarterDeck('hero_kael')

    const runState: RunState = {
      seed: 'test-run-' + Date.now(),
      phase: 'combat',
      hero,
      hp: hero.startingHp,
      maxHp: hero.startingHp,
      gold: 0,
      deck,
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

    const enemies: EnemyTemplate[] = [
      getEnemyById('enemy_goblin_scout')!,
      getEnemyById('enemy_forest_spider')!,
    ]

    initCombat(runState, enemies, runState.seed)
    setScreen('combat')
  }

  const handleCombatEnd = (combatResult: 'victory' | 'defeat') => {
    setResult(combatResult)
    setScreen('result')
  }

  const handleReturnToMenu = () => {
    reset()
    setResult(null)
    setScreen('menu')
  }

  if (screen === 'combat') {
    return <CombatScreen onCombatEnd={handleCombatEnd} />
  }

  if (screen === 'result') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <h1 className={`text-5xl font-bold mb-4 ${result === 'victory' ? 'text-amber-400' : 'text-red-500'}`}>
            {result === 'victory' ? 'VICTORY!' : 'DEFEAT'}
          </h1>
          <button
            onClick={handleReturnToMenu}
            className="mt-8 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Return to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-amber-400 mb-4">IRONMARK</h1>
        <p className="text-slate-400 text-lg mb-8">A roguelite deckbuilder</p>
        <button
          onClick={startTestCombat}
          className="px-8 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors text-lg"
        >
          Start Test Combat
        </button>
      </div>
    </div>
  )
}

export default App
