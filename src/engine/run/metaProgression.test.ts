import { describe, it, expect } from 'vitest'
import { computeMetaState, getAvailableHeroIds } from './metaProgression.ts'

describe('metaProgression', () => {
  it('no unlocks at start', () => {
    const meta = computeMetaState(0, 0)
    expect(meta.thirdHeroUnlocked).toBe(false)
    expect(meta.bonusCardsUnlocked).toBe(false)
  })

  it('unlocks third hero after 5 runs', () => {
    const meta = computeMetaState(5, 1)
    expect(meta.thirdHeroUnlocked).toBe(true)
    expect(meta.bonusCardsUnlocked).toBe(false)
  })

  it('unlocks bonus cards after 10 runs', () => {
    const meta = computeMetaState(10, 3)
    expect(meta.thirdHeroUnlocked).toBe(true)
    expect(meta.bonusCardsUnlocked).toBe(true)
  })

  it('returns correct hero IDs based on meta state', () => {
    const meta0 = computeMetaState(0, 0)
    expect(getAvailableHeroIds(meta0)).toEqual(['hero_kael', 'hero_lira'])

    const meta5 = computeMetaState(5, 2)
    expect(getAvailableHeroIds(meta5)).toEqual(['hero_kael', 'hero_lira', 'hero_orin'])
  })
})
