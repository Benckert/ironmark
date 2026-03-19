import type { Card as CardType } from '@engine/types/card.ts'
import Card from '../cards/Card.tsx'

interface DeckViewerProps {
  cards: CardType[]
  title: string
  onClose: () => void
}

export default function DeckViewer({ cards, title, onClose }: DeckViewerProps) {
  const sorted = [...cards].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type)
    return a.cost - b.cost
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-4xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-200">{title} ({cards.length} cards)</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl px-2"
          >
            X
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {sorted.map((card, i) => (
            <Card key={`${card.id}_${i}`} card={card} size="small" isPlayable={false} />
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-slate-500 text-center py-8">No cards</div>
        )}
      </div>
    </div>
  )
}
