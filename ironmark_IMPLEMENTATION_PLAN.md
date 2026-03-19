# Project IRONMARK — Implementation Plan

> **Purpose:** Step-by-step instructions for building the MVP, optimized for AI-assisted development with Claude Code.
> **Source of truth:** PRD.md — when this document and the PRD conflict, the PRD wins.
> **Working style:** Each phase is a self-contained unit of work. Complete one phase fully (including tests) before starting the next. Commit after each phase.

---

## How to Use This Document

This implementation plan is designed to be fed to **Claude Code** (or similar AI coding assistants) phase by phase. Each phase includes:

1. **Goal** — what this phase achieves
2. **Prerequisites** — what must exist before starting
3. **Tasks** — numbered steps in execution order
4. **Acceptance criteria** — how to verify the phase is complete
5. **Key files** — which files should be created or modified
6. **Testing requirements** — what tests to write

**Instruction for Claude Code:** When starting a phase, read the PRD.md file in the project root first for full context. Read this phase's section completely before writing any code. Ask clarifying questions if anything is ambiguous rather than making assumptions.

---

## Phase Overview

| Phase | Name | Description | Est. Complexity |
|-------|------|-------------|----------------|
| 0 | Project Setup | Scaffolding, tooling, config | Small |
| 1 | Type System & Data Layer | All TypeScript types + JSON card data | Medium |
| 2 | Game Engine Core | Pure game logic: deck, combat, damage | Large |
| 3 | Combat UI | React combat screen with hand, board, enemies | Large |
| 4 | Reward System | Post-combat rewards with gambling mechanics | Medium |
| 5 | Map System | Map generation, navigation, node types | Medium |
| 6 | Shop, Rest & Events | Non-combat node screens | Medium |
| 7 | Run Flow & Run-Start Gamble | Full run lifecycle from menu to victory/defeat | Medium |
| 8 | Persistence & Meta | Save/load, run history, basic unlocks | Small |
| 9 | Polish & Animation | Card animations, transitions, audio hooks | Medium |
| 10 | Balancing & Playtesting | Card balance pass, difficulty tuning | Ongoing |

---

## Phase 0: Project Setup

### Goal
Create the project scaffolding with all dependencies, configuration, and folder structure. After this phase, `npm run dev` shows a blank React app and `npm test` runs an empty test suite.

### Prerequisites
- Node.js 18+
- npm or pnpm

### Tasks

1. **Initialize Vite project:**
   ```bash
   npm create vite@latest ironmark -- --template react-ts
   cd ironmark
   ```

2. **Install dependencies:**
   ```bash
   # Core
   npm install zustand dexie framer-motion

   # Utilities
   npm install seedrandom
   npm install -D @types/seedrandom

   # Testing
   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

   # Styling (choose one — Tailwind recommended for rapid prototyping)
   npm install -D tailwindcss @tailwindcss/vite
   ```

3. **Configure Tailwind CSS** — add Tailwind plugin to `vite.config.ts`, create `src/index.css` with Tailwind imports, using Tailwind v4 conventions.

4. **Configure Vitest** — add to `vite.config.ts`:
   ```typescript
   /// <reference types="vitest/config" />
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'

   export default defineConfig({
     plugins: [react(), tailwindcss()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './src/test-setup.ts',
     },
     resolve: {
       alias: {
         '@': '/src',
         '@engine': '/src/engine',
         '@data': '/src/data',
         '@components': '/src/components',
         '@stores': '/src/stores',
       }
     }
   })
   ```

5. **Create folder structure** — create all directories listed in PRD Section 22.2. Leave them empty for now (add `.gitkeep` files).

6. **Create `tsconfig.json` path aliases** matching the Vite aliases above.

7. **Create `CLAUDE.md`** in project root with these instructions:
   ```markdown
   # CLAUDE.md — Instructions for AI Assistants

   ## Project Overview
   IRONMARK is a solo roguelite fantasy deckbuilder web game.
   Read PRD.md for full game design specification.
   Read IMPLEMENTATION_PLAN.md for build instructions.

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

   ## When in Doubt
   - Read PRD.md Section relevant to the feature you're building.
   - If PRD doesn't cover it, ask the user before assuming.
   - Prefer simpler implementations over clever ones.
   - If a card effect is complex, break it into composable Effect functions.
   ```

8. **Verify:** `npm run dev` shows the default Vite React page. `npm test` runs with 0 tests found. `npm run build` succeeds with no errors.

### Acceptance Criteria
- [ ] Project runs with `npm run dev`
- [ ] Test suite runs with `npm test`
- [ ] All folder structure created
- [ ] All dependencies installed
- [ ] Path aliases working
- [ ] CLAUDE.md exists and is accurate
- [ ] PRD.md and IMPLEMENTATION_PLAN.md are in project root

### Key Files Created
- `vite.config.ts`, `tsconfig.json`, `package.json`
- `CLAUDE.md`
- `src/index.css` (Tailwind)
- `src/test-setup.ts`
- All directory stubs

---

## Phase 1: Type System & Data Layer

### Goal
Define all TypeScript types and create the initial JSON card/enemy/event data. After this phase, all types compile cleanly and card data is loadable and type-checked.

### Prerequisites
- Phase 0 complete

### Tasks

