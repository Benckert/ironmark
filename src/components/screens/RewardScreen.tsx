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
    <div className="min-h-screen im-bg-ambient flex flex-col items-center justify-center p-8 relative">
      <div className="absolute inset-0 im-vignette pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Gold earned */}
        <div className="mb-6 text-center">
          <div className="text-amber-400 text-2xl font-bold im-title-glow">+{goldEarned} Gold</div>
          <div className="text-slate-600 text-sm">Total: {currentGold} gold</div>
        </div>

        {/* Card rewards */}
        {!cardDecisionMade && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-200 text-center mb-4">Choose a Card</h2>

            {/* Card fan */}
            <div className="flex justify-center gap-5 mb-5">
              {cardChoices.map((card, index) => {
                const isRevealed = index < revealedCards
                const isSelected = selectedCard?.id === card.id

                return (
                  <div
                    key={`${card.id}_${index}`}
                    className={`
                      transition-all duration-500
                      ${isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                    `}
                  >
                    {isRevealed ? (
                      <div
                        className={`transform transition-all duration-200 ${
                          isSelected ? 'scale-110 -translate-y-3' : 'hover:scale-105 hover:-translate-y-1'
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
                      <div className="w-36 h-52 rounded-lg bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600/30 flex items-center justify-center im-card-frame">
                        <span className="text-3xl text-slate-600">?</span>
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
                  className="px-6 py-2 bg-gradient-to-b from-green-500 to-green-700 text-white font-bold rounded-lg hover:from-green-400 hover:to-green-600 transition-all border border-green-400/30 im-glow-green"
                >
                  Take {selectedCard.name}
                </button>
              )}
              <button
                onClick={handleReroll}
                disabled={!canAffordReroll || isRevealing}
                className={`
                  px-4 py-2 rounded-lg font-semibold text-sm transition-all border
                  ${canAffordReroll && !isRevealing
                    ? 'bg-gradient-to-b from-blue-700 to-blue-900 text-white hover:from-blue-600 hover:to-blue-800 border-blue-500/30'
                    : 'bg-slate-800/60 text-slate-600 cursor-not-allowed border-slate-700/20'}
                `}
              >
                Reroll ({rerollCost}g)
              </button>
              <button
                onClick={handleSkipCards}
                disabled={isRevealing}
                className="px-4 py-2 bg-slate-800/60 text-slate-400 rounded-lg hover:bg-slate-700/60 transition-all text-sm border border-slate-700/30"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Card decision made */}
        {cardDecisionMade && (
          <div className="mb-8 text-center text-slate-500">
            {selectedCard
              ? <span>Added <span className="text-amber-300 font-semibold">{selectedCard.name}</span> to your deck</span>
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
                className="px-6 py-2 bg-gradient-to-b from-green-500 to-green-700 text-white font-bold rounded-lg hover:from-green-400 hover:to-green-600 transition-all border border-green-400/30 im-glow-green"
              >
                Take Gear
              </button>
              <button
                onClick={handleSkipGear}
                className="px-4 py-2 bg-slate-800/60 text-slate-400 rounded-lg hover:bg-slate-700/60 transition-all border border-slate-700/30"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Continue button */}
        {allDecisionsMade && (
          <div className="flex justify-center">
            <button
              onClick={onContinue}
              className="px-8 py-3 im-btn-primary rounded-lg text-lg"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
