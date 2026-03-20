# CLAUDE.md — IRONMARK

## Project Overview
IRONMARK is a solo roguelite fantasy deckbuilder web game built with React 19, TypeScript, Zustand, and Vite.

- **Game design spec:** `ironmark_PRD.md`
- **Build plan:** `ironmark_IMPLEMENTATION_PLAN.md`

## Architecture (high-level)
1. `src/engine/` — Pure TypeScript game logic. No React, no DOM.
2. `src/data/` — JSON data files. Balance = JSON edits only.
3. `src/stores/` — Thin Zustand wrappers. No game logic.
4. `src/components/` — React UI. Reads stores, dispatches actions.
5. All randomness uses seeded PRNG (`seedrandom`). Never `Math.random()`.

Domain-specific rules live in `.claude/rules/` and load automatically by path.

## Commands
- `npm run dev` — start dev server
- `npm test` — run test suite (watch mode)
- `npm test -- --run` — run tests once
- `npm run build` — production build

## When in Doubt
- Read `ironmark_PRD.md` section relevant to the feature.
- If PRD doesn't cover it, ask the user before assuming.
- Prefer simpler implementations over clever ones.
- If a card effect is complex, break it into composable Effect functions.
