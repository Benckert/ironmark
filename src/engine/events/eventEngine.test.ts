import { describe, it, expect } from 'vitest'
import { selectEvent, resolveChoice } from './eventEngine.ts'
import { SeededRNG } from '../../utils/random.ts'
import { getAllEvents } from '@data/dataLoader.ts'

describe('eventEngine', () => {
  describe('selectEvent', () => {
    it('returns an event', () => {
      const rng = new SeededRNG('event-select')
      const event = selectEvent(rng, [])
      expect(event).toBeDefined()
      expect(event.id).toBeTruthy()
      expect(event.name).toBeTruthy()
      expect(event.choices.length).toBeGreaterThan(0)
    })

    it('avoids visited events when possible', () => {
      const allEvents = getAllEvents()
      const visitedIds = allEvents.slice(0, allEvents.length - 1).map((e) => e.id)
      const rng = new SeededRNG('avoid-visited')
      const event = selectEvent(rng, visitedIds)
      // Should pick the one unvisited event
      expect(event.id).toBe(allEvents[allEvents.length - 1].id)
    })

    it('falls back to visited events when all visited', () => {
      const allEvents = getAllEvents()
      const visitedIds = allEvents.map((e) => e.id)
      const rng = new SeededRNG('all-visited')
      const event = selectEvent(rng, visitedIds)
      expect(event).toBeDefined()
    })
  })

  describe('resolveChoice', () => {
    it('resolves heal effect', () => {
      const rng = new SeededRNG('heal-event')
      const event = getAllEvents().find((e) => e.id === 'event_abandoned_shrine')!
      // Choice 0 = Pray (heal 8)
      const result = resolveChoice(event, 0, 'might', rng)
      expect(result.hpDelta).toBe(8)
      expect(result.outcomeDescription).toContain('restored')
    })

    it('resolves gold + curse effect', () => {
      const rng = new SeededRNG('curse-event')
      const event = getAllEvents().find((e) => e.id === 'event_abandoned_shrine')!
      // Choice 1 = Desecrate (gold 30 + curse)
      const result = resolveChoice(event, 1, 'might', rng)
      expect(result.goldDelta).toBe(30)
      expect(result.addCurse).toBe(true)
    })

    it('resolves damage + add_card effect', () => {
      const rng = new SeededRNG('soldier-event')
      const event = getAllEvents().find((e) => e.id === 'event_wounded_soldier')!
      // Choice 0 = Help (damage 5 + add card)
      const result = resolveChoice(event, 0, 'wisdom', rng)
      expect(result.hpDelta).toBe(-5)
      expect(result.addedCards.length).toBe(1)
    })

    it('resolves empty effects (walk away)', () => {
      const rng = new SeededRNG('walk-away')
      const event = getAllEvents().find((e) => e.id === 'event_cursed_chest')!
      // Choice 1 = Walk away (no effects)
      const result = resolveChoice(event, 1, 'might', rng)
      expect(result.hpDelta).toBe(0)
      expect(result.goldDelta).toBe(0)
      expect(result.addedCards.length).toBe(0)
    })

    it('resolves max_hp effect', () => {
      const rng = new SeededRNG('chest-event')
      const event = getAllEvents().find((e) => e.id === 'event_cursed_chest')!
      // Choice 0 = Open it (add gear + max_hp -3)
      const result = resolveChoice(event, 0, 'might', rng)
      expect(result.maxHpDelta).toBe(-3)
      expect(result.addedGear.length).toBe(1)
    })

    it('resolves reveal_map effect', () => {
      const rng = new SeededRNG('crossroads')
      const event = getAllEvents().find((e) => e.id === 'event_crossroads')!
      // Choice 0 = Left path (reveal map)
      const result = resolveChoice(event, 0, 'might', rng)
      expect(result.revealMap).toBe(true)
    })

    it('resolves skip_node effect', () => {
      const rng = new SeededRNG('skip')
      const event = getAllEvents().find((e) => e.id === 'event_crossroads')!
      // Choice 2 = Straight ahead (skip node)
      const result = resolveChoice(event, 2, 'might', rng)
      expect(result.skipNode).toBe(true)
    })

    it('returns empty result for invalid choice', () => {
      const rng = new SeededRNG('invalid')
      const event = getAllEvents()[0]
      const result = resolveChoice(event, 99, 'might', rng)
      expect(result.outcomeDescription).toBe('Invalid choice.')
    })
  })
})
