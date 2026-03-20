---
paths:
  - "src/engine/**"
---

# Engine Purity Rules

<important if="you are creating or modifying files in src/engine/">
- MUST NOT import React, ReactDOM, or any browser/DOM APIs
- Engine functions are pure: take state in, return new state out
- All randomness MUST use `SeededRNG` from `src/utils/random.ts` — NEVER `Math.random()`
- State MUST be JSON-serializable: no functions, classes, or circular references
- Export all shared types from `src/engine/types/` — import them everywhere
- Complex card effects SHOULD be broken into composable Effect functions
- Refer to `ironmark_PRD.md` for game mechanic specifications
</important>

Bad:
```ts
// WRONG — DOM access, mutating input, Math.random
function dealDamage(state: CombatState, amount: number) {
  state.hp -= amount  // mutation!
  document.querySelector('.hp').textContent = state.hp  // DOM!
  if (Math.random() > 0.5) { /* ... */ }  // unseeded!
}
```

Good:
```ts
// RIGHT — pure function, new state, seeded RNG
function dealDamage(state: CombatState, amount: number, rng: SeededRNG): CombatState {
  return { ...state, player: { ...state.player, hp: state.player.hp - amount } }
}
```
