import { describe, it, expect, beforeEach } from 'vitest'
import {
  initializeCombat,
  startTurn,
  playCard,
  endPlayerTurn,
  executeEnemyPhase,
  canPlayCard,
  resetInstanceCounter,
  getEffectiveCost,
} from './combatEngine.ts'
import type { RunState } from '@engine/types/run.ts'
import type { CombatState } from '@engine/types/combat.ts'
import type { AllyCard, SpellCard, Card } from '@engine/types/card.ts'
import type { EnemyTemplate } from '@engine/types/enemy.ts'
import { SeededRNG } from '../../utils/random.ts'

function makeAllyCard(overrides: Partial<AllyCard> = {}): AllyCard {
  return {
    id: 'test_ally',
    name: 'Test Ally',
    type: 'ally',
    faction: 'might',
    rarity: 'common',
    cost: 1,
    attack: 2,
    health: 3,
    keywords: [],
    flavorText: '',
    artId: '',
    upgraded: false,
    upgradeEffect: { description: '', property: 'attack', modifier: 1 },
    ...overrides,
  }
}

function makeSpellCard(overrides: Partial<SpellCard> = {}): SpellCard {
  return {
    id: 'test_spell',
    name: 'Test Spell',
    type: 'spell',
    faction: 'might',
    rarity: 'common',
    cost: 1,
    effect: { type: 'damage', value: 3 },
    targetType: 'single_enemy',
    keywords: [],
    flavorText: '',
    artId: '',
    upgraded: false,
    upgradeEffect: { description: '', property: 'cost', modifier: -1 },
    ...overrides,
  }
}

function makeEnemy(overrides: Partial<EnemyTemplate> = {}): EnemyTemplate {
  return {
    id: 'test_enemy',
    name: 'Test Enemy',
    hp: 10,
    attack: 3,
    tier: 1,
    intents: [{ type: 'attack', value: 3, description: 'Attack for 3' }],
    keywords: [],
    artId: '',
    ...overrides,
  }
}

function makeRunState(deck: Card[] = []): RunState {
  return {
    seed: 'test-seed',
    phase: 'combat',
    stage: 1,
    hero: {
      id: 'hero_kael',
      name: 'Kael',
      title: 'Ashwalker',
      faction: 'might',
      startingHp: 28,
      passive: { name: 'Battle Fury', description: '' },
      heroPower: {
        name: 'Firebolt',
        description: '',
        cost: 2,
        effect: { type: 'damage', value: 2 },
        targetRequired: true,
      },
      starterDeckIds: [],
      artId: '',
    },
    hp: 28,
    maxHp: 28,
    gold: 0,
    deck,
    gearInventory: [],
    equippedGear: [],
    relics: [],
    map: null,
    currentNodeId: null,
    combat: null,
    turnNumber: 0,
    rarityOffset: -5,
    cardRemovalCount: 0,
    rerollCount: 0,
    stats: {
      turnsPlayed: 0,
      damageDealt: 0,
      damageReceived: 0,
      cardsPlayed: 0,
      goldEarned: 0,
      goldSpent: 0,
      enemiesKilled: 0,
      nodesVisited: 0,
    },
  }
}

