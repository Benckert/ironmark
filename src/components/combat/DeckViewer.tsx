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

  const allies = sorted.filter((c) => c.type === 'ally')
  const spells = sorted.filter((c) => c.type === 'spell')
  const gear = sorted.filter((c) => c.type === 'gear')

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-slate-800/95 to-slate-900/95 border border-amber-900/20 rounded-xl p-6 max-w-4xl max-h-[80vh] overflow-auto im-card-frame"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-amber-300">{title} ({cards.length} cards)</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-amber-300 text-lg px-2 py-1 rounded hover:bg-slate-700/50 transition-all"
          >
            {'\u2715'}
          </button>
        </div>

        {allies.length > 0 && <DeckSection label="Allies" cards={allies} />}
        {spells.length > 0 && <DeckSection label="Spells" cards={spells} />}
        {gear.length > 0 && <DeckSection label="Gear" cards={gear} />}

        {cards.length === 0 && (
          <div className="text-slate-600 text-center py-8">No cards</div>
        )}
      </div>
    </div>
  )
}

function DeckSection({ label, cards }: { label: string; cards: CardType[] }) {
  return (
    <div className="mb-4">
      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 px-1">{label} ({cards.length})</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {cards.map((card, i) => (
          <Card key={`${card.id}_${i}`} card={card} size="small" isPlayable={false} />
        ))}
      </div>
    </div>
  )
}