1. **Create all type definitions** in `src/engine/types/`:

   **`card.ts`** — CardType, Faction, Rarity, Keyword, BaseCard, AllyCard, SpellCard, GearCard, Effect, GearEffect, UpgradeEffect. Follow the exact schema in PRD Section 19.1.

   **`combat.ts`** — CombatState, TurnPhase, PlayerState, EnemyInstance, AllyInstance, BoardState, CombatAction, CombatResult. Include:
   ```typescript
   interface CombatState {
     turn: number;
     phase: TurnPhase; // "player_action" | "enemy_phase" | "turn_start" | "turn_end" | "combat_over"
     player: PlayerState;
     enemies: EnemyInstance[];
     allies: AllyInstance[];
     drawPile: Card[];
     hand: Card[];
     discardPile: Card[];
     graveyard: Card[]; // dead allies
     log: CombatLogEntry[];
   }

   interface PlayerState {
     heroId: string;
     hp: number;
     maxHp: number;
     mana: number;
     maxMana: number; // min(turn, 8)
     armor: number;
     equippedGear: GearCard[];
     gearInventory: GearCard[];
     heroPowerUsedThisTurn: boolean;
     statuses: StatusEffect[];
   }

   interface AllyInstance {
     instanceId: string; // unique per combat instance
     card: AllyCard;
     currentHp: number;
     currentAttack: number;
     statuses: StatusEffect[];
     hasAttackedThisTurn: boolean;
   }

   interface EnemyInstance {
     instanceId: string;
     enemyId: string;
     name: string;
     hp: number;
     maxHp: number;
     attack: number;
     currentIntentIndex: number;
     intents: Intent[];
     keywords: Keyword[];
     statuses: StatusEffect[];
     buffs: { attack: number; armor: number };
   }
   ```

   **`enemy.ts`** — EnemyTemplate, Intent, IntentType.

   **`map.ts`** — MapState, MapNode, NodeType, MapEdge, MapRow.

   **`run.ts`** — RunState (master state object containing everything), RunPhase, RunResult.
   ```typescript
   interface RunState {
     seed: string;
     phase: RunPhase; // "hero_select" | "run_start_gamble" | "map" | "combat" | "reward" | "shop" | "rest" | "event" | "boss" | "victory" | "defeat"
     hero: HeroDefinition;
     hp: number;
     maxHp: number;
     gold: number;
     deck: Card[];
     gearInventory: GearCard[];
     equippedGear: GearCard[];
     relics: Relic[];
     map: MapState;
     currentNodeId: string | null;
     combat: CombatState | null;
     turnNumber: number; // global turn counter for mana calc
     rarityOffset: number; // pity timer
     cardRemovalCount: number; // tracks escalating removal cost
     rerollCount: number; // tracks escalating reroll cost within current reward screen
     stats: RunStats; // tracking for end-of-run summary
   }
   ```

   **`reward.ts`** — RewardState, RewardOption, RerollState.

   **`event.ts`** — EventDefinition, EventChoice, EventOutcome.

   **`gear.ts`** — additional gear-specific types if needed.

   **`hero.ts`** — HeroDefinition, HeroPower.

   **`relic.ts`** — Relic, RelicEffect.

   **`common.ts`** — StatusEffect, DamageType, TargetType, and other shared types.

2. **Create JSON data files** in `src/data/`:

   **`heroes/heroes.json`** — 2 heroes (Kael for Might, Lira for Wisdom) per PRD Section 7.

   **`cards/might.json`** — All Might faction cards: 4 starter cards + 6 allies + 4 spells + 3 gear = 17 cards. Follow the exact JSON schema from PRD Section 19.2.

   **`cards/wisdom.json`** — All Wisdom faction cards: same structure as Might.

   **`cards/heart.json`** — All Heart faction cards: same structure. (Heart heroes come post-MVP but Heart cards are in the draft pool.)

   **`cards/neutral.json`** — 5 neutral cards.

   **`gear/allGear.json`** — All gear cards from all factions (can be a flat array or organized by faction). Every gear card MUST have both `upside` and `downside` fields.

   **`enemies/stage1.json`** — 15 enemies organized by tier (5 per tier) per PRD Section 14.3.

   **`enemies/bosses.json`** — The Hollow King boss data per PRD Section 15.2.

   **`events/stage1Events.json`** — 5 events per PRD Section 16.2.

3. **Create data loader utility** `src/data/dataLoader.ts`:
   - Functions to import and parse all JSON files
   - Type-check parsed data against TypeScript interfaces
   - Export typed lookup maps: `getCardById(id)`, `getEnemyById(id)`, `getHeroById(id)`, etc.
   - Validate on load: warn if any gear card is missing upside/downside

