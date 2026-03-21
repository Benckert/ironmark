import type { EnemyInstance } from '@engine/types/combat.ts'
import { useCombatStore } from '@stores/combatStore.ts'
import { getEnemyIntent } from '@engine/encounters/enemyAI.ts'

const intentIcons: Record<string, string> = {
  attack: '\u2694\uFE0F',
  defend: '\uD83D\uDEE1\uFE0F',
  buff: '\u2795',
  debuff: '\uD83D\uDC80',
  heal: '\u2764\uFE0F',
  summon: '\uD83D\uDCE2',
  unknown: '\u2753',
}

const intentDescriptions: Record<string, string> = {
  attack: 'Intends to attack',
  defend: 'Intends to gain armor',
  buff: 'Intends to buff itself',
  debuff: 'Intends to debuff you',
  heal: 'Intends to heal',
  summon: 'Intends to summon an ally',
  unknown: 'Unknown intent',
}

export default function EnemyDisplay() {
  const combat = useCombatStore((s) => s.combat)
  const targetingMode = useCombatStore((s) => s.targetingMode)
  const selectedCardId = useCombatStore((s) => s.selectedCardId)
  const playCard = useCombatStore((s) => s.playCard)
  const allyTargetingMode = useCombatStore((s) => s.allyTargetingMode)
  const assignAllyTarget = useCombatStore((s) => s.assignAllyTarget)

  if (!combat) return null

  const handleEnemyClick = (enemy: EnemyInstance) => {
    if (targetingMode && selectedCardId) {
      playCard(selectedCardId, enemy.instanceId)
    } else if (allyTargetingMode) {
      assignAllyTarget(enemy.instanceId)
    }
  }

  const isTargetable = targetingMode || allyTargetingMode

  return (
    <div className="flex justify-center gap-4 py-4">
      {combat.enemies.map((enemy) => (
        <EnemyCard
          key={enemy.instanceId}
          enemy={enemy}
          isTargetable={isTargetable}
          onClick={() => handleEnemyClick(enemy)}
        />
      ))}
    </div>
  )
}

function EnemyCard({
  enemy,
  isTargetable,
  onClick,
}: {
  enemy: EnemyInstance
  isTargetable: boolean
  onClick: () => void
}) {
  const intent = getEnemyIntent(enemy)
  const hpPercent = (enemy.hp / enemy.maxHp) * 100
  const hpColor = hpPercent > 50 ? 'bg-red-600' : hpPercent > 25 ? 'bg-orange-600' : 'bg-red-800'

  return (
    <div
      onClick={isTargetable ? onClick : undefined}
      className={`
        relative w-28 rounded-lg border border-red-900 bg-slate-800/80 p-2 flex flex-col items-center
        ${isTargetable ? 'cursor-crosshair ring-2 ring-red-500 ring-opacity-50 hover:ring-opacity-100' : ''}
        ${enemy.hp <= 0 ? 'opacity-30' : ''}
        transition-all duration-200
      `}
    >
      {/* Intent */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-700 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 border border-slate-600 cursor-help" title={`${intentDescriptions[intent.type] ?? 'Unknown'} for ${intent.value + enemy.buffs.attack}`}>
        <span>{intentIcons[intent.type] || '?'}</span>
        <span className="text-white font-bold">
          {intent.value + enemy.buffs.attack}
        </span>
      </div>

      {/* Enemy icon */}
      <div className="text-3xl mt-2 mb-1">{'\uD83D\uDC79'}</div>

      {/* Name */}
      <div className="text-xs font-semibold text-slate-200 text-center truncate w-full">
        {enemy.name}
      </div>

      {/* HP bar */}
      <div className="w-full h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
        <div
          className={`h-full ${hpColor} transition-all duration-300`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-400 mt-0.5">
        {enemy.hp}/{enemy.maxHp}
      </div>

      {/* Status effects */}
      {enemy.statuses.length > 0 && (
        <div className="flex gap-1 mt-1">
          {enemy.statuses.map((status, i) => (
            <span
              key={i}
              className="text-[9px] px-1 rounded bg-slate-700 text-slate-300"
            >
              {status.type} {status.stacks}
            </span>
          ))}
        </div>
      )}

      {/* Armor */}
      {enemy.buffs.armor > 0 && (
        <div className="absolute top-1 right-1 bg-yellow-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white">
          {enemy.buffs.armor}
        </div>
      )}
    </div>
  )
}