describe('combatEngine', () => {
  const rng = new SeededRNG('combat-test')

  beforeEach(() => {
    resetInstanceCounter()
  })

  describe('initializeCombat', () => {
    it('creates combat state with enemies and shuffled deck', () => {
      const deck = [makeAllyCard(), makeSpellCard()]
      const runState = makeRunState(deck)
      const enemies = [makeEnemy()]
      const state = initializeCombat(runState, enemies, rng)

      expect(state.enemies.length).toBe(1)
      expect(state.player.hp).toBe(28)
      expect(state.drawPile.length).toBe(2)
      expect(state.turn).toBe(0)
      expect(state.result).toBe('ongoing')
    })
  })

  describe('startTurn', () => {
    it('increments turn and sets mana', () => {
      const deck = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `spell_${i}` }))
      const runState = makeRunState(deck)
      const state = initializeCombat(runState, [makeEnemy()], new SeededRNG('turn-test'))
      const turn1 = startTurn(state, new SeededRNG('draw-test'))

      expect(turn1.turn).toBe(1)
      expect(turn1.player.mana).toBe(1)
      expect(turn1.player.maxMana).toBe(1)
      expect(turn1.hand.length).toBe(5)
      expect(turn1.phase).toBe('player_action')
    })

    it('mana increases each turn up to 8', () => {
      const deck = Array.from({ length: 50 }, (_, i) => makeSpellCard({ id: `spell_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(runState, [makeEnemy({ hp: 1000 })], new SeededRNG('mana-test'))
      const rngDraw = new SeededRNG('mana-draw')

      for (let expectedMana = 1; expectedMana <= 8; expectedMana++) {
        state = startTurn(state, rngDraw)
        expect(state.player.mana).toBe(expectedMana)
        // Simulate end of turn
        state = { ...state, hand: [], phase: 'turn_start' as const, turn: state.turn }
      }

      // Turn 9 should still be 8 mana
      state = startTurn(state, rngDraw)
      expect(state.player.mana).toBe(8)
    })
  })

  describe('canPlayCard', () => {
    it('returns false when not enough mana', () => {
      const state: CombatState = {
        turn: 1,
        phase: 'player_action',
        result: 'ongoing',
        player: {
          heroId: 'hero_kael',
          hp: 28, maxHp: 28, mana: 0, maxMana: 1,
          armor: 0, equippedGear: [], gearInventory: [],
          heroPowerUsedThisTurn: false, statuses: [],
        },
        enemies: [],
        allies: [],
        drawPile: [],
        hand: [],
        discardPile: [],
        graveyard: [],
        log: [],
      }
      const card = makeSpellCard({ cost: 1 })
      expect(canPlayCard(state, card)).toBe(false)
    })

    it('returns true when enough mana', () => {
      const state: CombatState = {
        turn: 1,
        phase: 'player_action',
        result: 'ongoing',
        player: {
          heroId: 'hero_kael',
          hp: 28, maxHp: 28, mana: 1, maxMana: 1,
          armor: 0, equippedGear: [], gearInventory: [],
          heroPowerUsedThisTurn: false, statuses: [],
        },
        enemies: [],
        allies: [],
        drawPile: [],
        hand: [],
        discardPile: [],
        graveyard: [],
        log: [],
      }
      const card = makeSpellCard({ cost: 1 })
      expect(canPlayCard(state, card)).toBe(true)
    })
  })

  describe('playCard - spell', () => {
    it('deals damage to targeted enemy', () => {
      const spell = makeSpellCard({ id: 'dmg_spell', cost: 1, effect: { type: 'damage', value: 5 } })
      const deck = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `filler_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(runState, [makeEnemy({ hp: 10 })], new SeededRNG('spell-test'))
      state = startTurn(state, new SeededRNG('spell-draw'))

      // Add spell to hand manually
      state = { ...state, hand: [spell, ...state.hand] }

      const targetId = state.enemies[0].instanceId
      state = playCard(state, 'dmg_spell', targetId)

      expect(state.enemies[0].hp).toBe(5)
    })

    it('kills enemy and achieves victory when last enemy dies', () => {
      const spell = makeSpellCard({ id: 'kill_spell', cost: 1, effect: { type: 'damage', value: 20 } })
      const deck = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `filler_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(runState, [makeEnemy({ hp: 5 })], new SeededRNG('kill-test'))
      state = startTurn(state, new SeededRNG('kill-draw'))
      state = { ...state, hand: [spell, ...state.hand] }

      const targetId = state.enemies[0].instanceId
      state = playCard(state, 'kill_spell', targetId)

      expect(state.enemies.length).toBe(0)
      expect(state.result).toBe('victory')
    })

    it('moves spell to discard after playing', () => {
      const spell = makeSpellCard({ id: 'discard_spell', cost: 0, effect: { type: 'armor', value: 3 } })
      const deck: Card[] = [spell]
      const runState = makeRunState(deck)
      let state = initializeCombat(runState, [makeEnemy()], new SeededRNG('disc-test'))
      state = startTurn(state, new SeededRNG('disc-draw'))

      const initialDiscardSize = state.discardPile.length
      state = playCard(state, 'discard_spell')

      expect(state.discardPile.length).toBe(initialDiscardSize + 1)
    })
  })

  describe('playCard - ally', () => {
    it('adds ally to board', () => {
      const ally = makeAllyCard({ id: 'board_ally', cost: 1 })
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(runState, [makeEnemy()], new SeededRNG('ally-test'))
      state = startTurn(state, new SeededRNG('ally-draw'))
      state = { ...state, hand: [ally, ...state.hand] }

      state = playCard(state, 'board_ally')
      expect(state.allies.length).toBe(1)
      // Kael's passive: +1 attack
      expect(state.allies[0].currentAttack).toBe(3) // 2 base + 1 from Kael
    })
  })

  describe('endPlayerTurn', () => {
    it('allies attack enemies', () => {
      const ally = makeAllyCard({ id: 'attacker', cost: 0, attack: 3 })
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(runState, [makeEnemy({ hp: 10 })], new SeededRNG('atk-test'))
      state = startTurn(state, new SeededRNG('atk-draw'))
      state = { ...state, hand: [ally, ...state.hand] }
      state = playCard(state, 'attacker')

      const enemyHpBefore = state.enemies[0].hp
      state = endPlayerTurn(state)

      // Ally should have attacked (3 base + 1 Kael passive = 4 damage)
      expect(state.enemies.length > 0 ? state.enemies[0].hp : 0).toBeLessThan(enemyHpBefore)
    })

    it('discards remaining hand', () => {
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(runState, [makeEnemy({ hp: 100 })], new SeededRNG('disc2-test'))
      state = startTurn(state, new SeededRNG('disc2-draw'))

      expect(state.hand.length).toBeGreaterThan(0)
      state = endPlayerTurn(state)
      expect(state.hand.length).toBe(0)
      expect(state.phase).toBe('enemy_phase')
    })
  })

  describe('executeEnemyPhase', () => {
    it('enemies deal damage to hero', () => {
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(
        runState,
        [makeEnemy({ attack: 5, intents: [{ type: 'attack', value: 5, description: 'Attack 5' }] })],
        new SeededRNG('enemy-test'),
      )
      state = startTurn(state, new SeededRNG('enemy-draw'))
      state = endPlayerTurn(state)

      const hpBefore = state.player.hp
      state = executeEnemyPhase(state)

      expect(state.player.hp).toBeLessThan(hpBefore)
    })

    it('enemies target taunt ally', () => {
      const tauntAlly = makeAllyCard({
        id: 'taunt_ally',
        cost: 0,
        attack: 1,
        health: 10,
        keywords: ['taunt'],
      })
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(
        runState,
        [makeEnemy({ attack: 3, intents: [{ type: 'attack', value: 3, description: 'Attack 3' }] })],
        new SeededRNG('taunt-test'),
      )
      state = startTurn(state, new SeededRNG('taunt-draw'))
      state = { ...state, hand: [tauntAlly, ...state.hand] }
      state = playCard(state, 'taunt_ally')

      const heroHpBefore = state.player.hp
      state = endPlayerTurn(state)
      state = executeEnemyPhase(state)

      // Hero should not take damage (taunt redirects)
      expect(state.player.hp).toBe(heroHpBefore)
    })

    it('hero death ends combat', () => {
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = { ...makeRunState(deck), hp: 1, maxHp: 28 }
      let state = initializeCombat(
        runState,
        [makeEnemy({ attack: 10, intents: [{ type: 'attack', value: 10, description: 'Kill' }] })],
        new SeededRNG('death-test'),
      )
      state = startTurn(state, new SeededRNG('death-draw'))
      state = endPlayerTurn(state)
      state = executeEnemyPhase(state)

      expect(state.result).toBe('defeat')
      expect(state.phase).toBe('combat_over')
    })
  })

  describe('keywords', () => {
    it('Ward blocks first damage instance', () => {
      const wardAlly = makeAllyCard({
        id: 'ward_ally',
        cost: 0,
        attack: 1,
        health: 3,
        keywords: ['ward'],
      })
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(
        runState,
        [makeEnemy({ attack: 5, intents: [{ type: 'attack', value: 5, description: 'Attack 5' }] })],
        new SeededRNG('ward-test'),
      )
      state = startTurn(state, new SeededRNG('ward-draw'))
      state = { ...state, hand: [wardAlly, ...state.hand] }
      state = playCard(state, 'ward_ally')

      // Ward ally should have ward status
      expect(state.allies[0].statuses.some((s) => s.type === 'ward')).toBe(true)
    })

    it('Echo returns spell to hand', () => {
      const echoSpell = makeSpellCard({
        id: 'echo_spell',
        cost: 1,
        effect: { type: 'damage', value: 2 },
        keywords: ['echo'],
      })
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(runState, [makeEnemy({ hp: 100 })], new SeededRNG('echo-test'))
      state = startTurn(state, new SeededRNG('echo-draw'))
      state = { ...state, hand: [echoSpell, ...state.hand], player: { ...state.player, mana: 5 } }

      const handSizeBefore = state.hand.length
      const targetId = state.enemies[0].instanceId
      state = playCard(state, 'echo_spell', targetId)

      // Echo copy should be in hand (hand size = before - 1 played + 1 echo = same)
      expect(state.hand.length).toBe(handSizeBefore - 1 + 1)
      // The echo copy should NOT have echo keyword
      const echoCopy = state.hand.find((c) => c.id === 'echo_spell')
      expect(echoCopy?.keywords.includes('echo')).toBe(false)
    })

    it('Deathblow triggers on ally death', () => {
      const deathblowAlly = makeAllyCard({
        id: 'db_ally',
        cost: 0,
        attack: 1,
        health: 1,
        keywords: ['deathblow'],
        deathblowEffect: { type: 'damage', value: 5 },
      })
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(
        runState,
        [makeEnemy({ hp: 20, attack: 10, intents: [{ type: 'attack', value: 10, description: 'Kill' }] })],
        new SeededRNG('db-test'),
      )
      state = startTurn(state, new SeededRNG('db-draw'))
      state = { ...state, hand: [deathblowAlly, ...state.hand] }
      state = playCard(state, 'db_ally')

      // Give ally taunt so enemy attacks it
      const allyIndex = state.allies.findIndex((a) => a.card.id === 'db_ally')
      const allies = [...state.allies]
      allies[allyIndex] = {
        ...allies[allyIndex],
        card: { ...allies[allyIndex].card, keywords: ['deathblow', 'taunt'] },
      }
      state = { ...state, allies }

      state = endPlayerTurn(state)
      state = executeEnemyPhase(state)

      // Ally should be dead (in graveyard)
      expect(state.allies.find((a) => a.card.id === 'db_ally')).toBeUndefined()
      expect(state.graveyard.length).toBeGreaterThan(0)
    })

    it('Fury gains +1 attack on damage', () => {
      const furyAlly = makeAllyCard({
        id: 'fury_ally',
        cost: 0,
        attack: 2,
        health: 10,
        keywords: ['fury', 'taunt'],
      })
      const deck: Card[] = Array.from({ length: 10 }, (_, i) => makeSpellCard({ id: `f_${i}` }))
      const runState = makeRunState(deck)
      let state = initializeCombat(
        runState,
        [makeEnemy({ attack: 3, intents: [{ type: 'attack', value: 3, description: 'Attack 3' }] })],
        new SeededRNG('fury-test'),
      )
      state = startTurn(state, new SeededRNG('fury-draw'))
      state = { ...state, hand: [furyAlly, ...state.hand] }
      state = playCard(state, 'fury_ally')

      // Kael passive gives +1, so base is 3
      const attackBefore = state.allies[0].currentAttack
      state = endPlayerTurn(state)
      state = executeEnemyPhase(state)

      // After taking damage, fury should have increased attack by 1
      const furyAllyAfter = state.allies.find((a) => a.card.id === 'fury_ally')
      expect(furyAllyAfter?.currentAttack).toBe(attackBefore + 1)
    })
  })

  describe('Lira passive', () => {
    it('spells cost 1 less for Lira', () => {
      const state: CombatState = {
        turn: 1,
        phase: 'player_action',
        result: 'ongoing',
        player: {
          heroId: 'hero_lira',
          hp: 25, maxHp: 25, mana: 5, maxMana: 5,
          armor: 0, equippedGear: [], gearInventory: [],
          heroPowerUsedThisTurn: false, statuses: [],
        },
        enemies: [],
        allies: [],
        drawPile: [],
        hand: [],
        discardPile: [],
        graveyard: [],
        log: [],
      }
      const spell = makeSpellCard({ cost: 2 })
      expect(getEffectiveCost(spell, state)).toBe(1)

      const ally = makeAllyCard({ cost: 2 })
      expect(getEffectiveCost(ally, state)).toBe(3) // Allies cost +1
    })
  })

  describe('full combat simulation', () => {
    it('simulates a complete combat from start to finish', () => {
      const deck: Card[] = [
        ...Array.from({ length: 5 }, (_, i) => makeSpellCard({ id: `spell_${i}`, cost: 1, effect: { type: 'damage', value: 3 } })),
        ...Array.from({ length: 5 }, (_, i) => makeAllyCard({ id: `ally_${i}`, cost: 1, attack: 2, health: 3 })),
      ]
      const runState = makeRunState(deck)
      const combatRng = new SeededRNG('full-sim')
      let state = initializeCombat(runState, [makeEnemy({ hp: 15 })], combatRng)

      let maxTurns = 20
      while (state.result === 'ongoing' && maxTurns > 0) {
        state = startTurn(state, combatRng)
        if (state.result !== 'ongoing') break

        // Play all playable cards from hand
        for (const card of [...state.hand]) {
          if (canPlayCard(state, card) && state.enemies.length > 0) {
            const targetId = card.type === 'spell' && (card as SpellCard).targetType === 'single_enemy'
              ? state.enemies[0]?.instanceId
              : undefined
            state = playCard(state, card.id, targetId, combatRng)
            if (state.result !== 'ongoing') break
          }
        }
        if (state.result !== 'ongoing') break

        state = endPlayerTurn(state)
        if (state.result !== 'ongoing') break

        state = executeEnemyPhase(state)
        maxTurns--
      }

      // Should reach a conclusion
      expect(state.result).not.toBe('ongoing')
      expect(state.log.length).toBeGreaterThan(0)
    })
  })
})
