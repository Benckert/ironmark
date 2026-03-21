import type { AllyCard, SpellCard, GearCard } from '@engine/types/card.ts'
import type {
  CombatState,
  AllyInstance,
} from '@engine/types/combat.ts'
import { SeededRNG } from '../../utils/random.ts'
import { drawCardsWithRng } from '../cards/deckManager.ts'
import {
  dealDamageToEnemy,
  healHero,
  healAlly,
  addArmorToHero,
} from './damageResolver.ts'
import {
  resolveDeathblow,
  resolveEcho,
  applyStatusToEnemy,
  removeDeadEnemies,
  removeDeadAllies,
} from './keywordResolver.ts'
import {
  getSpellDamageBonus,
} from '../cards/gearManager.ts'
import { nextInstanceId } from './combatEngine.ts'
import { canPlayCard, getEffectiveCost } from './combatEngine.ts'

export function playCard(
  state: CombatState,
  cardId: string,
  targetId?: string,
  rng?: SeededRNG,
): CombatState {
  const cardIndex = state.hand.findIndex((c) => c.id === cardId)
  if (cardIndex === -1) return state

  const card = state.hand[cardIndex]
  if (!canPlayCard(state, card)) return state

  const cost = getEffectiveCost(card, state)
  let currentState: CombatState = {
    ...state,
    player: { ...state.player, mana: state.player.mana - cost },
    hand: state.hand.filter((_, i) => i !== cardIndex),
  }

  switch (card.type) {
    case 'ally':
      currentState = playAllyCard(currentState, card as AllyCard)
      break
    case 'spell':
      currentState = playSpellCard(currentState, card as SpellCard, targetId, rng)
      break
    case 'gear':
      currentState = playGearCard(currentState, card as GearCard)
      break
  }

  // Log
  currentState = {
    ...currentState,
    log: [
      ...currentState.log,
      {
        turn: currentState.turn,
        action: 'play_card',
        source: 'Player',
        description: `Player plays ${card.type}: ${card.name}`,
      },
    ],
  }

  // Check for enemy deaths
  const { state: afterDeath } = removeDeadEnemies(currentState)
  currentState = afterDeath

  // Resolve deathblows for dead allies
  const { state: afterAllyDeath, deadAllies } = removeDeadAllies(currentState)
  currentState = afterAllyDeath
  for (const deadAlly of deadAllies) {
    currentState = resolveDeathblow(currentState, deadAlly, rng)
  }

  // Check victory
  if (currentState.enemies.length === 0) {
    return { ...currentState, result: 'victory', phase: 'combat_over' }
  }

  return currentState
}

function playAllyCard(state: CombatState, card: AllyCard): CombatState {
  const ally: AllyInstance = {
    instanceId: nextInstanceId(),
    card,
    currentHp: card.health,
    currentAttack: card.attack,
    statuses: card.keywords.includes('ward')
      ? [{ type: 'ward', stacks: 1 }]
      : [],
    hasAttackedThisTurn: false,
  }

  // Kael's passive: allies gain +1 attack this turn
  if (state.player.heroId === 'hero_kael') {
    ally.currentAttack += 1
  }

  // Gear: buff ally attack
  for (const gear of state.player.equippedGear) {
    if (gear.upside.type === 'buff_ally_attack') {
      ally.currentAttack += gear.upside.value
    }
    if (gear.downside.type === 'reduce_ally_health') {
      ally.currentHp = Math.max(1, ally.currentHp - gear.downside.value)
    }
    if (gear.upside.type === 'buff_ally_health') {
      ally.currentHp += gear.upside.value
    }
  }

  return {
    ...state,
    allies: [...state.allies, ally],
  }
}

function playSpellCard(
  state: CombatState,
  card: SpellCard,
  targetId?: string,
  rng?: SeededRNG,
): CombatState {
  let currentState = state
  const spellDamageBonus = getSpellDamageBonus(currentState.player.equippedGear)
  const effect = card.effect

  switch (effect.type) {
    case 'damage': {
      currentState = resolveSpellDamage(currentState, card, effect, spellDamageBonus, targetId)
      break
    }
    case 'heal': {
      currentState = resolveSpellHeal(currentState, card, effect, targetId)
      break
    }
    case 'draw': {
      if (rng) {
        currentState = drawCardsWithRng(currentState, effect.value, rng)
      }
      break
    }
    case 'armor': {
      currentState = addArmorToHero(currentState, effect.value)
      break
    }
    case 'apply_status': {
      currentState = resolveSpellStatus(currentState, card, effect)
      break
    }
    case 'buff_attack': {
      currentState = resolveSpellBuffAttack(currentState, card, effect, targetId)
      break
    }
    case 'buff_health': {
      currentState = resolveSpellBuffHealth(currentState, targetId, effect)
      break
    }
    default:
      break
  }

  // Move spell to discard
  currentState = {
    ...currentState,
    discardPile: [...currentState.discardPile, card],
  }

  // Resolve Echo
  if (card.keywords.includes('echo')) {
    currentState = resolveEcho(currentState, card)
  }

  return currentState
}

