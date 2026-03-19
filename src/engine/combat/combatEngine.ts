import type { Card, AllyCard, SpellCard, GearCard } from '@engine/types/card.ts'
import type {
  CombatState,
  AllyInstance,
  EnemyInstance,
  PlayerState,
} from '@engine/types/combat.ts'
import type { EnemyTemplate } from '@engine/types/enemy.ts'
import type { RunState } from '@engine/types/run.ts'
import { SeededRNG } from '../../utils/random.ts'
import { drawCardsWithRng, discardHand } from '../cards/deckManager.ts'
import {
  dealDamageToEnemy,
  healHero,
  healAlly,
  addArmorToHero,
} from './damageResolver.ts'
import {
  resolveStrike,
  resolveDeathblow,
  resolveEcho,
  applyStatusToEnemy,
  tickStatuses,
  removeDeadEnemies,
  removeDeadAllies,
} from './keywordResolver.ts'
import {
  advanceEnemyIntent,
  executeEnemyIntent,
} from '../encounters/enemyAI.ts'
import {
  applyGearStartOfTurn,
  applyGearEndOfTurn,
  getBonusDrawFromGear,
  getSpellCostModifier,
  getSpellDamageBonus,
} from '../cards/gearManager.ts'

let instanceCounter = 0
function nextInstanceId(): string {
  return `inst_${++instanceCounter}`
}

export function resetInstanceCounter(): void {
  instanceCounter = 0
}

export function createEnemyInstance(template: EnemyTemplate): EnemyInstance {
  return {
    instanceId: nextInstanceId(),
    enemyId: template.id,
    name: template.name,
    hp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    currentIntentIndex: 0,
    intents: template.intents,
    keywords: [...template.keywords],
    statuses: [],
    buffs: { attack: 0, armor: 0 },
  }
}

export function initializeCombat(
  runState: RunState,
  enemyTemplates: EnemyTemplate[],
  rng: SeededRNG,
): CombatState {
  const enemies = enemyTemplates.map(createEnemyInstance)

  // Separate deck into non-gear cards (gear is in inventory, not deck)
  const deckCards = runState.deck.filter((c) => c.type !== 'gear')
  const shuffledDeck = rng.shuffle(deckCards)

  const player: PlayerState = {
    heroId: runState.hero?.id ?? '',
    hp: runState.hp,
    maxHp: runState.maxHp,
    mana: 0,
    maxMana: 0,
    armor: 0,
    equippedGear: [...runState.equippedGear],
    gearInventory: [...runState.gearInventory],
    heroPowerUsedThisTurn: false,
    statuses: [],
  }

  const state: CombatState = {
    turn: 0,
    phase: 'turn_start',
    result: 'ongoing',
    player,
    enemies,
    allies: [],
    drawPile: shuffledDeck,
    hand: [],
    discardPile: [],
    graveyard: [],
    log: [],
  }

  return state
}

export function startTurn(state: CombatState, rng: SeededRNG): CombatState {
  if (state.result !== 'ongoing') return state

  const newTurn = state.turn + 1
  const maxMana = Math.min(newTurn, 8)

  let currentState: CombatState = {
    ...state,
    turn: newTurn,
    phase: 'turn_start',
    player: {
      ...state.player,
      mana: maxMana,
      maxMana: maxMana,
      armor: 0, // Armor resets each turn
      heroPowerUsedThisTurn: false,
    },
    allies: state.allies.map((a) => ({ ...a, hasAttackedThisTurn: false })),
  }

  // Apply gear start-of-turn effects
  currentState = applyGearStartOfTurn(currentState)
  if (currentState.result !== 'ongoing') return currentState

  // Tick status effects (burn, poison)
  currentState = tickStatuses(currentState)
  if (currentState.result !== 'ongoing') return currentState

  // Remove dead enemies/allies from status ticks
  const { state: afterEnemyDeath } = removeDeadEnemies(currentState)
  const { state: afterAllyDeath } = removeDeadAllies(afterEnemyDeath)
  currentState = afterAllyDeath

  // Check if all enemies died from status ticks
  if (currentState.enemies.length === 0) {
    return { ...currentState, result: 'victory', phase: 'combat_over' }
  }

  // Draw cards
  const handSize = 5 + getBonusDrawFromGear(currentState.player.equippedGear)
  currentState = drawCardsWithRng(currentState, handSize, rng)

  return { ...currentState, phase: 'player_action' }
}

