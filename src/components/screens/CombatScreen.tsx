import { useEffect, useState } from 'react'
import { useCombatStore } from '@stores/combatStore.ts'
import EnemyDisplay from '../combat/EnemyDisplay.tsx'
import AllyBoard from '../combat/AllyBoard.tsx'
import HeroHUD from '../combat/HeroHUD.tsx'
import CardHand from '../cards/CardHand.tsx'
import DeckViewer from '../combat/DeckViewer.tsx'

interface CombatScreenProps {
  onCombatEnd: (result: 'victory' | 'defeat') => void
}

export default function CombatScreen({ onCombatEnd }: CombatScreenProps) {
  const combat = useCombatStore((s) => s.combat)
  const beginTurn = useCombatStore((s) => s.beginTurn)
  const endTurn = useCombatStore((s) => s.endTurn)
  const targetingMode = useCombatStore((s) => s.targetingMode)
  const [showDeck, setShowDeck] = useState(false)
  const [combatEnded, setCombatEnded] = useState(false)

  // Start first turn
  useEffect(() => {
    if (combat && combat.turn === 0 && combat.result === 'ongoing') {
      beginTurn()
    }
  }, [combat?.turn])

  // Start next turn after enemy phase
  useEffect(() => {
    if (combat && combat.phase === 'turn_end' && combat.result === 'ongoing') {
      const timer = setTimeout(() => {
        beginTurn()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [combat?.phase])

  // Handle combat end
  useEffect(() => {
    if (combat && combat.result !== 'ongoing' && !combatEnded) {
      setCombatEnded(true)
      const timer = setTimeout(() => {
        onCombatEnd(combat.result as 'victory' | 'defeat')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [combat?.result])

  if (!combat) return null

  const allCards = [...combat.drawPile, ...combat.hand, ...combat.discardPile]

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Targeting mode indicator */}
      {targetingMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-red-900/80 text-red-200 px-4 py-1 rounded-full text-sm border border-red-700">
          Select a target — <button onClick={() => useCombatStore.getState().cancelTargeting()} className="underline">Cancel</button>
        </div>
      )}

      {/* Turn / Phase info */}
      <div className="flex justify-between items-center px-4 py-2 text-xs text-slate-500">
        <span>Turn {combat.turn}</span>
        <span className="capitalize">{combat.phase.replace('_', ' ')}</span>
      </div>

      {/* Enemy area */}
      <div className="flex-shrink-0">
        <EnemyDisplay />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700/50 mx-8" />

      {/* Ally area */}
      <div className="flex-shrink-0">
        <AllyBoard />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Hero HUD */}
      <div className="flex-shrink-0 px-4 mb-2">
        <HeroHUD />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-2">
        <button
          onClick={() => setShowDeck(true)}
          className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-xs hover:bg-slate-600 transition-colors"
        >
          View Deck
        </button>
        <button
          onClick={endTurn}
          disabled={combat.phase !== 'player_action' || combat.result !== 'ongoing'}
          className={`
            px-6 py-2 rounded-lg font-bold text-sm transition-all
            ${combat.phase === 'player_action' && combat.result === 'ongoing'
              ? 'bg-amber-600 text-white hover:bg-amber-500 cursor-pointer'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
          `}
        >
          End Turn
        </button>
      </div>

      {/* Hand */}
      <div className="flex-shrink-0 bg-slate-900/80 border-t border-slate-700">
        <CardHand />
      </div>

      {/* Victory / Defeat overlay */}
      {combat.result !== 'ongoing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className={`text-6xl font-bold ${combat.result === 'victory' ? 'text-amber-400' : 'text-red-500'}`}>
            {combat.result === 'victory' ? 'VICTORY!' : 'DEFEAT'}
          </div>
        </div>
      )}

      {/* Deck viewer modal */}
      {showDeck && (
        <DeckViewer
          cards={allCards}
          title="Your Deck"
          onClose={() => setShowDeck(false)}
        />
      )}
    </div>
  )
}
