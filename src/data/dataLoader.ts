import type { Card, AllyCard, SpellCard, GearCard } from '@engine/types/card.ts'
import type { EnemyTemplate } from '@engine/types/enemy.ts'
import type { HeroDefinition } from '@engine/types/hero.ts'
import type { EventDefinition } from '@engine/types/event.ts'

import mightCards from './cards/might.json'
import wisdomCards from './cards/wisdom.json'
import heartCards from './cards/heart.json'
import neutralCards from './cards/neutral.json'
import allGear from './gear/allGear.json'
import stage1Enemies from './enemies/stage1.json'
import bossesData from './enemies/bosses.json'
import heroesData from './heroes/heroes.json'
import stage1Events from './events/stage1Events.json'

const allCards: Card[] = [
  ...(mightCards as Card[]),
  ...(wisdomCards as Card[]),
  ...(heartCards as Card[]),
  ...(neutralCards as Card[]),
]

const allGearCards: GearCard[] = allGear as GearCard[]

const allEnemies: EnemyTemplate[] = stage1Enemies as EnemyTemplate[]
const allBosses = bossesData as (EnemyTemplate & { passive?: { name: string; description: string }; phase2?: { hpThreshold: number; intents: EnemyTemplate['intents'] } })[]

const heroes: HeroDefinition[] = heroesData as HeroDefinition[]
const events: EventDefinition[] = stage1Events as EventDefinition[]

// Card lookup maps
const cardMap = new Map<string, Card>()
for (const card of allCards) {
  cardMap.set(card.id, card)
}

const gearMap = new Map<string, GearCard>()
for (const gear of allGearCards) {
  gearMap.set(gear.id, gear)
}

const enemyMap = new Map<string, EnemyTemplate>()
for (const enemy of allEnemies) {
  enemyMap.set(enemy.id, enemy)
}
for (const boss of allBosses) {
  enemyMap.set(boss.id, boss)
}

const heroMap = new Map<string, HeroDefinition>()
for (const hero of heroes) {
  heroMap.set(hero.id, hero)
}

const eventMap = new Map<string, EventDefinition>()
for (const event of events) {
  eventMap.set(event.id, event)
}

export function getCardById(id: string): Card | undefined {
  return cardMap.get(id)
}

export function getGearById(id: string): GearCard | undefined {
  return gearMap.get(id)
}

export function getEnemyById(id: string): EnemyTemplate | undefined {
  return enemyMap.get(id)
}

export function getHeroById(id: string): HeroDefinition | undefined {
  return heroMap.get(id)
}

export function getEventById(id: string): EventDefinition | undefined {
  return eventMap.get(id)
}

export function getAllCards(): Card[] {
  return allCards
}

export function getAllGear(): GearCard[] {
  return allGearCards
}

export function getAllEnemies(): EnemyTemplate[] {
  return allEnemies
}

export function getAllBosses() {
  return allBosses
}

export function getAllHeroes(): HeroDefinition[] {
  return heroes
}

export function getAllEvents(): EventDefinition[] {
  return events
}

export function getCardsByFaction(faction: string): Card[] {
  return allCards.filter((card) => card.faction === faction)
}

export function getCardsByType(type: string): Card[] {
  return allCards.filter((card) => card.type === type)
}

export function getCardsByRarity(rarity: string): Card[] {
  return allCards.filter((card) => card.rarity === rarity)
}

export function getEnemiesByTier(tier: 1 | 2 | 3): EnemyTemplate[] {
  return allEnemies.filter((enemy) => enemy.tier === tier)
}

export function getStarterDeck(heroId: string): Card[] {
  const hero = getHeroById(heroId)
  if (!hero) return []
  return hero.starterDeckIds
    .map((id) => {
      const card = getCardById(id)
      if (!card) return getGearById(id)
      return card
    })
    .filter((card): card is Card => card !== undefined)
}

export function getAllyCards(): AllyCard[] {
  return allCards.filter((card): card is AllyCard => card.type === 'ally')
}

export function getSpellCards(): SpellCard[] {
  return allCards.filter((card): card is SpellCard => card.type === 'spell')
}

// Validation
export function validateData(): string[] {
  const errors: string[] = []

  // Check unique IDs
  const cardIds = new Set<string>()
  for (const card of [...allCards, ...allGearCards]) {
    if (cardIds.has(card.id)) {
      errors.push(`Duplicate card ID: ${card.id}`)
    }
    cardIds.add(card.id)
  }

  // Check gear has upside and downside
  for (const gear of allGearCards) {
    if (!gear.upside) {
      errors.push(`Gear ${gear.id} missing upside`)
    }
    if (!gear.downside) {
      errors.push(`Gear ${gear.id} missing downside`)
    }
  }

  // Check card costs
  for (const card of [...allCards, ...allGearCards]) {
    if (card.cost < 0 || card.cost > 8) {
      errors.push(`Card ${card.id} has invalid cost: ${card.cost}`)
    }
  }

  // Check enemy HP
  for (const enemy of [...allEnemies, ...allBosses]) {
    if (enemy.hp <= 0) {
      errors.push(`Enemy ${enemy.id} has invalid HP: ${enemy.hp}`)
    }
  }

  // Check hero starter decks
  for (const hero of heroes) {
    if (hero.starterDeckIds.length !== 10) {
      errors.push(`Hero ${hero.id} starter deck has ${hero.starterDeckIds.length} cards (expected 10)`)
    }
    for (const cardId of hero.starterDeckIds) {
      if (!cardMap.has(cardId) && !gearMap.has(cardId)) {
        errors.push(`Hero ${hero.id} references missing card: ${cardId}`)
      }
    }
  }

  // Check keywords are valid
  const validKeywords = new Set([
    'strike', 'echo', 'blessing', 'ward', 'taunt',
    'deathblow', 'burn', 'poison', 'fury',
  ])
  for (const card of [...allCards, ...allGearCards]) {
    for (const keyword of card.keywords) {
      if (!validKeywords.has(keyword)) {
        errors.push(`Card ${card.id} has invalid keyword: ${keyword}`)
      }
    }
  }

  return errors
}
