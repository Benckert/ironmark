import type { HeroDefinition } from '@engine/types/hero.ts'
import { getAllHeroes } from '@data/dataLoader.ts'

interface HeroSelectProps {
  onSelect: (heroId: string) => void
}

const factionStyles: Record<string, { border: string; bg: string; glow: string; icon: string }> = {
  might: {
    border: 'border-red-600/50',
    bg: 'from-red-950/40 to-slate-900/80',
    glow: 'im-glow-red',
    icon: '\u2694\uFE0F',
  },
  wisdom: {
    border: 'border-blue-600/50',
    bg: 'from-blue-950/40 to-slate-900/80',
    glow: 'im-glow-blue',
    icon: '\uD83D\uDD2E',
  },
  heart: {
    border: 'border-amber-600/50',
    bg: 'from-amber-950/30 to-slate-900/80',
    glow: 'im-glow-gold',
    icon: '\uD83D\uDC9A',
  },
}

const factionAccents: Record<string, string> = {
  might: 'text-red-300',
  wisdom: 'text-blue-300',
  heart: 'text-amber-300',
}

export default function HeroSelect({ onSelect }: HeroSelectProps) {
  const heroes = getAllHeroes()

  return (
    <div className="min-h-screen im-bg-ambient flex flex-col items-center justify-center p-8 relative">
      <div className="absolute inset-0 im-vignette" />

      <div className="relative z-10 text-center mb-10">
        <h1 className="text-3xl font-bold text-amber-300 mb-2 tracking-wide">Choose Your Hero</h1>
        <p className="text-slate-500 text-sm">Each hero has a unique faction, passive, and hero power.</p>
      </div>

      <div className="relative z-10 flex flex-wrap gap-6 justify-center max-w-full px-4">
        {heroes.map((hero) => (
          <HeroCard key={hero.id} hero={hero} onSelect={() => onSelect(hero.id)} />
        ))}
      </div>
    </div>
  )
}

function HeroCard({ hero, onSelect }: { hero: HeroDefinition; onSelect: () => void }) {
  const style = factionStyles[hero.faction] ?? factionStyles.might

  return (
    <button
      onClick={onSelect}
      className={`
        w-72 p-6 rounded-xl border-2 transition-all cursor-pointer
        bg-gradient-to-b ${style.bg} ${style.border}
        im-card-frame
        hover:scale-105 hover:${style.glow}
        focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2
      `}
    >
      {/* Portrait area */}
      <div className="text-center mb-4">
        <div className={`w-16 h-16 rounded-full border-2 ${style.border} bg-gradient-to-b from-slate-700/50 to-slate-900/50 flex items-center justify-center mx-auto mb-3`}>
          <span className="text-3xl">{style.icon}</span>
        </div>
        <h2 className={`text-xl font-bold ${factionAccents[hero.faction]}`}>{hero.name}</h2>
        <div className="text-sm text-slate-400">{hero.title}</div>
        <div className="text-[10px] text-slate-600 uppercase mt-1 tracking-wider font-semibold">{hero.faction} faction</div>
      </div>

      {/* Stats */}
      <div className="space-y-3 text-left">
        <div className="text-sm">
          <span className="text-slate-500">HP:</span>{' '}
          <span className="text-slate-300 font-medium">{hero.startingHp}</span>
        </div>

        <div className="border-t border-white/5 pt-3">
          <div className="text-[10px] text-slate-600 uppercase mb-1 tracking-wider font-semibold">Passive</div>
          <div className="text-sm text-slate-200 font-medium">{hero.passive.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{hero.passive.description}</div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <div className="text-[10px] text-slate-600 uppercase mb-1 tracking-wider font-semibold">Hero Power ({hero.heroPower.cost} mana)</div>
          <div className="text-sm text-slate-200 font-medium">{hero.heroPower.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{hero.heroPower.description}</div>
        </div>
      </div>
    </button>
  )
}
