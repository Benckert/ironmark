---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing Rules

- Every engine function MUST have unit tests
- Test file lives next to source: `combatEngine.ts` → `combatEngine.test.ts`
- Use `describe` blocks grouped by function name
- Use factory helpers (e.g., `makeAllyCard()`, `makeSpellCard()`) to build test data
- Test edge cases: empty deck, 0 HP, max mana, full board, no valid targets
- Framework: Vitest — `import { describe, it, expect } from 'vitest'`
- Run: `npm test -- --run` for single pass, `npm test` for watch mode

<important if="you are testing functions that use randomness">
Always create a `SeededRNG` with a fixed seed in tests to ensure deterministic results.
```ts
const rng = new SeededRNG('test-seed')
```
</important>
