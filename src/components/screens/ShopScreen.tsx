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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-8">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-8">
        <h1 className="text-2xl font-bold text-amber-400">Shop</h1>
        <div className="text-lg text-amber-300 font-semibold">{gold} Gold</div>
      </div>

      {/* Cards for sale */}
      <div className="mb-8 w-full max-w-4xl">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">Cards</h2>
        <div className="flex gap-4 justify-center">
          {shop.cards.map((item, i) => (
            <div key={item.item.id} className="flex flex-col items-center gap-2">
              <div className={item.sold ? 'opacity-30 pointer-events-none' : !item.sold && gold < item.price ? 'opacity-60 grayscale-[30%]' : ''}>
                <Card
                  card={item.item}
                  size="medium"
                  isPlayable={!item.sold && gold >= item.price}
                  onClick={!item.sold && gold >= item.price ? () => onBuyCard(i) : undefined}
                />
              </div>
              <div className={`text-sm font-semibold ${
                item.sold
                  ? 'text-slate-600 line-through'
                  : gold >= item.price
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}>
                {item.sold ? 'SOLD' : `${item.price}g`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gear for sale */}
      <div className="mb-8 w-full max-w-4xl">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">Gear</h2>
        <div className="flex gap-4 justify-center">
          {shop.gear.map((item, i) => (
            <div key={item.item.id} className="flex flex-col items-center gap-2">
              <div className={item.sold ? 'opacity-30 pointer-events-none' : !item.sold && gold < item.price ? 'opacity-60 grayscale-[30%]' : ''}>
                <Card
                  card={item.item}
                  size="medium"
                  isPlayable={!item.sold && gold >= item.price}
                  onClick={!item.sold && gold >= item.price ? () => onBuyGear(i) : undefined}
                />
              </div>
              <div className={`text-sm font-semibold ${
                item.sold
                  ? 'text-slate-600 line-through'
                  : gold >= item.price
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}>
                {item.sold ? 'SOLD' : `${item.price}g`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setShowRemoval(true)}
          disabled={!canAffordRemoval}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            canAffordRemoval
              ? 'bg-red-800 text-white hover:bg-red-700'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Remove Card ({shop.cardRemovalCost}g)
        </button>
        <button
          onClick={onRerollShop}
          disabled={gold < shop.rerollCost}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            gold >= shop.rerollCost
              ? 'bg-blue-800 text-white hover:bg-blue-700'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Reroll Shop ({shop.rerollCost}g)
        </button>
      </div>

      {/* Leave button */}
      <button
        onClick={onLeave}
        className="px-8 py-3 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors font-semibold"
      >
        Leave Shop
      </button>

      {/* Card removal modal */}
      {showRemoval && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-3xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-200 mb-4">Select a card to remove</h2>
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
                className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
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
