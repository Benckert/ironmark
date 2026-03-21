import { useRef, useCallback } from 'react'
import type { Card as CardType } from '@engine/types/card.ts'
import Card from './Card.tsx'
import { useCombatStore } from '@stores/combatStore.ts'

export default function CardHand() {
  const combat = useCombatStore((s) => s.combat)
  const selectedCardId = useCombatStore((s) => s.selectedCardId)
  const selectCard = useCombatStore((s) => s.selectCard)
  const playCard = useCombatStore((s) => s.playCard)
  const canPlay = useCombatStore((s) => s.canPlay)
  const getCardCost = useCombatStore((s) => s.getCardCost)
  const needsTarget = useCombatStore((s) => s.needsTarget)

  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const handleHandKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight' && index < (combat?.hand.length ?? 0) - 1) {
      event.preventDefault()
      cardRefs.current[index + 1]?.focus()
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      cardRefs.current[index - 1]?.focus()
    }
  }, [combat?.hand.length])

  if (!combat) return null

  const hand = combat.hand

  const handleCardClick = (card: CardType) => {
    if (!canPlay(card)) return

    if (selectedCardId === card.id) {
      // Deselect
      selectCard(null)
    } else if (needsTarget(card)) {
      // Enter targeting mode
      selectCard(card.id)
    } else {
      // Play immediately (no target needed)
      playCard(card.id)
    }
  }

  return (
    <div className="relative" role="group" aria-label={`Your hand, ${hand.length} cards`}>
      {/* Deck / Discard counts */}
      <div className="absolute -top-6 left-4 flex gap-4 text-xs text-slate-400">
        <span>Deck: {combat.drawPile.length}</span>
        <span>Discard: {combat.discardPile.length}</span>
      </div>

      <div className="flex justify-start md:justify-center items-end gap-1 py-2 min-h-[180px] overflow-x-auto whitespace-nowrap px-4 snap-x snap-mandatory md:snap-none">
        {hand.map((card, index) => {
          const isPlayable = canPlay(card) && combat.phase === 'player_action'
          const isSelected = selectedCardId === card.id

          // Fan arc effect
          const totalCards = hand.length
          const midIndex = (totalCards - 1) / 2
          const offset = index - midIndex
          const rotation = offset * 3
          const yOffset = Math.abs(offset) * 5

          return (
            <div
              key={`${card.id}_${index}`}
              ref={(el) => { cardRefs.current[index] = el }}
              onKeyDown={(event) => handleHandKeyDown(event, index)}
              style={{
                transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
              }}
              className="transition-transform duration-200 hover:!rotate-0 hover:!-translate-y-4 hover:z-10 snap-center flex-shrink-0"
            >
              <Card
                card={card}
                size="medium"
                onClick={() => handleCardClick(card)}
                isPlayable={isPlayable}
                isSelected={isSelected}
                showCost={getCardCost(card)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