export function getEffectiveCost(card: Card, state: CombatState): number {
  let cost = card.cost

  // Hero passive: Lira's spells cost -1, allies cost +1
  if (state.player.heroId === 'hero_lira') {
    if (card.type === 'spell') {
      cost = Math.max(0, cost - 1)
    } else if (card.type === 'ally') {
      cost += 1
    }
  }

  // Gear modifier: spells cost more
  if (card.type === 'spell') {
    cost += getSpellCostModifier(state.player.equippedGear)
  }

  return Math.max(0, cost)
}

export function canPlayCard(state: CombatState, card: Card): boolean {
  if (state.phase !== 'player_action') return false
  if (state.result !== 'ongoing') return false

  const cost = getEffectiveCost(card, state)
  if (state.player.mana < cost) return false

  // Check ally limit per turn (Mage's Focus gear)
  if (card.type === 'ally') {
    const limitGear = state.player.equippedGear.find(
      (g) => g.downside.type === 'limit_allies_per_turn',
    )
    if (limitGear) {
      // Count allies played this turn from log
      const alliesPlayedThisTurn = state.log.filter(
        (entry) =>
          entry.turn === state.turn &&
          entry.action === 'play_card' &&
          entry.description.includes('plays ally'),
      ).length
      if (alliesPlayedThisTurn >= limitGear.downside.value) return false
    }
  }

  // Max 4 allies on board
  if (card.type === 'ally' && state.allies.length >= 4) {
    return false // Would need to sacrifice one — handled separately
  }

  return true
}