function resolveSpellDamage(
  state: CombatState,
  card: SpellCard,
  effect: SpellCard['effect'],
  spellDamageBonus: number,
  targetId?: string,
): CombatState {
  let currentState = state
  const damage = effect.value + spellDamageBonus

  if (card.targetType === 'all_enemies') {
    for (const enemy of [...currentState.enemies]) {
      if (enemy.hp > 0) {
        const { state: newState } = dealDamageToEnemy(currentState, enemy.instanceId, damage, card.name)
        currentState = newState
      }
    }
    if (card.keywords.includes('burn')) {
      for (const enemy of currentState.enemies) {
        if (enemy.hp > 0) {
          currentState = applyStatusToEnemy(currentState, enemy.instanceId, { type: 'burn', stacks: 1 })
        }
      }
    }
  } else if (targetId) {
    const { state: newState } = dealDamageToEnemy(currentState, targetId, damage, card.name)
    currentState = newState
    if (card.keywords.includes('burn')) {
      currentState = applyStatusToEnemy(currentState, targetId, { type: 'burn', stacks: 2 })
    }
  }

  return currentState
}

function resolveSpellHeal(
  state: CombatState,
  card: SpellCard,
  effect: SpellCard['effect'],
  targetId?: string,
): CombatState {
  let currentState = state

  if (card.targetType === 'self') {
    currentState = healHero(currentState, effect.value, card.name)
  } else if (card.targetType === 'single_ally' && targetId) {
    currentState = healAlly(currentState, targetId, effect.value)
  } else if (card.targetType === 'all_allies') {
    for (const ally of currentState.allies) {
      currentState = healAlly(currentState, ally.instanceId, effect.value)
    }
  }

  return currentState
}

function resolveSpellStatus(
  state: CombatState,
  card: SpellCard,
  effect: SpellCard['effect'],
): CombatState {
  let currentState = state

  if (!effect.statusType) return currentState

  if (card.targetType === 'single_enemy') {
    // Note: targetId not passed here — handled by caller's single_enemy path
    // This function handles the all_allies case for apply_status
  }

  if (card.targetType === 'all_allies') {
    for (const ally of currentState.allies) {
      const statuses = [...ally.statuses, { type: effect.statusType, stacks: effect.value }]
      const allyIndex = currentState.allies.findIndex((a) => a.instanceId === ally.instanceId)
      const allies = [...currentState.allies]
      allies[allyIndex] = { ...allies[allyIndex], statuses }
      currentState = { ...currentState, allies }
    }
  }

  return currentState
}

function resolveSpellBuffAttack(
  state: CombatState,
  card: SpellCard,
  effect: SpellCard['effect'],
  targetId?: string,
): CombatState {
  if (card.targetType === 'all_allies') {
    const allies = state.allies.map((a) => ({
      ...a,
      currentAttack: a.currentAttack + effect.value,
    }))
    return { ...state, allies }
  }

  if (card.targetType === 'single_ally' && targetId) {
    const allyIndex = state.allies.findIndex((a) => a.instanceId === targetId)
    if (allyIndex !== -1) {
      const allies = [...state.allies]
      allies[allyIndex] = {
        ...allies[allyIndex],
        currentAttack: allies[allyIndex].currentAttack + effect.value,
      }
      return { ...state, allies }
    }
  }

  return state
}

function resolveSpellBuffHealth(
  state: CombatState,
  targetId: string | undefined,
  effect: SpellCard['effect'],
): CombatState {
  if (!targetId) return state

  const allyIndex = state.allies.findIndex((a) => a.instanceId === targetId)
  if (allyIndex === -1) return state

  const allies = [...state.allies]
  allies[allyIndex] = {
    ...allies[allyIndex],
    currentHp: allies[allyIndex].currentHp + effect.value,
  }
  return { ...state, allies }
}

function playGearCard(state: CombatState, card: GearCard): CombatState {
  const equippedGear = [...state.player.equippedGear]
  const gearInventory = state.player.gearInventory.filter((g) => g.id !== card.id)

  if (equippedGear.length < 4) {
    equippedGear.push(card)
  }

  return {
    ...state,
    player: { ...state.player, equippedGear, gearInventory },
  }
}
