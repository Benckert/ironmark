import type { GearCard } from '@engine/types/card.ts'
import type { CombatState } from '@engine/types/combat.ts'

export function equipGear(
  equippedGear: readonly GearCard[],
  gearInventory: readonly GearCard[],
  gearCard: GearCard,
  replaceIndex?: number,
): { equippedGear: GearCard[]; gearInventory: GearCard[] } {
  const newInventory = gearInventory.filter((g) => g.id !== gearCard.id)
  let newEquipped = [...equippedGear]

  if (newEquipped.length >= 4 && replaceIndex !== undefined) {
    // Replace gear at index (old gear is voided, not returned to inventory)
    newEquipped[replaceIndex] = gearCard
  } else if (newEquipped.length < 4) {
    newEquipped.push(gearCard)
  } else {
    // Can't equip without replacing
    return { equippedGear: [...equippedGear], gearInventory: [...gearInventory] }
  }

  return { equippedGear: newEquipped, gearInventory: newInventory }
}

export function getGearModifier(
  equippedGear: readonly GearCard[],
  modifierType: string,
  side: 'upside' | 'downside' | 'both' = 'both',
): number {
  let total = 0
  for (const gear of equippedGear) {
    if (side !== 'downside' && gear.upside.type === modifierType) {
      total += gear.upside.value
    }
    if (side !== 'upside' && gear.downside.type === modifierType) {
      total += gear.downside.value
    }
  }
  return total
}

export function applyGearStartOfTurn(state: CombatState): CombatState {
  let currentState = state

  for (const gear of currentState.player.equippedGear) {
    // Upside start_of_turn triggers
    if (gear.upside.trigger === 'start_of_turn') {
      if (gear.upside.type === 'bonus_draw') {
        // Extra draw handled by combat engine
      }
    }

    // Downside start_of_turn triggers
    if (gear.downside.trigger === 'start_of_turn') {
      if (gear.downside.type === 'self_damage') {
        const newHp = Math.max(0, currentState.player.hp - gear.downside.value)
        currentState = {
          ...currentState,
          player: {
            ...currentState.player,
            hp: newHp,
          },
          result: newHp <= 0 ? 'defeat' : currentState.result,
        }
      }
    }
  }

  return currentState
}

export function applyGearEndOfTurn(state: CombatState): CombatState {
  let currentState = state

  for (const gear of currentState.player.equippedGear) {
    if (gear.upside.trigger === 'end_of_turn') {
      if (gear.upside.type === 'heal_per_turn') {
        const newHp = Math.min(
          currentState.player.maxHp,
          currentState.player.hp + gear.upside.value,
        )
        currentState = {
          ...currentState,
          player: { ...currentState.player, hp: newHp },
        }
      }
    }
  }

  return currentState
}

export function getBonusDrawFromGear(equippedGear: readonly GearCard[]): number {
  let bonus = 0
  for (const gear of equippedGear) {
    if (gear.upside.trigger === 'start_of_turn' && gear.upside.type === 'bonus_draw') {
      bonus += gear.upside.value
    }
  }
  return bonus
}

export function getSpellCostModifier(equippedGear: readonly GearCard[]): number {
  let modifier = 0
  for (const gear of equippedGear) {
    if (gear.downside.type === 'increase_spell_cost') {
      modifier += gear.downside.value
    }
  }
  return modifier
}

export function getSpellDamageBonus(equippedGear: readonly GearCard[]): number {
  let bonus = 0
  for (const gear of equippedGear) {
    if (gear.upside.type === 'buff_spell_damage') {
      bonus += gear.upside.value
    }
  }
  return bonus
}
