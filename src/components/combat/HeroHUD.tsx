import { useCombatStore } from '@stores/combatStore.ts'

export default function HeroHUD() {
  const combat = useCombatStore((s) => s.combat)
  const heroDefinition = useCombatStore((s) => s.heroDefinition)
  const useHeroPower = useCombatStore((s) => s.useHeroPower)
  const activateHeroPowerTargeting = useCombatStore((s) => s.activateHeroPowerTargeting)

  if (!combat || !heroDefinition) return null

  const { player } = combat
  const hpPercent = (player.hp / player.maxHp) * 100
  const hpColor = hpPercent > 50 ? 'bg-green-600' : hpPercent > 25 ? 'bg-yellow-600' : 'bg-red-600'

  const canUseHeroPower =
    !player.heroPowerUsedThisTurn &&
    player.mana >= heroDefinition.heroPower.cost &&
    combat.phase === 'player_action'

  return (
    <div className="flex items-center gap-4 bg-slate-800/60 rounded-lg px-4 py-2 border border-slate-700">
      {/* Hero info */}
      <div className="flex flex-col items-center">
        <div className="text-2xl">{'\uD83E\uDDB8'}</div>
        <div className="text-xs font-bold text-slate-200">{heroDefinition.name}</div>
        <div className="text-[10px] text-slate-400">{heroDefinition.title}</div>
      </div>

      {/* HP */}
      <div className="flex-1 max-w-[200px]">
        <div className="flex justify-between text-xs text-slate-300 mb-0.5">
          <span>HP</span>
          <span>{player.hp}/{player.maxHp}</span>
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${hpColor} transition-all duration-500`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        {player.armor > 0 && (
          <div className="text-[10px] text-yellow-400 mt-0.5">Armor: {player.armor}</div>
        )}
      </div>

      {/* Mana */}
      <div className="flex flex-col items-center">
        <div className="text-xs text-slate-400 mb-0.5">Mana</div>
        <div className="flex gap-0.5">
          {Array.from({ length: player.maxMana }, (_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border ${
                i < player.mana
                  ? 'bg-blue-500 border-blue-400'
                  : 'bg-slate-700 border-slate-600'
              } transition-colors duration-200`}
            />
          ))}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {player.mana}/{player.maxMana}
        </div>
      </div>

      {/* Hero Power */}
      <button
        onClick={() => {
          if (canUseHeroPower) {
            if (heroDefinition.heroPower.targetRequired) {
              activateHeroPowerTargeting()
            } else {
              useHeroPower()
            }
          }
        }}
        className={`
          px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
          ${canUseHeroPower
            ? 'bg-purple-700 border-purple-500 text-white hover:bg-purple-600 cursor-pointer'
            : 'bg-slate-700 border-slate-600 text-slate-500 cursor-not-allowed'}
        `}
      >
        <div>{heroDefinition.heroPower.name}</div>
        <div className="text-[9px] opacity-75">{heroDefinition.heroPower.cost} mana</div>
      </button>

      {/* Equipped Gear */}
      <div className="flex gap-1">
        {Array.from({ length: 4 }, (_, i) => {
          const gear = player.equippedGear[i]
          return (
            <div
              key={i}
              className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] ${
                gear
                  ? 'bg-slate-700 border-slate-500 text-slate-200'
                  : 'bg-slate-800 border-slate-700 text-slate-600'
              }`}
              title={gear ? `${gear.name}: ${gear.upside.description} / ${gear.downside.description}` : 'Empty gear slot'}
            >
              {gear ? '\u2699' : '-'}
            </div>
          )
        })}
      </div>
    </div>
  )
}
