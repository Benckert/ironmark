import type { CombatState } from '@engine/types/combat.ts'

export interface DamageResult {
  actualDamage: number
  targetDied: boolean
}

export function dealDamageToEnemy(
  state: CombatState,
  enemyInstanceId: string,
  amount: number,
  source: string,
): { state: CombatState; result: DamageResult } {
  const enemyIndex = state.enemies.findIndex((e) => e.instanceId === enemyInstanceId)
  if (enemyIndex === -1) return { state, result: { actualDamage: 0, targetDied: false } }

  const enemy = state.enemies[enemyIndex]
  let damage = amount

  // Reduce by armor
  if (enemy.buffs.armor > 0) {
    const armorAbsorbed = Math.min(damage, enemy.buffs.armor)
    damage -= armorAbsorbed
    const newArmor = enemy.buffs.armor - armorAbsorbed
    const updatedEnemy = { ...enemy, buffs: { ...enemy.buffs, armor: newArmor } }
    const enemies = [...state.enemies]
    enemies[enemyIndex] = updatedEnemy
    state = { ...state, enemies }
  }

  // Check Ward
  const wardIndex = enemy.statuses.findIndex((s) => s.type === 'ward')
  if (wardIndex !== -1 && damage > 0) {
    const statuses = [...enemy.statuses]
    statuses.splice(wardIndex, 1)
    const enemies = [...state.enemies]
    enemies[enemyIndex] = { ...enemies[enemyIndex], statuses }
    return {
      state: { ...state, enemies },
      result: { actualDamage: 0, targetDied: false },
    }
  }

  const newHp = Math.max(0, state.enemies[enemyIndex].hp - damage)
  const targetDied = newHp <= 0
  const enemies = [...state.enemies]
  enemies[enemyIndex] = { ...enemies[enemyIndex], hp: newHp }

  const log = [
    ...state.log,
    {
      turn: state.turn,
      action: 'play_card' as const,
      source,
      target: enemy.name,
      value: damage,
      description: `${source} deals ${damage} damage to ${enemy.name}`,
    },
  ]

  return {
    state: { ...state, enemies, log },
    result: { actualDamage: damage, targetDied },
  }
}

export function dealDamageToHero(
  state: CombatState,
  amount: number,
  source: string,
): { state: CombatState; result: DamageResult } {
  let damage = amount

  // Apply gear modifiers that increase damage taken
  for (const gear of state.player.equippedGear) {
    if (gear.downside.type === 'increase_damage_taken') {
      damage += gear.downside.value
    }
  }

  // Reduce by armor
  if (state.player.armor > 0) {
    const armorAbsorbed = Math.min(damage, state.player.armor)
    damage -= armorAbsorbed
    state = {
      ...state,
      player: { ...state.player, armor: state.player.armor - armorAbsorbed },
    }
  }

  const newHp = Math.max(0, state.player.hp - damage)
  const targetDied = newHp <= 0

  const log = [
    ...state.log,
    {
      turn: state.turn,
      action: 'enemy_action' as const,
      source,
      target: 'Hero',
      value: damage,
      description: `${source} deals ${damage} damage to Hero`,
    },
  ]

  return {
    state: {
      ...state,
      player: { ...state.player, hp: newHp },
      log,
      result: targetDied ? 'defeat' : state.result,
    },
    result: { actualDamage: damage, targetDied },
  }
}

export function dealDamageToAlly(
  state: CombatState,
  allyInstanceId: string,
  amount: number,
  _source: string,
): { state: CombatState; result: DamageResult } {
  const allyIndex = state.allies.findIndex((a) => a.instanceId === allyInstanceId)
  if (allyIndex === -1) return { state, result: { actualDamage: 0, targetDied: false } }

  const ally = state.allies[allyIndex]
  let damage = amount

  // Check Ward
  const wardIndex = ally.statuses.findIndex((s) => s.type === 'ward')
  if (wardIndex !== -1 && damage > 0) {
    const statuses = [...ally.statuses]
    statuses.splice(wardIndex, 1)
    const allies = [...state.allies]
    allies[allyIndex] = { ...allies[allyIndex], statuses }
    return {
      state: { ...state, allies },
      result: { actualDamage: 0, targetDied: false },
    }
  }

  // Check Fury
  const hasFury = ally.card.keywords.includes('fury')

  const newHp = Math.max(0, ally.currentHp - damage)
  const targetDied = newHp <= 0
  const allies = [...state.allies]
  allies[allyIndex] = {
    ...allies[allyIndex],
    currentHp: newHp,
    currentAttack: hasFury ? ally.currentAttack + 1 : ally.currentAttack,
  }

  return {
    state: { ...state, allies },
    result: { actualDamage: damage, targetDied },
  }
}

export function healHero(
  state: CombatState,
  amount: number,
  source: string,
): CombatState {
  let heal = amount

  // Apply gear modifiers that reduce healing
  for (const gear of state.player.equippedGear) {
    if (gear.downside.type === 'modify_healing') {
      const reduction = Math.abs(gear.downside.value) / 100
      heal = Math.floor(heal * (1 - reduction))
    }
  }

  const newHp = Math.min(state.player.maxHp, state.player.hp + heal)
  const actualHeal = newHp - state.player.hp

  const log = [
    ...state.log,
    {
      turn: state.turn,
      action: 'play_card' as const,
      source,
      target: 'Hero',
      value: actualHeal,
      description: `${source} heals Hero for ${actualHeal}`,
    },
  ]

  return {
    ...state,
    player: { ...state.player, hp: newHp },
    log,
  }
}

export function healAlly(
  state: CombatState,
  allyInstanceId: string,
  amount: number,
): CombatState {
  const allyIndex = state.allies.findIndex((a) => a.instanceId === allyInstanceId)
  if (allyIndex === -1) return state

  const ally = state.allies[allyIndex]
  const maxHp = ally.card.health
  const newHp = Math.min(maxHp, ally.currentHp + amount)
  const allies = [...state.allies]
  allies[allyIndex] = { ...allies[allyIndex], currentHp: newHp }

  return { ...state, allies }
}

export function addArmorToHero(state: CombatState, amount: number): CombatState {
  return {
    ...state,
    player: { ...state.player, armor: state.player.armor + amount },
  }
}
