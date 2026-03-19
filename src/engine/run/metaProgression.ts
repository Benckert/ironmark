export interface MetaState {
  totalRuns: number
  totalVictories: number
  thirdHeroUnlocked: boolean
  bonusCardsUnlocked: boolean
}

export function computeMetaState(totalRuns: number, totalVictories: number): MetaState {
  return {
    totalRuns,
    totalVictories,
    thirdHeroUnlocked: totalRuns >= 5,
    bonusCardsUnlocked: totalRuns >= 10,
  }
}

export function getAvailableHeroIds(meta: MetaState): string[] {
  const heroes = ['hero_kael', 'hero_lira']
  if (meta.thirdHeroUnlocked) {
    heroes.push('hero_orin')
  }
  return heroes
}
