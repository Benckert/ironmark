import { useState } from 'react'
import type { Card as CardType } from '@engine/types/card.ts'
import type { ShopInventory } from '@engine/rewards/shopGenerator.ts'
import Card from '../cards/Card.tsx'

interface ShopScreenProps {
  shop: ShopInventory
  gold: number
  onBuyCard: (index: number) => void
  onBuyGear: (index: number) => void
  onRemoveCard: (cardId: string) => void
  onRerollShop: () => void
  onLeave: () => void
  deck: CardType[]
  canAffordRemoval: boolean
}

export default function ShopScreen({
  shop,
  gold,
  onBuyCard,
  onBuyGear,
  onRemoveCard,
  onRerollShop,
  onLeave,
  deck,
  canAffordRemoval,
}: ShopScreenProps) {
  const [showRemoval, setShowRemoval] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center p-8 relative" style={{
      background: 'radial-gradient(ellipse at 50% 70%, rgba(120, 80, 20, 0.08) 0%, transparent 60%), linear-gradient(to bottom, #12091e, #1a0f2e, #12091e)',
    }}>
      <div className="absolute inset-0 im-vignette pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-4xl mb-8">
        <h1 className="text-2xl font-bold text-amber-300 tracking-wide">Shop</h1>
        <div className="flex items-center gap-2 bg-slate-800/60 px-4 py-1.5 rounded-full border border-amber-900/20">
          <span className="text-amber-400 font-bold">{gold}</span>
          <span className="text-amber-600/60 text-sm">Gold</span>
        </div>
      </div>

      {/* Cards for sale */}
      <div className="relative z-10 mb-8 w-full max-w-4xl">
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Cards</h2>
        <div className="flex gap-4 justify-center">
          {shop.cards.map((item, i) => (
            <div key={item.item.id} className="flex flex-col items-center gap-2">
              <div className={item.sold ? 'opacity-20 pointer-events-none' : !item.sold && gold < item.price ? 'opacity-50 grayscale-[30%]' : ''}>
                <Card
                  card={item.item}
                  size="medium"
                  isPlayable={!item.sold && gold >= item.price}
                  onClick={!item.sold && gold >= item.price ? () => onBuyCard(i) : undefined}
                />
              </div>
              <div className={`text-sm font-bold ${
                item.sold
                  ? 'text-slate-700 line-through'
                  : gold >= item.price
                    ? 'text-amber-400'
                    : 'text-red-400/70'
              }`}>
                {item.sold ? 'SOLD' : `${item.price}g`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gear for sale */}
      <div className="relative z-10 mb-8 w-full max-w-4xl">
        <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Gear</h2>
        <div className="flex gap-4 justify-center">
          {shop.gear.map((item, i) => (
            <div key={item.item.id} className="flex flex-col items-center gap-2">
              <div className={item.sold ? 'opacity-20 pointer-events-none' : !item.sold && gold < item.price ? 'opacity-50 grayscale-[30%]' : ''}>
                <Card
                  card={item.item}
                  size="medium"
                  isPlayable={!item.sold && gold >= item.price}
                  onClick={!item.sold && gold >= item.price ? () => onBuyGear(i) : undefined}
                />
              </div>
              <div className={`text-sm font-bold ${
                item.sold
                  ? 'text-slate-700 line-through'
                  : gold >= item.price
                    ? 'text-amber-400'
                    : 'text-red-400/70'
              }`}>
                {item.sold ? 'SOLD' : `${item.price}g`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="relative z-10 mb-8 flex gap-4">
        <button
          onClick={() => setShowRemoval(true)}
          disabled={!canAffordRemoval}
          className={`px-6 py-3 rounded-lg font-semibold transition-all border ${
            canAffordRemoval
              ? 'bg-gradient-to-b from-red-800 to-red-900 text-white hover:from-red-700 hover:to-red-800 border-red-600/30 im-glow-red'
              : 'bg-slate-800/60 text-slate-600 cursor-not-allowed border-slate-700/20'
          }`}
        >
          Remove Card ({shop.cardRemovalCost}g)
        </button>
        <button
          onClick={onRerollShop}
          disabled={gold < shop.rerollCost}
          className={`px-6 py-3 rounded-lg font-semibold transition-all border ${
            gold >= shop.rerollCost
              ? 'bg-gradient-to-b from-blue-800 to-blue-900 text-white hover:from-blue-700 hover:to-blue-800 border-blue-600/30 im-glow-blue'
              : 'bg-slate-800/60 text-slate-600 cursor-not-allowed border-slate-700/20'
          }`}
        >
          Reroll Shop ({shop.rerollCost}g)
        </button>
      </div>

      {/* Leave button */}
      <button
        onClick={onLeave}
        className="relative z-10 px-8 py-3 bg-slate-800/60 text-slate-300 rounded-lg hover:bg-slate-700/60 transition-all font-semibold border border-slate-700/30"
      >
        Leave Shop
      </button>

      {/* Card removal modal */}
      {showRemoval && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-xl p-6 max-w-3xl max-h-[80vh] overflow-y-auto border border-amber-900/20 im-card-frame">
            <h2 className="text-xl font-bold text-amber-300 mb-4">Select a card to remove</h2>
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {deck.map((card, index) => (
                <Card
                  key={`${card.id}_${index}`}
                  card={card}
                  size="small"
                  isPlayable={true}
                  onClick={() => {
                    onRemoveCard(card.id)
                    setShowRemoval(false)
                  }}
                />
              ))}
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowRemoval(false)}
                className="px-6 py-2 bg-slate-800/60 text-slate-400 rounded-lg hover:bg-slate-700/60 transition-all border border-slate-700/30"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
