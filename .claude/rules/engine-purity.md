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