4. **Write validation tests** `src/data/dataLoader.test.ts`:
   - All card IDs are unique
   - All gear cards have both upside and downside
   - All card costs are within valid range (0–8)
   - All enemy HP values are positive
   - All heroes have valid starter deck references
   - Starter decks contain exactly 10 cards
   - No broken references (e.g., card referencing a keyword that doesn't exist)

### Acceptance Criteria
- [ ] All type files compile with zero errors
- [ ] All JSON data files parse correctly
- [ ] Data loader functions return typed objects
- [ ] Validation tests pass (all data integrity checks green)
- [ ] At least 56 unique card definitions exist across all JSON files
- [ ] Every gear card has upside AND downside

### Key Files Created
- `src/engine/types/*.ts` (8–10 type files)
- `src/data/**/*.json` (8–10 data files)
- `src/data/dataLoader.ts`
- `src/data/dataLoader.test.ts`

---

## Phase 2: Game Engine Core

### Goal
Implement all pure game logic: deck management, combat resolution, damage calculation, keyword resolution, mana system. After this phase, a full combat encounter can be simulated entirely through unit tests with no UI.

### Prerequisites
- Phase 1 complete (all types and data exist)

### Tasks

1. **Seeded RNG utility** `src/utils/random.ts`:
   - Create `SeededRNG` class wrapping `seedrandom`
   - Methods: `next()` (0–1 float), `nextInt(min, max)`, `pick(array)`, `shuffle(array)`, `weightedPick(items, weights)`
   - All methods are deterministic given the same seed
   - Write tests: same seed produces same sequence

2. **Deck Manager** `src/engine/cards/deckManager.ts`:
   - `createDeck(cardIds: string[]): Card[]` — builds initial deck from card IDs
   - `shuffleDeck(deck: Card[], rng: SeededRNG): Card[]` — Fisher-Yates shuffle
   - `drawCards(state: CombatState, count: number): CombatState` — draw from drawPile to hand; if drawPile empty, shuffle discardPile into drawPile first
   - `discardCard(state: CombatState, cardInstanceId: string): CombatState` — move card from hand to discard
   - `discardHand(state: CombatState): CombatState` — discard all remaining hand cards
   - `removeCardFromDeck(deck: Card[], cardId: string): Card[]` — permanent removal (for shops/rest)
   - `upgradeCard(deck: Card[], cardId: string): Card[]` — apply upgrade effect
   - Write tests for each function, especially edge cases (empty deck, empty discard)

3. **Keyword Resolver** `src/engine/combat/keywordResolver.ts`:
   - `resolveStrike(ally: AllyInstance, state: CombatState): CombatState` — trigger Strike effect after attack
   - `resolveDeathblow(ally: AllyInstance, state: CombatState): CombatState` — trigger on ally death
   - `resolveEcho(card: SpellCard, state: CombatState): CombatState` — return card to hand if first play
   - `resolveWard(target: AllyInstance | PlayerState, damage: number): { target, actualDamage }` — absorb first hit
   - `resolveTaunt(enemies: EnemyInstance[], allies: AllyInstance[]): AllyInstance | null` — find taunt target
   - `resolveFury(ally: AllyInstance, damageTaken: number): AllyInstance` — gain +1 attack per hit
   - `applyBurn(target: EnemyInstance | AllyInstance, stacks: number): target` — add burn stacks
   - `applyPoison(target: EnemyInstance | AllyInstance, stacks: number): target`
   - `tickStatuses(state: CombatState): CombatState` — process burn/poison at start of turn
   - Write extensive tests: Ward blocks exactly once, Burn stacks correctly, Deathblow triggers on death only, etc.

4. **Damage Resolver** `src/engine/combat/damageResolver.ts`:
   - `dealDamage(target, amount, source, state): { updatedTarget, state, damageDealt }` — core damage function
   - Handles: armor reduction, Ward check, Fury trigger, death check, gear modifiers (e.g., "hero takes +1 damage")
   - `healTarget(target, amount, state): { updatedTarget, state, healAmount }` — core heal function
   - Handles: gear modifiers (e.g., "all healing halved")
   - Write tests: damage with armor, damage with Ward, overkill, healing cap at maxHp

5. **Enemy AI** `src/engine/encounters/enemyAI.ts`:
   - `getEnemyIntent(enemy: EnemyInstance): Intent` — returns current intent based on `currentIntentIndex`
   - `executeEnemyIntent(enemy: EnemyInstance, intent: Intent, state: CombatState): CombatState` — resolves the intent (deal damage to hero or taunt target, apply buff, summon ally, etc.)
   - `advanceEnemyIntent(enemy: EnemyInstance): EnemyInstance` — increment intent index, cycle if at end
   - Write tests: intent cycling, attack targeting with/without Taunt, summon mechanics

6. **Combat Engine** `src/engine/combat/combatEngine.ts`:
   This is the central orchestrator. All functions take `CombatState` in and return new `CombatState` out.

   - `initializeCombat(runState: RunState, encounterEnemies: EnemyTemplate[]): CombatState` — set up initial combat state from run state
   - `startTurn(state: CombatState): CombatState` — increment turn, calculate mana, draw cards, tick statuses, set enemy intents
   - `playCard(state: CombatState, cardInstanceId: string, targetId?: string): CombatState` — the big one:
     1. Validate: enough mana, card is in hand, valid target
     2. Deduct mana
     3. If Ally: add to board (check max 4), remove from hand
     4. If Spell: resolve effect, apply keywords (Echo), move to discard
     5. If Gear: equip to hero (check max 4, prompt replace if full), remove from hand or gear inventory
     6. Apply any "on play" triggers from gear/relics
     7. Check for enemy deaths → trigger Deathblow
     8. Log action
   - `useHeroPower(state: CombatState, targetId?: string): CombatState` — resolve hero power, mark as used
   - `endPlayerTurn(state: CombatState): CombatState`:
     1. Resolve ally attacks (each ally attacks its assigned target or default target)
     2. Resolve Strike effects
     3. Check for enemy deaths → Deathblow triggers
     4. Discard remaining hand
     5. Transition to enemy phase
   - `executeEnemyPhase(state: CombatState): CombatState`:
     1. For each living enemy (left to right): execute intent
     2. Check for hero death → combat over
     3. Check for ally deaths → Deathblow triggers
     4. Advance enemy intents
     5. Trigger end-of-turn effects
     6. Transition to turn start or combat over
   - `checkCombatEnd(state: CombatState): CombatState` — check if all enemies dead (victory) or hero dead (defeat)
   - Write comprehensive tests: full combat simulation from start to finish, specific keyword interactions, edge cases

7. **Gear Manager** `src/engine/cards/gearManager.ts`:
   - `equipGear(state: RunState, gearCard: GearCard, replaceSlotIndex?: number): RunState`
   - `applyGearEffects(state: CombatState): CombatState` — apply all equipped gear passive effects
   - `getGearModifier(gear: GearCard[], modifierType: string): number` — calculate aggregate modifier from all equipped gear
   - Write tests: equip/replace, passive effects applied correctly, downside effects applied

8. **Encounter Builder** `src/engine/encounters/encounterBuilder.ts`:
   - `buildEncounter(mapRow: number, nodeType: NodeType, rng: SeededRNG): EnemyTemplate[]` — select enemies appropriate for the row/tier
   - `buildEliteEncounter(rng: SeededRNG): EnemyTemplate[]`
   - `buildBossEncounter(bossId: string): EnemyTemplate[]`
   - Write tests: encounters respect tier restrictions, elite encounters are harder

### Acceptance Criteria
- [ ] Full combat simulation passes in tests (deal damage, play cards, resolve keywords, enemy turns, combat ends)
- [ ] All 6 MVP keywords (Strike, Echo, Ward, Taunt, Deathblow, Burn) have working implementations and tests
- [ ] Mana system works: starts at 1, +1 per turn, caps at 8
- [ ] Deck cycling works: when draw pile is empty, discard reshuffles in
- [ ] Gear upside and downside effects both apply correctly
- [ ] Seeded RNG: same seed + same actions = same outcome
- [ ] At least 50 unit tests passing

### Key Files Created
- `src/utils/random.ts` + test
- `src/engine/cards/deckManager.ts` + test
- `src/engine/cards/gearManager.ts` + test
- `src/engine/combat/keywordResolver.ts` + test
- `src/engine/combat/damageResolver.ts` + test
- `src/engine/combat/combatEngine.ts` + test
- `src/engine/encounters/enemyAI.ts` + test
- `src/engine/encounters/encounterBuilder.ts` + test

---

## Phase 3: Combat UI

### Goal
Build the React combat screen. Player can see their hand, play cards, see enemies with intents, watch combat resolve, and reach victory or defeat. This is the most visual phase.

### Prerequisites
- Phase 2 complete (combat engine fully tested)

### Tasks

1. **Create Zustand combat store** `src/stores/combatStore.ts`:
   - Holds `CombatState` as store state
   - Actions call engine functions and update state:
     - `initCombat(runState, enemies)` → calls `combatEngine.initializeCombat`
     - `startTurn()` → calls `combatEngine.startTurn`
     - `playCard(cardId, targetId?)` → calls `combatEngine.playCard`
     - `useHeroPower(targetId?)` → calls `combatEngine.useHeroPower`
     - `endTurn()` → calls `combatEngine.endPlayerTurn` then `combatEngine.executeEnemyPhase` then `combatEngine.startTurn`
   - Computed values: `isPlayerTurn`, `canPlayCard(cardId)`, `validTargets(cardId)`

2. **Card component** `src/components/cards/Card.tsx`:
   - Renders any card type (Ally/Spell/Gear) with appropriate layout
   - Props: `card: Card`, `size: "small" | "medium" | "large"`, `onClick?`, `isPlayable?`, `isSelected?`
   - Visual elements: name, cost (mana crystal), type icon, stats (attack/health for allies), effect text, keywords as badge icons, rarity border color, faction color accent
   - Hover state: slight scale-up, show full card tooltip
   - Disabled state: grayed out when not enough mana
   - Use Tailwind for styling. Card dimensions: ~120×170px (medium).

3. **Card tooltip** `src/components/cards/CardTooltip.tsx`:
   - Full-size card view on hover
   - Shows: all stats, full effect text, keyword explanations, flavor text, gear upside/downside
   - Positioned to not overflow viewport

4. **Hand display** `src/components/cards/CardHand.tsx`:
   - Horizontal card row at bottom of combat screen
   - Cards fan out in a slight arc (CSS transform)
   - Hover: card rises above others
   - Click on playable card: enters targeting mode (if needed) or plays immediately
   - Show card count indicators for draw pile and discard pile

5. **Enemy display** `src/components/combat/EnemyDisplay.tsx`:
   - Renders 1–4 enemies in a row at top of screen
   - Each enemy shows: name, HP bar, current intent icon + value, status effect icons, attack target indicator
   - Click on enemy: select as target (when in targeting mode)
   - Death animation: fade out + collapse

6. **Ally board** `src/components/combat/AllyBoard.tsx`:
   - Renders 0–4 allies in a row below enemies
   - Each ally shows: card art (small), attack/health values, status effects, keyword badges
   - Visual indicator when ally has attacked this turn

7. **Hero HUD** `src/components/combat/HeroHUD.tsx`:
   - Hero portrait/name
   - HP bar (current/max) with color gradient (green → yellow → red)
   - Mana crystals (filled/empty visual, like Hearthstone)
   - Hero power button (clickable when available, grayed when used)
   - Equipped gear slots (4 small icons)
   - Armor indicator (if any)

8. **Damage popup** `src/components/combat/DamagePopup.tsx`:
   - Floating number that appears above target when damage/heal occurs
   - Red for damage, green for heal
   - Float upward and fade out over 0.5s
   - Use Framer Motion for animation

9. **End turn button** — prominent button in combat UI. Disabled during enemy phase.

10. **Combat screen** `src/components/screens/CombatScreen.tsx`:
    - Composes all above components
    - Layout per PRD Section 5.6
    - Manages combat flow: auto-starts turn, waits for player input, resolves enemy phase with brief delays between enemy actions
    - Shows "VICTORY" or "DEFEAT" overlay when combat ends
    - On victory: transition to reward screen (Phase 4)
    - On defeat: transition to defeat screen

11. **Deck viewer** — modal overlay listing all cards in current deck. Accessible via a button during combat.

### Acceptance Criteria
- [ ] Player can see hand of 5 cards at bottom of screen
- [ ] Unplayable cards (insufficient mana) are visually grayed out
- [ ] Clicking a playable card plays it (with targeting for single-target effects)
- [ ] Allies appear on board after playing ally cards
- [ ] Spells resolve immediately with visible effect
- [ ] Enemy intents are displayed and accurate
- [ ] End Turn triggers enemy phase with visible resolution
- [ ] Damage popups appear for all damage/healing
- [ ] HP and mana update in real-time
- [ ] Combat ends correctly on all-enemies-dead or hero-dead
- [ ] Can view deck contents during combat

### Key Files Created
- `src/stores/combatStore.ts`
- `src/components/cards/Card.tsx`, `CardHand.tsx`, `CardTooltip.tsx`
- `src/components/combat/EnemyDisplay.tsx`, `AllyBoard.tsx`, `HeroHUD.tsx`, `DamagePopup.tsx`
- `src/components/screens/CombatScreen.tsx`

---

## Phase 4: Reward System

### Goal
Implement the post-combat reward screen with animated card reveals, weighted rarity, faction weighting, rerolls (gold-based, escalating), and skip option. This is the core "gambling moment."

### Prerequisites
- Phase 3 complete (combat works and ends properly)

### Tasks

1. **Rarity roller** `src/engine/rewards/rarityRoller.ts`:
   - `rollRarity(rarityOffset: number, isElite: boolean, rng: SeededRNG): Rarity`
   - Implements the weight tables from PRD Section 10.3
   - Implements hidden rarity offset / pity timer:
     - Pass in current offset
     - Return new offset (reset to −5 on Rare, increment on all-Common)
   - Write tests: pity timer eventually forces Rare, elite fights have better rates

2. **Reward generator** `src/engine/rewards/rewardGenerator.ts`:
   - `generateCardRewards(runState: RunState, isElite: boolean, rng: SeededRNG): { cards: Card[], newRarityOffset: number }`
     1. Roll 3 rarities using rarity roller
     2. For each card: roll faction (60% own / 25% other / 15% neutral)
     3. Select a random card matching faction + rarity from the card pool
     4. Ensure no duplicate cards in the 3 offers
     5. Return 3 cards + updated rarity offset
   - `generateGoldReward(nodeType: NodeType, rng: SeededRNG): number` — gold amount per PRD Section 10.7
   - `generateGearReward(runState: RunState, rng: SeededRNG): GearCard` — random gear for elite rewards
   - `generateRelicReward(rng: SeededRNG): Relic` — random relic for elite/boss rewards
   - Write tests: faction weighting roughly matches expected distribution over many rolls, no duplicates

3. **Reroll logic:**
   - `calculateRerollCost(rerollCount: number): number` — 25 + (rerollCount × 25)
   - `canAffordReroll(gold: number, rerollCount: number): boolean`
   - `performReroll(runState: RunState, rng: SeededRNG): { cards: Card[], newRerollCount: number, goldSpent: number }`

4. **Reward screen** `src/components/screens/RewardScreen.tsx`:
   - **Gold award:** displayed at top ("You earned X gold!" with gold icon)
   - **Card reveal animation:**
     1. Three cards appear face-down in a fan layout
     2. After 0.3s, first card flips with shimmer effect
     3. After 0.7s, second card flips
     4. After 1.1s, third card flips
     5. Border color visible during flip reveals rarity
   - **Card selection:** click a card to select it (highlight). Click again to confirm OR click "TAKE" button.
   - **Skip button:** always visible. "SKIP" text. Clicking skips all cards.
   - **Reroll button:** shows cost ("REROLL (25g)"). Grayed out if insufficient gold. Clicking triggers new 3-card generation with the same animation. Cost display updates for next reroll.
   - **Gear reward (elite only):** separate section showing 1 gear card with "TAKE" or "SKIP" option.
   - **Continue button:** appears after card decision. Returns to map.

5. **Framer Motion animations** for card flip:
   - Use `rotateY` transform for 3D flip effect
   - Card back (generic design) → card front
   - Add particle/shimmer effect on rare reveals (CSS animation or Framer Motion)

6. **Zustand reward store** or extend `gameStore.ts`:
   - Track current reward offerings
   - Track reroll count for current reward screen
   - Actions: `selectCard`, `skipReward`, `reroll`, `takeGear`, `continueToMap`

### Acceptance Criteria
- [ ] After combat victory, reward screen appears
- [ ] 3 cards animate in sequentially (fan reveal)
- [ ] Cards show correct rarity borders
- [ ] Clicking a card adds it to deck
- [ ] Skip works — no card added
- [ ] Reroll costs gold, generates new cards, cost escalates
- [ ] Reroll disabled when insufficient gold
- [ ] Gold earned is displayed
- [ ] Elite rewards include a gear card
- [ ] After selection/skip, player returns to map
- [ ] Pity timer: after many commons, rare chance increases (verify via test)

### Key Files Created
- `src/engine/rewards/rarityRoller.ts` + test
- `src/engine/rewards/rewardGenerator.ts` + test
- `src/components/screens/RewardScreen.tsx`
- `src/components/cards/CardRewardFan.tsx`

---

## Phase 5: Map System

### Goal
Generate a procedural map DAG for one stage, render it, and let the player navigate through nodes. Each node type leads to the appropriate screen.

### Prerequisites
- Phase 3 & 4 complete (combat and rewards work)

### Tasks

1. **Map generator** `src/engine/map/mapGenerator.ts`:
   - `generateMap(seed: string): MapState`
   - Algorithm:
     1. Create 6 rows between START and BOSS
     2. Each row has 2–3 nodes (use seeded RNG)
     3. Assign node types per distribution rules (PRD Section 11.2)
     4. Generate edges between adjacent rows (each node connects to 1–2 nodes in the next row)
     5. Ensure all nodes are reachable from START
     6. Ensure all row-5 nodes connect to BOSS
     7. Apply constraints (no Elite in row 1, no Shop in row 1, etc.)
   - Return `MapState` with all nodes, edges, and the START node as current
   - Write tests: valid DAG, all nodes reachable, constraints respected, boss reachable from all row-5 nodes

2. **Map types** — should already exist from Phase 1 but verify:
   ```typescript
   interface MapState {
     nodes: MapNode[];
     edges: MapEdge[];
     currentNodeId: string;
     visitedNodeIds: string[];
   }

   interface MapNode {
     id: string;
     type: NodeType; // "combat" | "elite" | "shop" | "rest" | "event" | "boss" | "start"
     row: number;
     column: number;
     x: number; // for rendering position
     y: number;
   }

   interface MapEdge {
     fromId: string;
     toId: string;
   }
   ```

3. **Map view component** `src/components/map/MapView.tsx`:
   - Renders the full map as a vertical scrollable view
   - START at bottom, BOSS at top (player moves upward)
   - Nodes rendered as circles/icons with the node type icon inside
   - Edges rendered as SVG lines connecting nodes
   - Visual states: unvisited (dim), accessible (highlighted/glowing), visited (grayed), current (bright + pulse)
   - Click on an accessible node → navigate to it

4. **Map node component** `src/components/map/MapNode.tsx`:
   - Circle with icon per node type (⚔️ combat, 💀 elite, 🛒 shop, 🏕️ rest, ❓ event, 👑 boss)
   - Tooltip on hover showing node type name

5. **Map screen** `src/components/screens/MapScreen.tsx`:
   - Full-screen map view
   - Sidebar or overlay showing: current HP, gold, deck count, gear count
   - Clicking a node → determine type → transition to appropriate screen
   - After each node is completed → return to this screen with updated state

6. **Navigation logic** in game store:
   - `navigateToNode(nodeId: string)` — validates the node is accessible, updates current position, marks as visited
   - `getAccessibleNodes()` — returns nodes connected by edges from current position that haven't been visited
   - After navigating: depending on node type, set `RunState.phase` to "combat", "shop", "rest", "event", or "boss"

### Acceptance Criteria
- [ ] Map generates with valid structure (6 rows + start + boss)
- [ ] Map renders visually with node icons and connecting lines
- [ ] Player can see which nodes are accessible (adjacent + unvisited)
- [ ] Clicking an accessible node navigates to it
- [ ] After completing a node (combat/shop/etc.), player returns to map
- [ ] Visiting a node marks it as visited (no revisiting)
- [ ] Boss node is always the final destination
- [ ] Map constraints are enforced (no elite/shop in row 1)

### Key Files Created
- `src/engine/map/mapGenerator.ts` + test
- `src/components/map/MapView.tsx`, `MapNode.tsx`, `MapPath.tsx`
- `src/components/screens/MapScreen.tsx`

---

## Phase 6: Shop, Rest & Events

### Goal
Implement the three non-combat node types. After this phase, all node types on the map are functional.

### Prerequisites
- Phase 5 complete (map navigation works)

### Tasks

1. **Shop generator** `src/engine/rewards/shopGenerator.ts`:
   - `generateShop(runState: RunState, rng: SeededRNG): ShopInventory`
   - ShopInventory contains: 3 cards (with prices), 2 gear (with prices), card removal (with escalating price), reroll shop button
   - Pricing per PRD Section 13.2

2. **Shop screen** `src/components/screens/ShopScreen.tsx`:
   - Display cards and gear available for purchase with gold prices
   - Click item → buy (deduct gold, add to deck/inventory)
   - Card removal button → opens deck viewer, click card to remove, deduct gold
   - Reroll shop button → regenerate inventory for gold cost
   - "Leave Shop" button → return to map
   - Items bought are visually removed from shop display

3. **Rest screen** `src/components/screens/RestScreen.tsx`:
   - 3 choices displayed as large buttons/cards:
     - **Heal:** Restore 30% of Max HP (show exact number)
     - **Upgrade:** Open deck viewer, select a card, apply upgrade
     - **Remove:** Open deck viewer, select a card, remove permanently
   - Only 1 choice allowed. After choosing → return to map.

4. **Event engine** `src/engine/events/eventEngine.ts`:
   - `selectEvent(rng: SeededRNG, visitedEventIds: string[]): EventDefinition` — pick a random unvisited event
   - `resolveChoice(runState: RunState, event: EventDefinition, choiceIndex: number): RunState` — apply the chosen outcome

5. **Event screen** `src/components/screens/EventScreen.tsx`:
   - Display event narrative text (2–4 sentences)
   - Display 2–3 choice buttons with brief description of the choice
   - Show mechanical outcome AFTER choosing (e.g., "You gained 30 gold" or "You lost 5 HP and gained a card")
   - "Continue" button → return to map

### Acceptance Criteria
- [ ] Shop displays items with correct prices
- [ ] Buying an item deducts gold and adds item to deck/inventory
- [ ] Card removal works with escalating cost
- [ ] Shop reroll works with gold cost
- [ ] Rest node offers 3 choices (heal/upgrade/remove), only 1 selectable
- [ ] Card upgrade applies correct upgrade effect
- [ ] Events display narrative text and choices
- [ ] Event choices resolve with correct mechanical outcomes
- [ ] All 3 node types return to map after completion

### Key Files Created
- `src/engine/rewards/shopGenerator.ts` + test
- `src/engine/events/eventEngine.ts` + test
- `src/components/screens/ShopScreen.tsx`
- `src/components/screens/RestScreen.tsx`
- `src/components/screens/EventScreen.tsx`

---

## Phase 7: Run Flow & Run-Start Gamble

### Goal
Connect everything into a complete run from main menu → hero select → run-start gamble → map → nodes → boss → victory/defeat. After this phase, the game is playable end-to-end.

### Prerequisites
- Phases 3–6 complete

### Tasks

1. **Master game store** `src/stores/gameStore.ts`:
   - Holds the `RunState` as the top-level state
   - Phase management: `RunState.phase` determines which screen is shown
   - Actions:
     - `startNewRun(heroId: string, seed?: string)` — initialize full RunState
     - `setPhase(phase: RunPhase)` — transition between screens
     - `updateRunState(partial: Partial<RunState>)` — generic state update
     - `endRun(result: "victory" | "defeat")` — clean up, save to history

2. **App router** `src/App.tsx`:
   - Read `gameStore.phase` to determine which screen to render
   - Simple switch/match — no react-router needed
   - Screens: MainMenu, HeroSelect, RunStartGamble, MapScreen, CombatScreen, RewardScreen, ShopScreen, RestScreen, EventScreen, VictoryScreen, DefeatScreen

3. **Main menu** `src/components/screens/MainMenu.tsx`:
   - Game title/logo
   - "New Run" button → hero select
   - "Continue Run" button (if saved run exists) → resume
   - "Collection" button (placeholder for post-MVP)
   - "Settings" button (placeholder)
   - Clean dark UI per Balatro aesthetic

4. **Hero select** `src/components/screens/HeroSelect.tsx`:
   - Display 2 hero cards side by side (Kael and Lira)
   - Each shows: portrait/icon, name, faction, passive ability, hero power, starting HP
   - Hover shows starter deck preview
   - Click to select → transition to run-start gamble

5. **Run-start gamble** `src/components/screens/RunStartGamble.tsx`:
   - "Fate's Offer" title
   - Generate 4 options per PRD Section 12
   - Display as 4 cards/panels with descriptions
   - Risk level visually indicated (safe = green border, moderate = yellow, gamble = red/purple)
   - Click to select one → apply effect → generate map → transition to map screen

6. **Run-start option generator** `src/engine/run/runStartGamble.ts`:
   - `generateRunStartOptions(rng: SeededRNG): RunStartOption[]` — always returns 4 options
   - Templates for each option type:
     - Safe options: gain gold (40–60), remove 1 starter card, gain 3 max HP, gain a random Common card
     - Moderate options: gain random Uncommon card + lose 5 HP, gain 40 gold + gain a Curse, gain a random gear (no choice)
     - Gamble options: replace hero power with random rare hero power, start with random rare relic (could be great or terrible), transform entire starter deck into random cards
   - `applyRunStartOption(runState: RunState, option: RunStartOption): RunState`

7. **Victory screen** `src/components/screens/VictoryScreen.tsx`:
   - "VICTORY" header with celebratory visual
   - Run summary: turns taken, damage dealt, cards played, gold earned, deck size at end, gear equipped
   - "New Run" button → main menu
   - "View Deck" button → show final deck state

8. **Defeat screen** `src/components/screens/DefeatScreen.tsx`:
   - "DEFEAT" header
   - How far you got (which node/row)
   - What killed you (enemy name, damage amount)
   - Run summary stats
   - "Try Again" → main menu

9. **Boss integration:**
   - Boss node on map triggers boss combat
   - Boss data loaded from `bosses.json`
   - Phase 2 mechanic: when boss HP drops below 50%, trigger `transitionBossPhase2` which modifies the enemy's stats and intent pattern
   - On boss defeat → victory screen

### Acceptance Criteria
- [ ] Full run playable from main menu to victory/defeat
- [ ] Hero selection works with both heroes
- [ ] Run-start gamble presents 4 options with correct risk gradient
- [ ] Map generates and is navigable
- [ ] All node types trigger correct screens
- [ ] Boss encounter works with 2 phases
- [ ] Victory screen shows on boss defeat
- [ ] Defeat screen shows on hero death
- [ ] Can start a new run after completing one
- [ ] Run stats tracked and displayed on end screen

### Key Files Created
- `src/stores/gameStore.ts`
- `src/engine/run/runStartGamble.ts` + test
- `src/components/screens/MainMenu.tsx`
- `src/components/screens/HeroSelect.tsx`
- `src/components/screens/RunStartGamble.tsx`
- `src/components/screens/VictoryScreen.tsx`
- `src/components/screens/DefeatScreen.tsx`
- Updated `src/App.tsx`

---

## Phase 8: Persistence & Meta

### Goal
Save run state mid-run (auto-save), save completed run history, and implement basic meta-progression unlocks.

### Prerequisites
- Phase 7 complete

### Tasks

1. **Database setup** `src/db/database.ts`:
   ```typescript
   import Dexie from 'dexie';

   class IronmarkDB extends Dexie {
     activeRun!: Dexie.Table<SerializedRunState, string>;
     runHistory!: Dexie.Table<RunHistoryEntry, string>;
     metaProgress!: Dexie.Table<MetaProgressEntry, string>;

     constructor() {
       super('ironmark');
       this.version(1).stores({
         activeRun: 'id',
         runHistory: 'id, timestamp, result',
         metaProgress: 'key'
       });
     }
   }
   ```

2. **Auto-save:** After each node completion (returning to map), serialize `RunState` to JSON and save to `activeRun` table. On app load, check for active run and offer "Continue" on main menu.

3. **Run history:** On run end (victory or defeat), save a `RunHistoryEntry` with: timestamp, hero, result, duration, stats summary, seed.

4. **Meta-progression:**
   - Track: total runs completed, victories, heroes used
   - Unlock 3rd hero (Heart faction hero, Orin) after 5 completed runs
   - Unlock 9 additional cards (3 per faction) after 10 completed runs
   - Store unlock state in `metaProgress` table
   - On game load: read meta-progress and adjust available heroes/cards

5. **Settings persistence:** Save/load volume, animation speed preferences.

### Acceptance Criteria
- [ ] Refreshing the browser mid-run doesn't lose progress
- [ ] "Continue Run" button works from main menu
- [ ] Completed runs appear in run history
- [ ] After 5 runs, 3rd hero becomes available
- [ ] After 10 runs, additional cards appear in the reward pool

### Key Files Created
- `src/db/database.ts`
- `src/engine/run/metaProgression.ts` + test
- Updated game store with save/load actions

---

## Phase 9: Polish & Animation

### Goal
Add the "juice" that makes the game feel good. Card animations, screen transitions, damage effects, sound hooks.

### Prerequisites
- Phase 7+ complete (game is playable end-to-end)

### Tasks

1. **Card play animation:** Card flies from hand to board (allies) or to target (spells) using Framer Motion `layoutId` or `animate`.

2. **Damage popups:** Implement floating damage numbers with Framer Motion. Red for damage, green for heal, yellow for armor. Stack vertically if multiple hits occur simultaneously.

3. **Screen transitions:** Fade or slide transitions between screens using Framer Motion `AnimatePresence`.

4. **Mana crystal animation:** Crystals fill with a brief glow when mana is gained at turn start.

5. **Enemy death:** Enemies shatter/fade when HP reaches 0.

6. **Card reward flip animation:** Implement the full 3D flip using `rotateY` transform. Card back is a generic dark design. Rarity border glows during the flip.

7. **Hero damage feedback:** Brief red screen flash + screen shake when hero takes damage.

8. **Hover states:** All interactive elements have visible hover feedback.

9. **Sound effect hooks:** Create a `src/utils/audio.ts` module with `playSound(soundId)` function. Stub implementations that can be wired to audio files later. Call hooks at appropriate points (card play, damage, victory, etc.). Make all audio optional/toggleable.

10. **Animation speed control:** Settings option for 1x (default), 2x (double speed), or Skip (instant resolution). Store in settings.

### Acceptance Criteria
- [ ] Card play has visible motion animation
- [ ] Damage popups float and fade
- [ ] Screen transitions are smooth (no jarring snaps)
- [ ] Card rewards flip with 3D effect
- [ ] All animations respect speed setting
- [ ] Game feels "juicy" — interactions have visual feedback

### Key Files Created
- `src/utils/audio.ts`
- `src/hooks/useAnimation.ts`
- Updated components with Framer Motion animations

---

## Phase 10: Balancing & Playtesting

### Goal
Tune all numbers (card stats, enemy HP, gold rewards, mana costs) through iterative playtesting. This is an ongoing process, not a one-time task.

### Prerequisites
- Phase 7+ complete

### Tasks

1. **Play 10 complete runs.** Log issues:
   - Cards that are never picked (too weak or too expensive)
   - Cards that are always picked (too strong or too cheap)
   - Encounters that are too easy or too hard for their row
   - Boss that is too easy or too hard
   - Gold economy (too much/too little gold)
   - Run length (too short/too long)

2. **Balance pass — card stats:**
   - Adjust mana costs, attack/health values in JSON files
   - Ensure each faction has at least 2 viable build archetypes

3. **Balance pass — economy:**
   - Adjust gold rewards, shop prices, reroll costs
   - Ensure players can afford ~2 shop purchases per run if they don't reroll
   - Ensure rerolling feels impactful but expensive

4. **Balance pass — enemies:**
   - Adjust enemy HP and attack values
   - Ensure early encounters don't kill the player before they can build
   - Ensure late encounters are threatening even with a strong deck

5. **Balance pass — gear tradeoffs:**
   - Every downside should matter for at least one build
   - No gear should be universally good or universally bad

6. **Balance pass — boss:**
   - Phase 1 should be manageable with a decent deck
   - Phase 2 should be a genuine threat that requires strategy
   - Average player should win ~40–50% of runs after learning the game

7. **Write a `BALANCE_LOG.md`** documenting all changes and rationale.

### Acceptance Criteria
- [ ] At least 10 full playtests completed
- [ ] Win rate is approximately 40–50% for an experienced player
- [ ] No single dominant strategy
- [ ] All 3 factions feel viable
- [ ] Average run takes 15–25 minutes
- [ ] BALANCE_LOG.md exists with change history

---

## CLAUDE.md Addendum — Working with This Codebase

When Claude Code (or any AI assistant) works on this project, follow these rules:

### Before writing any code:
1. Read `PRD.md` for game design context
2. Read the relevant phase section in this document
3. Read existing type definitions in `src/engine/types/`
4. Read existing tests to understand patterns

### When implementing game logic:
1. Write the function in `src/engine/`
2. Write tests in the same directory (`*.test.ts`)
3. Run tests: `npm test -- --run`
4. Only after tests pass, integrate with Zustand store
5. Only after store works, build/update React component

### When modifying card balance:
1. Edit ONLY the JSON files in `src/data/`
2. Never change card stats in code
3. Run data validation tests after changes

### When creating React components:
1. Use Tailwind CSS for styling
2. Use Framer Motion for animations
3. Keep components small (<150 lines)
4. Use the existing Card component for all card rendering
5. Access game state through Zustand stores, not prop drilling

### Commit messages:
Follow conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `style:`
Example: `feat: implement keyword resolver for Strike and Deathblow`

---

*End of Implementation Plan. Build phase by phase. Test as you go. Ship when Phase 7 is complete.*
