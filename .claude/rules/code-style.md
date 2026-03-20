# Code Style

- Strict TypeScript: no `any`, no `as` casts unless absolutely necessary
- Pure functions preferred. Minimize side effects
- `interface` over `type` for object shapes
- Descriptive variable names (no single-letter variables except loop counters)
- Functions ≤ 50 lines, files ≤ 400 lines, nesting ≤ 4 levels, parameters ≤ 5
- All randomness uses seeded PRNG via seedrandom — NEVER `Math.random()`
