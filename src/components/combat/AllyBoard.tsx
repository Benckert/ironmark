import type { AllyInstance } from '@engine/types/combat.ts'
import type { Keyword } from '@engine/types/card.ts'
import { useCombatStore } from '@stores/combatStore.ts'

const keywordDescriptions: Record<Keyword, string> = {
  strike: 'Triggers an effect when this ally deals damage',
  deathblow: 'Triggers an effect when this ally dies',
  echo: 'Returns a copy of this spell to your hand when played',
  ward: 'Blocks the next instance of damage',
  taunt: 'Forces enemies to attack this ally instead of the hero',
  burn: 'Deals 1 damage at the start of each turn per stack',
  poison: 'Deals 1 damage at the start of each turn per stack',
  fury: 'Gains +1 Attack whenever this ally takes damage',
  blessing: 'Grants a beneficial effect to allies',
}

const factionGlow: Record<string, string> = {
  might: 'border-red-700/40',
  wisdom: 'border-blue-700/40',
  heart: 'border-amber-700/40',
  neutral: 'border-slate-600/40',
}

export default function AllyBoard() {
  const combat = useCombatStore((s) => s.combat)
  const targetingMode = useCombatStore((s) => s.targetingMode)
  const selectedCardId = useCombatStore((s) => s.selectedCardId)
  const playCard = useCombatStore((s) => s.playCard)

  if (!combat) return null

  const handleAllyClick = (ally: AllyInstance) => {
    if (targetingMode && selectedCardId) {
      playCard(selectedCardId, ally.instanceId)
    }
  }

  return (
    <div className="flex justify-center gap-3 py-2 min-h-[80px]">
      {combat.allies.map((ally) => (
        <AllyCard
          key={ally.instanceId}
          ally={ally}
          isTargetable={targetingMode}
          onClick={() => handleAllyClick(ally)}
        />
      ))}
      {combat.allies.length === 0 && (
        <div className="text-slate-600/50 text-sm italic">No allies in play</div>
      )}
    </div>
  )
}

function AllyCard({
  ally,
  isTargetable,
  onClick,
}: {
  ally: AllyInstance
  isTargetable: boolean
  onClick: () => void
}) {
  const hpPercent = (ally.currentHp / ally.card.health) * 100

  return (
    <div
      onClick={isTargetable ? onClick : undefined}
      className={`
        w-22 rounded-lg border bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-1.5 flex flex-col items-center
        im-card-frame
        ${factionGlow[ally.card.faction] ?? factionGlow.neutral}
        ${isTargetable ? 'cursor-pointer ring-1 ring-emerald-400/50 hover:ring-2 hover:ring-emerald-400/80 im-glow-green' : ''}
        ${ally.hasAttackedThisTurn ? 'opacity-60' : ''}
        transition-all duration-200
      `}
    >
      {/* Name */}
      <div className="text-[9px] font-bold text-slate-200 text-center truncate w-full">
        {ally.card.name}
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-sm font-bold mt-1">
        <div className="flex flex-col items-center">
          <span className="text-red-400">{ally.currentAttack}</span>
          <span className="text-[6px] text-red-400/50 uppercase">atk</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-green-400">{ally.currentHp}</span>
          <span className="text-[6px] text-green-400/50 uppercase">hp</span>
        </div>
      </div>

      {/* HP bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden border border-slate-700/20">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${Math.min(100, hpPercent)}%` }}
        />
      </div>

      {/* Keywords */}
      {ally.card.keywords.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
          {ally.card.keywords.map((kw) => (
            <span key={kw} className="text-[6px] px-0.5 rounded bg-slate-800/80 text-slate-400 capitalize cursor-help border border-slate-700/30" title={keywordDescriptions[kw] ?? kw}>
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Statuses */}
      {ally.statuses.length > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {ally.statuses.map((s, i) => (
            <span key={i} className="text-[6px] px-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/30">
              {s.type}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
