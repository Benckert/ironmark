import type { Card as CardType, AllyCard, SpellCard, GearCard, Keyword } from '@engine/types/card.ts'

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

interface CardProps {
  card: CardType
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  isPlayable?: boolean
  isSelected?: boolean
  showCost?: number
}

const rarityBorder = {
  common: 'border-slate-500/60',
  uncommon: 'border-blue-400/70',
  rare: 'border-amber-400/80',
}

const rarityEffect = {
  common: '',
  uncommon: 'im-pulse-blue',
  rare: 'im-shimmer-gold',
}

const factionBg = {
  might: 'bg-red-950/50',
  wisdom: 'bg-blue-950/50',
  heart: 'bg-amber-950/40',
  neutral: 'bg-slate-900/50',
}

const factionAccent = {
  might: 'text-red-300',
  wisdom: 'text-blue-300',
  heart: 'text-amber-300',
  neutral: 'text-slate-300',
}

const factionArt = {
  might: 'im-art-might',
  wisdom: 'im-art-wisdom',
  heart: 'im-art-heart',
  neutral: 'im-art-neutral',
}

const sizeClasses = {
  small: 'w-20 h-28 text-[9px]',
  medium: 'w-28 h-40 text-[11px]',
  large: 'w-36 h-52 text-xs',
}

const artHeight = {
  small: 'h-8',
  medium: 'h-14',
  large: 'h-20',
}

const manaSize = {
  small: 'w-5 h-5 text-[9px]',
  medium: 'w-6 h-7 text-[10px]',
  large: 'w-7 h-8 text-xs',
}

