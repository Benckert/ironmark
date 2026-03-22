import type { EnemyInstance } from '@engine/types/combat.ts'
import { useCombatStore } from '@stores/combatStore.ts'
import { getEnemyIntent } from '@engine/encounters/enemyAI.ts'

const intentIcons: Record<string, string> = {
  attack: '\u2694\uFE0F',
  defend: '\uD83D\uDEE1\uFE0F',
  buff: '\u2B06',
  debuff: '\uD83D\uDC80',
  heal: '\u2764\uFE0F',
  summon: '\uD83D\uDCE2',
  unknown: '\u2753',
}

const intentColors: Record<string, string> = {
  attack: 'bg-red-900/80 border-red-600/50 text-red-200',
  defend: 'bg-blue-900/80 border-blue-600/50 text-blue-200',
  buff: 'bg-amber-900/80 border-amber-600/50 text-amber-200',
  debuff: 'bg-purple-900/80 border-purple-600/50 text-purple-200',
  heal: 'bg-green-900/80 border-green-600/50 text-green-200',
  summon: 'bg-indigo-900/80 border-indigo-600/50 text-indigo-200',
  unknown: 'bg-slate-700/80 border-slate-500/50 text-slate-300',
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
    <div className="flex justify-center gap-5 py-4">
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
  const hpColor = hpPercent > 50 ? 'bg-red-500' : hpPercent > 25 ? 'bg-orange-500' : 'bg-red-700'

  return (
    <div
      onClick={isTargetable ? onClick : undefined}
      className={`
        relative w-28 rounded-lg border bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-2 flex flex-col items-center
        im-card-frame
        ${isTargetable
          ? 'cursor-crosshair border-red-500/60 ring-1 ring-red-500/40 hover:ring-2 hover:ring-red-400/70 im-glow-red'
          : 'border-red-900/40'}
        ${enemy.hp <= 0 ? 'opacity-30' : 'im-breathe'}
        transition-all duration-200
      `}
    >
      {/* Intent badge */}
      <div
        className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-xs flex items-center gap-1 border cursor-help backdrop-blur-sm ${
          intentColors[intent.type] ?? intentColors.unknown
        }`}
        title={`${intentDescriptions[intent.type] ?? 'Unknown'} for ${intent.value + enemy.buffs.attack}`}
      >
        <span className="text-[11px]">{intentIcons[intent.type] || '?'}</span>
        <span className="font-bold text-[11px]">
          {intent.value + enemy.buffs.attack}
        </span>
      </div>

      {/* Enemy portrait area */}
      <div className="w-16 h-12 mt-3 mb-1 rounded bg-gradient-to-b from-red-950/60 to-slate-900/40 flex items-center justify-center border border-red-900/20">
        <span className="text-2xl drop-shadow-lg">{'\uD83D\uDC79'}</span>
      </div>

      {/* Name */}
      <div className="text-[10px] font-bold text-slate-200 text-center truncate w-full">
        {enemy.name}
      </div>

      {/* HP bar */}
      <div className="w-full h-2.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden border border-slate-700/30">
        <div
          className={`h-full ${hpColor} transition-all duration-300`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
        {enemy.hp}/{enemy.maxHp}
      </div>

      {/* Status effects */}
      {enemy.statuses.length > 0 && (
        <div className="flex gap-1 mt-1">
          {enemy.statuses.map((status, i) => (
            <span
              key={i}
              className="text-[8px] px-1 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/30"
            >
              {status.type} {status.stacks}
            </span>
          ))}
        </div>
      )}

      {/* Armor */}
      {enemy.buffs.armor > 0 && (
        <div className="absolute top-1 right-1 bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white border border-yellow-400/30">
          {enemy.buffs.armor}
        </div>
      )}
    </div>
  )
}
