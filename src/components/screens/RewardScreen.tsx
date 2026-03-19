import { useState, useEffect } from 'react'
import type { Card as CardType, GearCard } from '@engine/types/card.ts'
import Card from '../cards/Card.tsx'

interface RewardScreenProps {
  goldEarned: number
  cardChoices: CardType[]
  gearChoice: GearCard | null
  currentGold: number
  rerollCount: number
  onSelectCard: (card: CardType) => void
  onSkipCards: () => void
  onReroll: () => void
  onTakeGear: (gear: GearCard) => void
  onSkipGear: () => void
  onContinue: () => void
  canAffordReroll: boolean
  rerollCost: number
}

export default function RewardScreen({
  goldEarned,
  cardChoices,
  gearChoice,
  currentGold,
  rerollCount: _rerollCount,
  onSelectCard,
  onSkipCards,
  onReroll,
  onTakeGear,
  onSkipGear,
  onContinue,
  canAffordReroll,
  rerollCost,
}: RewardScreenProps) {
  const [revealedCards, setRevealedCards] = useState<number>(0)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [cardDecisionMade, setCardDecisionMade] = useState(false)
  const [gearDecisionMade, setGearDecisionMade] = useState(gearChoice === null)
  const [isRevealing, setIsRevealing] = useState(true)

  // Card reveal animation
  useEffect(() => {
    setRevealedCards(0)
    setIsRevealing(true)

    const timers = [
      setTimeout(() => setRevealedCards(1), 400),
      setTimeout(() => setRevealedCards(2), 800),
      setTimeout(() => {
        setRevealedCards(3)
        setIsRevealing(false)
      }, 1200),
    ]

    return () => timers.forEach(clearTimeout)
  }, [cardChoices])

  const handleSelectCard = (card: CardType) => {
    if (isRevealing || cardDecisionMade) return
    setSelectedCard(card)
  }

  const handleConfirmCard = () => {
    if (!selectedCard) return
    onSelectCard(selectedCard)
    setCardDecisionMade(true)
  }

  const handleSkipCards = () => {
    onSkipCards()
    setCardDecisionMade(true)
  }

  const handleReroll = () => {
    if (!canAffordReroll) return
    setSelectedCard(null)
    onReroll()
  }

  const handleTakeGear = () => {
    if (gearChoice) {
      onTakeGear(gearChoice)
      setGearDecisionMade(true)
    }
  }

  const handleSkipGear = () => {
    onSkipGear()
    setGearDecisionMade(true)
  }

  const allDecisionsMade = cardDecisionMade && gearDecisionMade

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      {/* Gold earned */}
      <div className="mb-6 text-center">
        <div className="text-amber-400 text-2xl font-bold">+{goldEarned} Gold</div>
        <div className="text-slate-500 text-sm">Total: {currentGold} gold</div>
      </div>

      {/* Card rewards */}
      {!cardDecisionMade && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-200 text-center mb-4">Choose a Card</h2>

          {/* Card fan */}
          <div className="flex justify-center gap-4 mb-4">
            {cardChoices.map((card, index) => {
              const isRevealed = index < revealedCards
              const isSelected = selectedCard?.id === card.id

              return (
                <div
                  key={`${card.id}_${index}`}
                  className={`
                    transition-all duration-500
                    ${isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-75 rotate-y-180'}
                  `}
                >
                  {isRevealed ? (
                    <div
                      className={`transform transition-all duration-200 ${
                        isSelected ? 'scale-110 -translate-y-2' : 'hover:scale-105'
                      }`}
                    >
                      <Card
                        card={card}
                        size="large"
                        onClick={() => handleSelectCard(card)}
                        isPlayable={!isRevealing}
                        isSelected={isSelected}
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-52 rounded-lg bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                      <span className="text-3xl text-slate-500">?</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-3">
            {selectedCard && (
              <button
                onClick={handleConfirmCard}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors"
              >
                Take {selectedCard.name}
              </button>
            )}
            <button
              onClick={handleReroll}
              disabled={!canAffordReroll || isRevealing}
              className={`
                px-4 py-2 rounded-lg font-semibold text-sm transition-colors
                ${canAffordReroll && !isRevealing
                  ? 'bg-blue-700 text-white hover:bg-blue-600'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
              `}
            >
              Reroll ({rerollCost}g)
            </button>
            <button
              onClick={handleSkipCards}
              disabled={isRevealing}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Card decision made confirmation */}
      {cardDecisionMade && (
        <div className="mb-8 text-center text-slate-400">
          {selectedCard
            ? <span>Added <span className="text-slate-200 font-semibold">{selectedCard.name}</span> to your deck</span>
            : <span>Skipped card reward</span>
          }
        </div>
      )}

      {/* Gear reward (elite only) */}
      {cardDecisionMade && gearChoice && !gearDecisionMade && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-200 text-center mb-4">Gear Reward</h2>
          <div className="flex justify-center mb-4">
            <Card card={gearChoice} size="large" isPlayable={false} />
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleTakeGear}
              className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors"
            >
              Take Gear
            </button>
            <button
              onClick={handleSkipGear}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Continue button */}
      {allDecisionsMade && (
        <button
          onClick={onContinue}
          className="px-8 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors text-lg"
        >
          Continue
        </button>
      )}
    </div>
  )
}
