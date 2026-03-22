import { useCombatStore } from '@stores/combatStore.ts'

const factionPortraitBorder: Record<string, string> = {
  might: 'border-red-600/60 from-red-900/30',
  wisdom: 'border-blue-600/60 from-blue-900/30',
  heart: 'border-amber-600/60 from-amber-900/30',
}

export default function HeroHUD() {
  const combat = useCombatStore((s) => s.combat)
  const heroDefinition = useCombatStore((s) => s.heroDefinition)
  const useHeroPower = useCombatStore((s) => s.useHeroPower)

  if (!combat || !heroDefinition) return null

  const { player } = combat
  const hpPercent = (player.hp / player.maxHp) * 100
  const hpColor = hpPercent > 50 ? 'from-green-500 to-green-700' : hpPercent > 25 ? 'from-yellow-500 to-yellow-700' : 'from-red-500 to-red-700'

  const canUseHeroPower =
    !player.heroPowerUsedThisTurn &&
    player.mana >= heroDefinition.heroPower.cost &&
    combat.phase === 'player_action'

  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-slate-800/80 to-slate-900/60 rounded-xl px-4 py-2.5 border border-white/5 im-card-frame backdrop-blur-sm">
      {/* Hero portrait */}
      <div
        className="flex flex-col items-center cursor-help"
        title={`${heroDefinition.passive.name}: ${heroDefinition.passive.description}`}
      >
        <div className={`w-10 h-10 rounded-full border-2 bg-gradient-to-b to-slate-900/60 flex items-center justify-center ${
          factionPortraitBorder[heroDefinition.faction] ?? 'border-slate-500/60 from-slate-800/30'
        }`}>
          <span className="text-xl">{'\uD83E\uDDB8'}</span>
        </div>
        <div className="text-[10px] font-bold text-slate-200 mt-0.5">{heroDefinition.name}</div>
        <div className="text-[8px] text-slate-500">{heroDefinition.title}</div>
      </div>

      {/* HP bar */}
      <div className="flex-1 max-w-[200px]">
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">HP</span>
          <span className="text-slate-200 font-bold text-[11px]">{player.hp}/{player.maxHp}</span>
        </div>
        <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
          <div
            className={`h-full bg-gradient-to-r ${hpColor} transition-all duration-500 rounded-full`}
            style={{ width: `${hpPercent}%` }}
          />
          {/* HP segment marks */}
          <div className="relative -mt-3.5 h-3.5 flex pointer-events-none">
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="absolute top-0 h-full w-px bg-black/20"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
        </div>
        {player.armor > 0 && (
          <div className="text-[10px] text-yellow-400 mt-0.5 font-semibold flex items-center gap-1">
            <span className="text-[8px]">{'\uD83D\uDEE1\uFE0F'}</span> {player.armor} armor
          </div>
        )}
      </div>

      {/* Mana gems */}
      <div className="flex flex-col items-center">
        <div className="text-[10px] text-slate-500 mb-1 uppercase font-semibold tracking-wider">Mana</div>
        <div className="flex gap-1">
          {Array.from({ length: player.maxMana }, (_, i) => (
            <div
              key={i}
              className={`w-4 h-5 im-mana-gem transition-all duration-200 ${
                i < player.mana
                  ? 'bg-gradient-to-b from-blue-400 to-blue-600 im-glow-blue'
                  : 'bg-slate-800 border border-slate-700/50'
              }`}
            />
          ))}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
          {player.mana}/{player.maxMana}
        </div>
      </div>

      {/* Hero Power */}
      <button
        onClick={() => {
          if (canUseHeroPower) {
            if (heroDefinition.heroPower.targetRequired) {
              const target = combat.enemies[0]
              if (target) useHeroPower(target.instanceId)
            } else {
              useHeroPower()
            }
          }
        }}
        title={`${heroDefinition.heroPower.name}: ${heroDefinition.heroPower.description} (${heroDefinition.heroPower.cost} mana)`}
        className={`
          px-3 py-2 rounded-lg text-xs font-semibold border transition-all
          ${canUseHeroPower
            ? 'bg-gradient-to-b from-purple-600 to-purple-800 border-purple-400/40 text-white hover:from-purple-500 hover:to-purple-700 cursor-pointer im-glow-purple'
            : 'bg-slate-800/60 border-slate-700/30 text-slate-600 cursor-not-allowed'}
        `}
      >
        <div className="font-bold">{heroDefinition.heroPower.name}</div>
        <div className="text-[9px] opacity-70 mt-0.5">{heroDefinition.heroPower.cost} mana</div>
      </button>

      {/* Equipped Gear */}
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }, (_, i) => {
          const gear = player.equippedGear[i]
          return (
            <div
              key={i}
              className={`w-8 h-8 rounded-md border flex items-center justify-center text-[10px] transition-all ${
                gear
                  ? 'bg-gradient-to-b from-slate-700 to-slate-800 border-amber-700/30 text-slate-200 im-card-frame'
                  : 'bg-slate-900/40 border-slate-700/20 text-slate-700'
              }`}
              title={gear ? `${gear.name}: ${gear.upside.description} / ${gear.downside.description}` : 'Empty gear slot'}
            >
              {gear ? '\u2699' : '\u00B7'}
            </div>
          )
        })}
      </div>
    </div>
  )
}
