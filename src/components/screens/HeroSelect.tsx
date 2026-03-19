import type { HeroDefinition } from '@engine/types/hero.ts'
import { getAllHeroes } from '@data/dataLoader.ts'

interface HeroSelectProps {
  onSelect: (heroId: string) => void
}

const factionColors: Record<string, string> = {
  might: 'border-red-600 bg-red-900/20',
  wisdom: 'border-blue-600 bg-blue-900/20',
  heart: 'border-amber-600 bg-amber-900/20',
}

const factionAccents: Record<string, string> = {
  might: 'text-red-400',
  wisdom: 'text-blue-400',
  heart: 'text-amber-400',
}

export default function HeroSelect({ onSelect }: HeroSelectProps) {
  const heroes = getAllHeroes()

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-slate-200 mb-2">Choose Your Hero</h1>
      <p className="text-slate-500 mb-10">Each hero has a unique faction, passive, and hero power.</p>

      <div className="flex gap-8">
        {heroes.map((hero) => (
          <HeroCard key={hero.id} hero={hero} onSelect={() => onSelect(hero.id)} />
        ))}
      </div>
    </div>
  )
}

function HeroCard({ hero, onSelect }: { hero: HeroDefinition; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-72 p-6 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer
        ${factionColors[hero.faction] ?? 'border-slate-600 bg-slate-800'}
      `}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">
          {hero.faction === 'might' ? '\u2694\uFE0F' : hero.faction === 'wisdom' ? '\uD83D\uDD2E' : '\uD83D\uDC9A'}
        </div>
        <h2 className={`text-xl font-bold ${factionAccents[hero.faction]}`}>{hero.name}</h2>
        <div className="text-sm text-slate-400">{hero.title}</div>
        <div className="text-xs text-slate-500 uppercase mt-1">{hero.faction} faction</div>
      </div>

      {/* Stats */}
      <div className="space-y-3 text-left">
        <div className="text-sm">
          <span className="text-slate-500">HP:</span>{' '}
          <span className="text-slate-300">{hero.startingHp}</span>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase mb-1">Passive</div>
          <div className="text-sm text-slate-300 font-medium">{hero.passive.name}</div>
          <div className="text-xs text-slate-400">{hero.passive.description}</div>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase mb-1">Hero Power ({hero.heroPower.cost} mana)</div>
          <div className="text-sm text-slate-300 font-medium">{hero.heroPower.name}</div>
          <div className="text-xs text-slate-400">{hero.heroPower.description}</div>
        </div>
      </div>
    </button>
  )
}