export function playCard(
  state: CombatState,
  cardId: string,
  targetId?: string,
  _rng?: SeededRNG,
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
      currentState = playSpellCard(currentState, card as SpellCard, targetId)
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
    currentState = resolveDeathblow(currentState, deadAlly)
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

function playSpellCard(state: CombatState, card: SpellCard, targetId?: string): CombatState {
  let currentState = state
  const spellDamageBonus = getSpellDamageBonus(currentState.player.equippedGear)
  const effect = card.effect

  switch (effect.type) {
    case 'damage': {
      const damage = effect.value + spellDamageBonus
      if (card.targetType === 'all_enemies') {
        for (const enemy of [...currentState.enemies]) {
          if (enemy.hp > 0) {
            const { state: newState } = dealDamageToEnemy(
              currentState,
              enemy.instanceId,
              damage,
              card.name,
            )
            currentState = newState
          }
        }
        // Apply burn keyword if present
        if (card.keywords.includes('burn')) {
          for (const enemy of currentState.enemies) {
            if (enemy.hp > 0) {
              currentState = applyStatusToEnemy(currentState, enemy.instanceId, {
                type: 'burn',
                stacks: 1,
              })
            }
          }
        }
      } else if (targetId) {
        const { state: newState } = dealDamageToEnemy(
          currentState,
          targetId,
          damage,
          card.name,
        )
        currentState = newState
        // Apply burn
        if (card.keywords.includes('burn')) {
          currentState = applyStatusToEnemy(currentState, targetId, {
            type: 'burn',
            stacks: 2,
          })
        }
      }
      break
    }

    case 'heal': {
      if (card.targetType === 'self') {
        currentState = healHero(currentState, effect.value, card.name)
      } else if (card.targetType === 'single_ally' && targetId) {
        currentState = healAlly(currentState, targetId, effect.value)
      } else if (card.targetType === 'all_allies') {
        for (const ally of currentState.allies) {
          currentState = healAlly(currentState, ally.instanceId, effect.value)
        }
      }
      break
    }

    case 'draw': {
      // Draw will be done by caller if needed — mark in log
      break
    }

    case 'armor': {
      currentState = addArmorToHero(currentState, effect.value)
      break
    }

    case 'apply_status': {
      if (effect.statusType) {
        if (card.targetType === 'single_enemy' && targetId) {
          currentState = applyStatusToEnemy(currentState, targetId, {
            type: effect.statusType,
            stacks: effect.value,
          })
        } else if (card.targetType === 'all_allies') {
          for (const ally of currentState.allies) {
            const statuses = [...ally.statuses, { type: effect.statusType, stacks: effect.value }]
            const allyIndex = currentState.allies.findIndex(
              (a) => a.instanceId === ally.instanceId,
            )
            const allies = [...currentState.allies]
            allies[allyIndex] = { ...allies[allyIndex], statuses }
            currentState = { ...currentState, allies }
          }
        }
      }
      break
    }

    case 'buff_attack': {
      if (card.targetType === 'all_allies') {
        const allies = currentState.allies.map((a) => ({
          ...a,
          currentAttack: a.currentAttack + effect.value,
        }))
        currentState = { ...currentState, allies }
      } else if (card.targetType === 'single_ally' && targetId) {
        const allyIndex = currentState.allies.findIndex((a) => a.instanceId === targetId)
        if (allyIndex !== -1) {
          const allies = [...currentState.allies]
          allies[allyIndex] = {
            ...allies[allyIndex],
            currentAttack: allies[allyIndex].currentAttack + effect.value,
          }
          currentState = { ...currentState, allies }
        }
      }
      break
    }

    case 'buff_health': {
      if (card.targetType === 'single_ally' && targetId) {
        const allyIndex = currentState.allies.findIndex((a) => a.instanceId === targetId)
        if (allyIndex !== -1) {
          const allies = [...currentState.allies]
          allies[allyIndex] = {
            ...allies[allyIndex],
            currentHp: allies[allyIndex].currentHp + effect.value,
          }
          currentState = { ...currentState, allies }
        }
      }
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

function playGearCard(state: CombatState, card: GearCard): CombatState {
  const equippedGear = [...state.player.equippedGear]
  const gearInventory = state.player.gearInventory.filter((g) => g.id !== card.id)

  if (equippedGear.length < 4) {
    equippedGear.push(card)
  }
  // If at 4, would need UI to select replacement — for now skip

  return {
    ...state,
    player: { ...state.player, equippedGear, gearInventory },
  }
}

export function useHeroPower(
  state: CombatState,
  targetId?: string,
  heroDefinition?: { heroPower: { cost: number; effect: { type: string; value: number } } },
): CombatState {
  if (state.player.heroPowerUsedThisTurn) return state
  if (!heroDefinition) return state

  const cost = heroDefinition.heroPower.cost
  if (state.player.mana < cost) return state

  let currentState: CombatState = {
    ...state,
    player: {
      ...state.player,
      mana: state.player.mana - cost,
      heroPowerUsedThisTurn: true,
    },
  }

  const effect = heroDefinition.heroPower.effect

  switch (effect.type) {
    case 'damage': {
      if (targetId) {
        const { state: newState } = dealDamageToEnemy(
          currentState,
          targetId,
          effect.value,
          'Hero Power',
        )
        currentState = newState
      }
      break
    }
    case 'draw': {
      // Draw handled externally
      break
    }
    case 'buff_health': {
      if (targetId) {
        const allyIndex = currentState.allies.findIndex((a) => a.instanceId === targetId)
        if (allyIndex !== -1) {
          const allies = [...currentState.allies]
          allies[allyIndex] = {
            ...allies[allyIndex],
            currentHp: allies[allyIndex].currentHp + effect.value,
            statuses: [...allies[allyIndex].statuses, { type: 'ward', stacks: 1 }],
          }
          currentState = { ...currentState, allies }
        }
      }
      break
    }
    default:
      break
  }

  // Check for enemy deaths
  const { state: afterDeath } = removeDeadEnemies(currentState)
  currentState = afterDeath

  if (currentState.enemies.length === 0) {
    return { ...currentState, result: 'victory', phase: 'combat_over' }
  }

  return currentState
}

export function endPlayerTurn(state: CombatState): CombatState {
  if (state.phase !== 'player_action') return state

  let currentState = state

  // Resolve ally attacks
  for (const ally of currentState.allies) {
    if (ally.currentHp <= 0 || ally.hasAttackedThisTurn) continue
    if (currentState.enemies.length === 0) break

    // Auto-target: attack leftmost enemy
    const target = currentState.enemies[0]
    if (!target || target.hp <= 0) continue

    const { state: afterDamage } = dealDamageToEnemy(
      currentState,
      target.instanceId,
      ally.currentAttack,
      ally.card.name,
    )
    currentState = afterDamage

    // Resolve Strike
    currentState = resolveStrike(currentState, ally, target.instanceId)

    // Mark as attacked
    const allyIndex = currentState.allies.findIndex((a) => a.instanceId === ally.instanceId)
    if (allyIndex !== -1) {
      const allies = [...currentState.allies]
      allies[allyIndex] = { ...allies[allyIndex], hasAttackedThisTurn: true }
      currentState = { ...currentState, allies }
    }

    // Remove dead enemies after each attack
    const { state: afterRemove } = removeDeadEnemies(currentState)
    currentState = afterRemove
  }

  // Remove dead allies and resolve deathblows
  const { state: afterAllyDeath, deadAllies } = removeDeadAllies(currentState)
  currentState = afterAllyDeath
  for (const deadAlly of deadAllies) {
    currentState = resolveDeathblow(currentState, deadAlly)
  }

  // Check victory after ally attacks
  if (currentState.enemies.length === 0) {
    return { ...currentState, result: 'victory', phase: 'combat_over' }
  }

  // Apply gear end-of-turn effects
  currentState = applyGearEndOfTurn(currentState)

  // Orin's passive: heal lowest HP ally for 2
  if (currentState.player.heroId === 'hero_orin' && currentState.allies.length > 0) {
    const lowestAlly = [...currentState.allies].sort(
      (a, b) => a.currentHp - b.currentHp,
    )[0]
    if (lowestAlly) {
      currentState = healAlly(currentState, lowestAlly.instanceId, 2)
    }
  }

  // Discard remaining hand
  currentState = discardHand(currentState)

  return { ...currentState, phase: 'enemy_phase' }
}

export function executeEnemyPhase(state: CombatState): CombatState {
  if (state.phase !== 'enemy_phase') return state

  let currentState = state

  // Each enemy executes intent left to right
  for (const enemy of [...currentState.enemies]) {
    if (enemy.hp <= 0) continue

    // Get fresh reference in case state changed
    const currentEnemy = currentState.enemies.find((e) => e.instanceId === enemy.instanceId)
    if (!currentEnemy || currentEnemy.hp <= 0) continue

    currentState = executeEnemyIntent(currentState, currentEnemy)

    // Check hero death
    if (currentState.result === 'defeat') {
      return { ...currentState, phase: 'combat_over' }
    }

    // Remove dead allies and resolve deathblows
    const { state: afterAllyDeath, deadAllies } = removeDeadAllies(currentState)
    currentState = afterAllyDeath
    for (const deadAlly of deadAllies) {
      currentState = resolveDeathblow(currentState, deadAlly)
    }

    // Advance enemy intent
    const enemyIndex = currentState.enemies.findIndex(
      (e) => e.instanceId === currentEnemy.instanceId,
    )
    if (enemyIndex !== -1) {
      const enemies = [...currentState.enemies]
      enemies[enemyIndex] = advanceEnemyIntent(enemies[enemyIndex])
      currentState = { ...currentState, enemies }
    }
  }

  return { ...currentState, phase: 'turn_end' }
}

export function checkCombatEnd(state: CombatState): CombatState {
  if (state.enemies.length === 0 && state.result === 'ongoing') {
    return { ...state, result: 'victory', phase: 'combat_over' }
  }
  if (state.player.hp <= 0 && state.result === 'ongoing') {
    return { ...state, result: 'defeat', phase: 'combat_over' }
  }
  return state
}
