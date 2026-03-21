import { useEffect, useState, useRef, useCallback } from 'react'
import { useCombatStore } from '@stores/combatStore.ts'
import { extractCombatStats } from '@engine/combat/combatEngine.ts'
import EnemyDisplay from '../combat/EnemyDisplay.tsx'
import AllyBoard from '../combat/AllyBoard.tsx'
import HeroHUD from '../combat/HeroHUD.tsx'
import CardHand from '../cards/CardHand.tsx'
import DeckViewer from '../combat/DeckViewer.tsx'
import { DamagePopups, useDamagePopups } from '../combat/DamagePopup.tsx'

interface CombatScreenProps {
  onCombatEnd: (result: 'victory' | 'defeat', finalHp?: number, combatStats?: { turnsPlayed: number; damageDealt: number; damageReceived: number; cardsPlayed: number; enemiesKilled: number }) => void
}

export default function CombatScreen({ onCombatEnd }: CombatScreenProps) {
  const combat = useCombatStore((s) => s.combat)
  const beginTurn = useCombatStore((s) => s.beginTurn)
  const endTurn = useCombatStore((s) => s.endTurn)
  const targetingMode = useCombatStore((s) => s.targetingMode)
  const selectCard = useCombatStore((s) => s.selectCard)
  const allyTargetingMode = useCombatStore((s) => s.allyTargetingMode)
  const currentAllyTargetIndex = useCombatStore((s) => s.currentAllyTargetIndex)
  const [showDeck, setShowDeck] = useState(false)
  const [combatEnded, setCombatEnded] = useState(false)
  const initialEnemyCount = useRef(0)
  const { popups, addPopup } = useDamagePopups()
  const prevLogLength = useRef(0)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      selectCard(null)
    }
  }, [selectCard])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Show damage/heal popups when combat log changes
  useEffect(() => {
    if (!combat) return
    const newEntries = combat.log.slice(prevLogLength.current)
    prevLogLength.current = combat.log.length
    for (const entry of newEntries) {
      if (entry.value && entry.value > 0) {
        const isHeal = entry.description.includes('heal')
        // Position near center with some randomness
        const centerX = window.innerWidth / 2 + (Math.random() - 0.5) * 100
        const centerY = isHeal ? window.innerHeight * 0.6 : window.innerHeight * 0.25
        addPopup(entry.value, isHeal ? 'heal' : 'damage', centerX, centerY)
      }
    }
  }, [combat?.log.length])

  // Track initial enemy count when combat starts
  useEffect(() => {
    if (combat && combat.turn === 1) {
      initialEnemyCount.current = combat.enemies.length
    }
  }, [combat?.turn === 1])

  // Start next turn after enemy phase
  useEffect(() => {
    if (combat && combat.phase === 'turn_end' && combat.result === 'ongoing') {
      const timer = setTimeout(() => {
        beginTurn()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [combat?.phase])

  // Handle combat end — sync HP and stats back to run
  useEffect(() => {
    if (combat && combat.result !== 'ongoing' && !combatEnded) {
      setCombatEnded(true)
      const stats = extractCombatStats(combat, initialEnemyCount.current)
      const finalHp = combat.player.hp
      const timer = setTimeout(() => {
        onCombatEnd(combat.result as 'victory' | 'defeat', finalHp, stats)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [combat?.result])

  if (!combat) return null

  const allCards = [...combat.drawPile, ...combat.hand, ...combat.discardPile]

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" role="main" aria-label="Combat screen">
      {/* Aria-live region for combat announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Turn {combat.turn}, {combat.phase.replace('_', ' ')} phase.
        {combat.result !== 'ongoing' ? ` Combat result: ${combat.result}.` : ''}
        {targetingMode ? ' Select a target for your card.' : ''}
      </div>

      {/* Targeting mode indicator */}
      {targetingMode && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-red-900/80 text-red-200 px-4 py-1 rounded-full text-sm border border-red-700">
          Select a target — <button onClick={() => selectCard(null)} className="underline" aria-label="Cancel targeting">Cancel</button>
        </div>
      )}

      {/* Ally targeting mode indicator */}
      {allyTargetingMode && combat && (() => {
        const attackableAllies = combat.allies.filter((a) => a.currentHp > 0 && !a.hasAttackedThisTurn)
        const currentAlly = attackableAllies[currentAllyTargetIndex]
        return currentAlly ? (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-emerald-900/80 text-emerald-200 px-4 py-1 rounded-full text-sm border border-emerald-700">
            Choose target for <span className="font-bold">{currentAlly.card.name}</span> ({currentAllyTargetIndex + 1}/{attackableAllies.length})
          </div>
        ) : null
      })()}

      {/* Turn / Phase info */}
      <div className="flex justify-between items-center px-4 py-2 text-xs text-slate-500">
        <span>Turn {combat.turn}</span>
        <span className="capitalize">{combat.phase.replace('_', ' ')}</span>
      </div>

      {/* Combat board — vertical layout (Hearthstone-style) */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Enemy area (top) */}
        <div className="flex-1 bg-red-950/10 border-b border-red-900/20 flex flex-col justify-end">
          <div className="text-[10px] text-red-400/50 uppercase tracking-wider text-center pt-1">Enemies</div>
          <EnemyDisplay />
        </div>

        {/* Battle divider */}
        <div className="relative">
          <div className="border-t border-slate-600/30" />
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-3 text-[10px] text-slate-600 uppercase tracking-widest">
            vs
          </div>
        </div>

        {/* Ally area + Hero HUD (bottom half) */}
        <div className="flex-1 bg-emerald-950/10 border-t border-emerald-900/20 flex flex-col justify-start">
          <div className="text-[10px] text-emerald-400/50 uppercase tracking-wider text-center pt-1">Allies</div>
          <AllyBoard />
          <div className="mt-auto px-4 pb-2">
            <HeroHUD />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-2">
        <button
          onClick={() => setShowDeck(true)}
          aria-label="View deck"
          className="px-3 py-1 min-h-11 min-w-11 rounded bg-slate-700 text-slate-300 text-xs hover:bg-slate-600 transition-colors"
        >
          View Deck
        </button>
        <button
          onClick={endTurn}
          aria-label="End turn"
          disabled={combat.phase !== 'player_action' || combat.result !== 'ongoing'}
          className={`
            px-6 py-2 min-h-11 min-w-11 rounded-lg font-bold text-sm transition-all
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

      {/* Damage popups */}
      <DamagePopups popups={popups} />

      {/* Victory / Defeat overlay */}
      {combat.result !== 'ongoing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50" role="alert">
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
