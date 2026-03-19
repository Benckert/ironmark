import { useState, useCallback } from 'react'

export type AnimationSpeed = '1x' | '2x' | 'skip'

const speedMultipliers: Record<AnimationSpeed, number> = {
  '1x': 1,
  '2x': 0.5,
  'skip': 0,
}

let globalSpeed: AnimationSpeed = '1x'

export function setAnimationSpeed(speed: AnimationSpeed): void {
  globalSpeed = speed
}

export function getAnimationSpeed(): AnimationSpeed {
  return globalSpeed
}

export function getSpeedMultiplier(): number {
  return speedMultipliers[globalSpeed]
}

export function getAnimationDuration(baseDurationMs: number): number {
  return baseDurationMs * speedMultipliers[globalSpeed]
}

// Hook for triggering one-shot animations
export function useAnimationTrigger() {
  const [isAnimating, setIsAnimating] = useState(false)

  const trigger = useCallback((durationMs: number): Promise<void> => {
    const actualDuration = getAnimationDuration(durationMs)
    if (actualDuration === 0) return Promise.resolve()

    setIsAnimating(true)
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsAnimating(false)
        resolve()
      }, actualDuration)
    })
  }, [])

  return { isAnimating, trigger }
}
