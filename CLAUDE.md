# CLAUDE.md — Instructions for AI Assistants

## Project Overview
IRONMARK is a solo roguelite fantasy deckbuilder web game.
Read ironmark_PRD.md for full game design specification.
Read ironmark_IMPLEMENTATION_PLAN.md for build instructions.

## Architecture Rules
1. Game engine (`src/engine/`) is PURE TypeScript. No React imports. No DOM access.
   Engine functions take state in, return new state out.
2. All card/enemy/event data lives in `src/data/` as JSON files.
   Balance changes = JSON edits, never code changes.
3. Zustand stores (`src/stores/`) are thin wrappers that call engine functions.
   Stores do NOT contain game logic.
4. All randomness uses seeded PRNG via the seedrandom library.
   Never use Math.random() directly.
5. State must be serializable to JSON (no functions, classes, or circular refs in state).

## Code Style
- Strict TypeScript (no `any`, no `as` casts unless absolutely necessary)
- Pure functions preferred. Minimize side effects.
- Name files in camelCase. Name components in PascalCase.
- Export types from `src/engine/types/`. Import them everywhere.
- Prefer `interface` over `type` for object shapes.
- Use descriptive variable names (no single-letter variables except loop counters).

## Testing
- Every engine function must have unit tests.
- Test file lives next to source file: `combatEngine.ts` → `combatEngine.test.ts`
- Use `describe` blocks grouped by function name.
- Test edge cases: empty deck, 0 HP, max mana, full board, etc.

## Commands
- `npm run dev` — start dev server
- `npm test` — run test suite (watch mode)
- `npm test -- --run` — run tests once
- `npm run build` — production build

## When in Doubt
- Read ironmark_PRD.md Section relevant to the feature you're building.
- If PRD doesn't cover it, ask the user before assuming.
- Prefer simpler implementations over clever ones.
- If a card effect is complex, break it into composable Effect functions.
