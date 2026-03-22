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

  // Handle combat end
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
    <div className="relative flex flex-col h-screen im-bg-combat" role="main" aria-label="Combat screen">
      {/* Vignette overlay */}
      <div className="absolute inset-0 im-vignette z-[1]" />

      {/* Aria-live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Turn {combat.turn}, {combat.phase.replace('_', ' ')} phase.
        {combat.result !== 'ongoing' ? ` Combat result: ${combat.result}.` : ''}
        {targetingMode ? ' Select a target for your card.' : ''}
      </div>

      {/* Targeting mode indicator */}
      {targetingMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-red-900/90 text-red-200 px-5 py-1.5 rounded-full text-sm border border-red-600/50 im-glow-red backdrop-blur-sm">
          Select a target — <button onClick={() => selectCard(null)} className="underline font-semibold" aria-label="Cancel targeting">Cancel</button>
        </div>
      )}

      {/* Ally targeting mode indicator */}
      {allyTargetingMode && combat && (() => {
        const attackableAllies = combat.allies.filter((a) => a.currentHp > 0 && !a.hasAttackedThisTurn)
        const currentAlly = attackableAllies[currentAllyTargetIndex]
        return currentAlly ? (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-emerald-900/90 text-emerald-200 px-5 py-1.5 rounded-full text-sm border border-emerald-600/50 im-glow-green backdrop-blur-sm">
            Choose target for <span className="font-bold">{currentAlly.card.name}</span> ({currentAllyTargetIndex + 1}/{attackableAllies.length})
          </div>
        ) : null
      })()}

      {/* Turn / Phase banner */}
      <div className="relative z-[2] flex justify-between items-center px-5 py-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-400/60 text-xs font-semibold uppercase tracking-wider">Turn</span>
          <span className="text-amber-300 font-bold text-sm">{combat.turn}</span>
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
          {combat.phase.replace('_', ' ')}
        </span>
      </div>

      {/* Combat board */}
      <div className="relative z-[2] flex flex-col flex-1 min-h-0">
        {/* Enemy area (top) */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-[10px] text-red-400/40 uppercase tracking-wider text-center pt-1 font-semibold">Enemies</div>
          <EnemyDisplay />
        </div>

        {/* Battle divider */}
        <div className="relative mx-8 my-1">
          <div className="im-divider" />
        </div>

        {/* Ally area + Hero HUD */}
        <div className="flex-1 flex flex-col justify-start">
          <div className="text-[10px] text-emerald-400/40 uppercase tracking-wider text-center pt-1 font-semibold">Allies</div>
          <AllyBoard />
          <div className="mt-auto px-4 pb-2">
            <HeroHUD />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-[2] flex justify-center gap-3 mb-2">
        <button
          onClick={() => setShowDeck(true)}
          aria-label="View deck"
          className="px-4 py-1.5 min-h-11 min-w-11 rounded-lg bg-slate-800/80 text-slate-400 text-xs hover:bg-slate-700/80 hover:text-slate-200 transition-all border border-slate-700/50"
        >
          View Deck
        </button>
        <button
          onClick={endTurn}
          aria-label="End turn"
          disabled={combat.phase !== 'player_action' || combat.result !== 'ongoing'}
          className={`
            px-8 py-2 min-h-11 min-w-11 rounded-lg font-bold text-sm transition-all
            ${combat.phase === 'player_action' && combat.result === 'ongoing'
              ? 'im-btn-primary im-glow-gold cursor-pointer'
              : 'bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-700/30'}
          `}
        >
          End Turn
        </button>
      </div>

      {/* Hand */}
      <div className="relative z-[2] flex-shrink-0 bg-gradient-to-t from-black/40 to-transparent border-t border-white/5">
        <CardHand />
      </div>

      {/* Damage popups */}
      <DamagePopups popups={popups} />

      {/* Victory / Defeat overlay */}
      {combat.result !== 'ongoing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-sm" role="alert">
          <div className="text-center">
            <div className={`text-7xl font-black tracking-wider ${
              combat.result === 'victory'
                ? 'text-amber-400 im-title-glow'
                : 'text-red-500'
            }`}
            style={combat.result === 'defeat' ? { textShadow: '0 0 30px rgba(239, 68, 68, 0.4)' } : undefined}
            >
              {combat.result === 'victory' ? 'VICTORY!' : 'DEFEAT'}
            </div>
            <div className="text-slate-400 mt-2 text-sm">
              {combat.result === 'victory' ? 'All enemies vanquished' : 'You have fallen...'}
            </div>
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
