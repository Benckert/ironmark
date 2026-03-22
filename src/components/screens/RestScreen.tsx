import { useState, useMemo } from 'react'
import type { Card as CardType } from '@engine/types/card.ts'
import { upgradeCard } from '@engine/cards/deckManager.ts'
import Card from '../cards/Card.tsx'

interface RestScreenProps {
  hp: number
  maxHp: number
  healAmount: number
  deck: CardType[]
  onHeal: () => void
  onUpgrade: (cardId: string) => void
  onRemove: (cardId: string) => void
  onContinue: () => void
}

export default function RestScreen({
  hp,
  maxHp,
  healAmount,
  deck,
  onHeal,
  onUpgrade,
  onRemove,
  onContinue,
}: RestScreenProps) {
  const [choiceMade, setChoiceMade] = useState(false)
  const [choiceResult, setChoiceResult] = useState('')
  const [showDeck, setShowDeck] = useState<'upgrade' | 'remove' | null>(null)
  const [previewCardId, setPreviewCardId] = useState<string | null>(null)

  const previewUpgraded = useMemo(() => {
    if (!previewCardId) return null
    const upgraded = upgradeCard(deck, previewCardId)
    return upgraded.find((c) => c.id === previewCardId) ?? null
  }, [previewCardId, deck])

  const handleHeal = () => {
    onHeal()
    setChoiceMade(true)
    setChoiceResult(`Restored ${healAmount} HP`)
  }

  const handleSelectCardForUpgrade = (card: CardType) => {
    onUpgrade(card.id)
    setShowDeck(null)
    setChoiceMade(true)
    setChoiceResult(`Upgraded ${card.name}`)
  }

  const handleSelectCardForRemove = (card: CardType) => {
    onRemove(card.id)
    setShowDeck(null)
    setChoiceMade(true)
    setChoiceResult(`Removed ${card.name}`)
  }

  const upgradableCards = deck.filter((c) => !c.upgraded && c.type !== 'gear')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative" style={{
      background: 'radial-gradient(ellipse 60% 50% at 50% 80%, rgba(232, 115, 42, 0.06) 0%, transparent 60%), linear-gradient(to bottom, #12091e, #1a0f2e, #12091e)',
    }}>
      <div className="absolute inset-0 im-vignette pointer-events-none" />

      {/* Campfire embers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-orange-400/40"
            style={{
              left: `${40 + i * 5}%`,
              bottom: '20%',
              animation: `im-float ${2.5 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <h1 className="text-2xl font-bold text-blue-300 mb-2 text-center tracking-wide">Rest Site</h1>
        <p className="text-slate-500 mb-8 text-center">Choose one action.</p>

        {!choiceMade && !showDeck && (
          <div className="flex gap-6">
            {/* Heal */}
            <button
              onClick={handleHeal}
              disabled={hp >= maxHp}
              className={`w-48 p-6 rounded-xl border transition-all flex flex-col items-center gap-3 im-card-frame ${
                hp < maxHp
                  ? 'border-green-600/40 bg-gradient-to-b from-green-950/40 to-slate-900/80 hover:from-green-950/60 hover:scale-105 cursor-pointer im-glow-green'
                  : 'border-slate-700/20 bg-slate-900/40 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl">{'\u2764\uFE0F'}</span>
              <span className="text-lg font-bold text-green-400">Heal</span>
              <span className="text-sm text-slate-400">Restore {healAmount} HP</span>
              <span className="text-xs text-slate-600">({hp}/{maxHp} HP)</span>
            </button>

            {/* Upgrade */}
            <button
              onClick={() => setShowDeck('upgrade')}
              disabled={upgradableCards.length === 0}
              className={`w-48 p-6 rounded-xl border transition-all flex flex-col items-center gap-3 im-card-frame ${
                upgradableCards.length > 0
                  ? 'border-blue-600/40 bg-gradient-to-b from-blue-950/40 to-slate-900/80 hover:from-blue-950/60 hover:scale-105 cursor-pointer im-glow-blue'
                  : 'border-slate-700/20 bg-slate-900/40 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl">{'\u2B06\uFE0F'}</span>
              <span className="text-lg font-bold text-blue-400">Upgrade</span>
              <span className="text-sm text-slate-400">Enhance a card</span>
              <span className="text-xs text-slate-600">({upgradableCards.length} upgradable)</span>
            </button>

            {/* Remove */}
            <button
              onClick={() => setShowDeck('remove')}
              disabled={deck.length <= 5}
              className={`w-48 p-6 rounded-xl border transition-all flex flex-col items-center gap-3 im-card-frame ${
                deck.length > 5
                  ? 'border-red-600/40 bg-gradient-to-b from-red-950/40 to-slate-900/80 hover:from-red-950/60 hover:scale-105 cursor-pointer im-glow-red'
                  : 'border-slate-700/20 bg-slate-900/40 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl">{'\uD83D\uDDD1\uFE0F'}</span>
              <span className="text-lg font-bold text-red-400">Remove</span>
              <span className="text-sm text-slate-400">Delete a card</span>
              <span className="text-xs text-slate-600">({deck.length} cards in deck)</span>
            </button>
          </div>
        )}

        {/* Deck viewer for upgrade/remove */}
        {showDeck && (
          <div className="w-full max-w-4xl">
            <h2 className="text-lg font-semibold text-slate-300 mb-4 text-center">
              {showDeck === 'upgrade' ? 'Select a card to upgrade' : 'Select a card to remove'}
            </h2>
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {(showDeck === 'upgrade' ? upgradableCards : deck).map((card, index) => (
                <div
                  key={`${card.id}_${index}`}
                  onMouseEnter={() => showDeck === 'upgrade' ? setPreviewCardId(card.id) : undefined}
                  onMouseLeave={() => setPreviewCardId(null)}
                >
                  <Card
                    card={card}
                    size="small"
                    isPlayable={true}
                    isSelected={previewCardId === card.id}
                    onClick={() =>
                      showDeck === 'upgrade'
                        ? handleSelectCardForUpgrade(card)
                        : handleSelectCardForRemove(card)
                    }
                  />
                </div>
              ))}
            </div>

            {/* Upgrade preview */}
            {showDeck === 'upgrade' && previewCardId && previewUpgraded && (
              <div className="flex items-center justify-center gap-6 mb-4 p-4 bg-slate-800/40 rounded-xl border border-blue-900/20 im-card-frame">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Current</span>
                  <Card card={deck.find((c) => c.id === previewCardId)!} size="medium" />
                </div>
                <div className="text-2xl text-blue-400 font-bold">{'\u2192'}</div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-blue-400 uppercase tracking-wide">Upgraded</span>
                  <Card card={previewUpgraded} size="medium" />
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => { setShowDeck(null); setPreviewCardId(null) }}
                className="px-6 py-2 bg-slate-800/60 text-slate-400 rounded-lg hover:bg-slate-700/60 transition-all border border-slate-700/30"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Result + continue */}
        {choiceMade && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-lg text-slate-300">{choiceResult}</div>
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