export default function Card({ card, size = 'medium', onClick, isPlayable = true, isSelected = false, showCost }: CardProps) {
  const displayCost = showCost ?? card.cost

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${card.name}, ${card.type} card, cost ${displayCost}`}
      aria-pressed={isSelected}
      onClick={isPlayable ? onClick : undefined}
      onKeyDown={isPlayable && onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      } : undefined}
      className={`
        relative rounded-lg border ${rarityBorder[card.rarity]}
        ${factionBg[card.faction]}
        ${sizeClasses[size]}
        im-card-frame
        ${rarityEffect[card.rarity]}
        ${isPlayable ? 'cursor-pointer hover:scale-105 hover:-translate-y-2' : 'opacity-50 cursor-not-allowed'}
        ${isSelected ? 'ring-2 ring-amber-300/80 scale-105 -translate-y-3' : ''}
        transition-all duration-200 flex flex-col select-none overflow-hidden
        focus:outline-2 focus:outline-amber-400 focus:outline-offset-2
      `}
    >
      {/* Inner frame border */}
      <div className="absolute inset-[2px] rounded-md border border-white/5 pointer-events-none z-0" />

      {/* Mana cost gem */}
      <div className={`absolute -top-0.5 -left-0.5 ${manaSize[size]} im-mana-gem bg-gradient-to-b from-blue-400 to-blue-700 flex items-center justify-center text-white font-bold z-10`}>
        {displayCost}
      </div>

      {/* Card name banner */}
      <div className="relative z-[1] px-1.5 pt-3 pb-0.5">
        <div
          className={`text-center font-bold leading-tight ${factionAccent[card.faction]} ${
            card.name.length > 14 ? 'text-[7px]' : size === 'small' ? 'text-[8px]' : ''
          }`}
          title={card.name}
          style={{ wordBreak: 'break-word', lineHeight: '1.15', maxHeight: '2.2em', overflow: 'hidden' }}
        >
          {card.name}
        </div>
      </div>

      {/* Art panel */}
      <div className={`relative mx-1 ${artHeight[size]} rounded overflow-hidden`}>
        <div className={`absolute inset-0 ${factionArt[card.faction]} opacity-80`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <CardArtIcon card={card} size={size} />
        </div>
        {/* Art overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Card content area */}
      <div className="relative z-[1] flex-1 flex items-center justify-center px-1 py-0.5">
        {card.type === 'ally' && <AllyStats card={card as AllyCard} size={size} />}
        {card.type === 'spell' && <SpellInfo card={card as SpellCard} size={size} />}
        {card.type === 'gear' && <GearInfo card={card as GearCard} size={size} />}
      </div>

      {/* Keywords */}
      {card.keywords.length > 0 && (
        <div className="relative z-[1] flex flex-wrap gap-0.5 justify-center px-1 pb-1">
          {card.keywords.map((kw) => (
            <span
              key={kw}
              className={`px-1 py-0 rounded text-[7px] capitalize cursor-help border
                ${factionKeywordStyle(card.faction)}`}
              title={keywordDescriptions[kw] ?? kw}
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Upgraded indicator */}
      {card.upgraded && (
        <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-bl text-[8px] text-white flex items-center justify-center font-bold z-10">
          +
        </div>
      )}
    </div>
  )
}

function factionKeywordStyle(faction: string): string {
  const styles: Record<string, string> = {
    might: 'bg-red-900/40 text-red-300/80 border-red-700/30',
    wisdom: 'bg-blue-900/40 text-blue-300/80 border-blue-700/30',
    heart: 'bg-amber-900/40 text-amber-300/80 border-amber-700/30',
    neutral: 'bg-slate-800/60 text-slate-400 border-slate-600/30',
  }
  return styles[faction] ?? styles.neutral
}

function CardArtIcon({ card, size }: { card: CardType; size: string }) {
  const iconSize = size === 'small' ? 'text-lg' : size === 'medium' ? 'text-2xl' : 'text-3xl'

  if (card.type === 'ally') {
    return (
      <div className={`${iconSize} drop-shadow-lg`}>
        {card.faction === 'might' ? '\u2694\uFE0F' : card.faction === 'wisdom' ? '\uD83D\uDD2E' : card.faction === 'heart' ? '\uD83D\uDEE1\uFE0F' : '\u2726'}
      </div>
    )
  }
  if (card.type === 'spell') {
    return (
      <div className={`${iconSize} drop-shadow-lg`}>
        {card.faction === 'might' ? '\uD83D\uDD25' : card.faction === 'wisdom' ? '\u2744\uFE0F' : card.faction === 'heart' ? '\u2728' : '\uD83D\uDCA0'}
      </div>
    )
  }
  return <div className={`${iconSize} drop-shadow-lg`}>{'\u2699\uFE0F'}</div>
}

function AllyStats({ card, size }: { card: AllyCard; size: string }) {
  const textSize = size === 'small' ? 'text-[10px]' : 'text-sm'
  const labelSize = size === 'small' ? 'text-[7px]' : 'text-[9px]'

  return (
    <div className="flex gap-3 items-center">
      <div className="flex flex-col items-center">
        <span className={`${textSize} font-bold text-red-400`}>{card.attack}</span>
        <span className={`${labelSize} text-red-400/60 uppercase`}>atk</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex flex-col items-center">
        <span className={`${textSize} font-bold text-green-400`}>{card.health}</span>
        <span className={`${labelSize} text-green-400/60 uppercase`}>hp</span>
      </div>
    </div>
  )
}

function SpellInfo({ card, size }: { card: SpellCard; size: string }) {
  const effectText = getEffectText(card)
  const textSize = size === 'small' ? 'text-[8px]' : 'text-[10px]'
  return (
    <div className={`text-center px-1 ${textSize} text-slate-300/90 leading-tight`}>
      {effectText}
    </div>
  )
}

function GearInfo({ card, size }: { card: GearCard; size: string }) {
  const textSize = size === 'small' ? 'text-[7px]' : 'text-[9px]'
  return (
    <div className={`text-center px-1 space-y-0.5 ${textSize}`}>
      <div className="text-green-400/90 leading-tight">{card.upside.description}</div>
      <div className="text-red-400/80 leading-tight">{card.downside.description}</div>
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
