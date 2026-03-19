import type { Card as CardType, AllyCard, SpellCard, GearCard } from '@engine/types/card.ts'

interface CardProps {
  card: CardType
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  isPlayable?: boolean
  isSelected?: boolean
  showCost?: number
}

const rarityBorderColor = {
  common: 'border-gray-400',
  uncommon: 'border-blue-400',
  rare: 'border-amber-400',
}

const rarityGlow = {
  common: '',
  uncommon: 'shadow-blue-400/30',
  rare: 'shadow-amber-400/50',
}

const factionColor = {
  might: 'bg-red-900/40',
  wisdom: 'bg-blue-900/40',
  heart: 'bg-amber-900/40',
  neutral: 'bg-gray-800/40',
}

const factionAccent = {
  might: 'text-red-400',
  wisdom: 'text-blue-400',
  heart: 'text-amber-400',
  neutral: 'text-gray-400',
}

const sizeClasses = {
  small: 'w-20 h-28 text-[9px]',
  medium: 'w-28 h-40 text-[11px]',
  large: 'w-36 h-52 text-xs',
}

export default function Card({ card, size = 'medium', onClick, isPlayable = true, isSelected = false, showCost }: CardProps) {
  const displayCost = showCost ?? card.cost

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative rounded-lg border-2 ${rarityBorderColor[card.rarity]}
        ${factionColor[card.faction]}
        ${sizeClasses[size]}
        ${isPlayable ? 'cursor-pointer hover:scale-105 hover:-translate-y-2' : 'opacity-50 cursor-not-allowed'}
        ${isSelected ? 'ring-2 ring-white scale-105 -translate-y-3' : ''}
        ${card.rarity !== 'common' ? `shadow-lg ${rarityGlow[card.rarity]}` : ''}
        transition-all duration-200 flex flex-col p-1.5 select-none overflow-hidden
      `}
    >
      {/* Mana cost */}
      <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center text-white font-bold text-xs z-10">
        {displayCost}
      </div>

      {/* Card name */}
      <div className={`text-center font-semibold text-white mt-3 mb-1 truncate ${factionAccent[card.faction]}`}>
        {card.name}
      </div>

      {/* Card type + faction icon area */}
      <div className={`flex-1 rounded ${factionColor[card.faction]} flex items-center justify-center mb-1`}>
        {card.type === 'ally' && <AllyStats card={card as AllyCard} />}
        {card.type === 'spell' && <SpellInfo card={card as SpellCard} />}
        {card.type === 'gear' && <GearInfo card={card as GearCard} />}
      </div>

      {/* Keywords */}
      {card.keywords.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center">
          {card.keywords.map((kw) => (
            <span
              key={kw}
              className="px-1 py-0 rounded text-[8px] bg-slate-700 text-slate-300 capitalize"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Upgraded indicator */}
      {card.upgraded && (
        <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-bl text-[8px] text-white flex items-center justify-center font-bold">
          +
        </div>
      )}
    </div>
  )
}

function AllyStats({ card }: { card: AllyCard }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-2xl">&#9876;</div>
      <div className="flex gap-2 text-sm font-bold">
        <span className="text-red-400">{card.attack}&#9876;</span>
        <span className="text-green-400">{card.health}&#10084;</span>
      </div>
    </div>
  )
}

function SpellInfo({ card }: { card: SpellCard }) {
  const effectText = getEffectText(card)
  return (
    <div className="text-center px-1">
      <div className="text-lg">&#10040;</div>
      <div className="text-slate-300 leading-tight">{effectText}</div>
    </div>
  )
}

function GearInfo({ card }: { card: GearCard }) {
  return (
    <div className="text-center px-1 space-y-0.5">
      <div className="text-lg">&#9881;</div>
      <div className="text-green-400 leading-tight text-[9px]">{card.upside.description}</div>
      <div className="text-red-400 leading-tight text-[9px]">{card.downside.description}</div>
    </div>
  )
}

function getEffectText(card: SpellCard): string {
  const { effect, targetType } = card
  const targetMap: Record<string, string> = {
    single_enemy: 'enemy',
    all_enemies: 'all enemies',
    single_ally: 'ally',
    self: 'self',
    all_allies: 'all allies',
    random_enemy: 'random enemy',
  }
  const target = targetMap[targetType] || ''

  switch (effect.type) {
    case 'damage':
      return `Deal ${effect.value} dmg to ${target}`
    case 'heal':
      return `Heal ${effect.value} to ${target}`
    case 'draw':
      return `Draw ${effect.value} card${effect.value > 1 ? 's' : ''}`
    case 'armor':
      return `Gain ${effect.value} armor`
    case 'apply_status':
      return `Apply ${effect.statusType} ${effect.value} to ${target}`
    case 'buff_attack':
      return `+${effect.value} Attack to ${target}`
    case 'buff_health':
      return `+${effect.value} Health to ${target}`
    case 'summon':
      return `Summon a unit`
    default:
      return effect.type
  }
}
