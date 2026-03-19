import { describe, it, expect } from 'vitest'
import { generateRunStartOptions } from './runStartGamble.ts'
import { SeededRNG } from '../../utils/random.ts'

describe('runStartGamble', () => {
  it('always returns 4 options', () => {
    for (let i = 0; i < 20; i++) {
      const rng = new SeededRNG(`gamble-${i}`)
      const options = generateRunStartOptions(rng)
      expect(options.length).toBe(4)
    }
  })

  it('options follow risk gradient: safe, safe, moderate, gamble', () => {
    const rng = new SeededRNG('risk-test')
    const options = generateRunStartOptions(rng)
    expect(options[0].riskLevel).toBe('safe')
    expect(options[1].riskLevel).toBe('safe')
    expect(options[2].riskLevel).toBe('moderate')
    expect(options[3].riskLevel).toBe('gamble')
  })

  it('two safe options are different', () => {
    for (let i = 0; i < 20; i++) {
      const rng = new SeededRNG(`unique-safe-${i}`)
      const options = generateRunStartOptions(rng)
      expect(options[0].apply).not.toBe(options[1].apply)
    }
  })

  it('all options have required fields', () => {
    const rng = new SeededRNG('fields-test')
    const options = generateRunStartOptions(rng)
    for (const option of options) {
      expect(option.id).toBeTruthy()
      expect(option.label).toBeTruthy()
      expect(option.description).toBeTruthy()
      expect(option.riskLevel).toBeTruthy()
      expect(option.apply).toBeTruthy()
    }
  })

  it('same seed produces same options', () => {
    const rng1 = new SeededRNG('deterministic')
    const rng2 = new SeededRNG('deterministic')
    const options1 = generateRunStartOptions(rng1)
    const options2 = generateRunStartOptions(rng2)
    expect(options1.map((o) => o.apply)).toEqual(options2.map((o) => o.apply))
  })
})
