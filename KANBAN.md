# IRONMARK — Kanban Board

> Task tracker for cross-session agent work. Update status as tasks progress.

## Legend
- **Priority**: P0 = blocker, P1 = high, P2 = medium, P3 = nice-to-have
- **Status**: Backlog → In Progress → Done

---

## Done

| ID | Priority | Task | Notes |
|----|----------|------|-------|
| BUG-001 | P0 | Fix draw card effects (spells, hero power, keywords) | Draw was no-op in playSpellCard, useHeroPower, resolveStrike, resolveDeathblow |
| BAL-001 | P1 | Rebalance shop prices (cards, gear, removal, reroll) | Reduced all prices ~30-40% so first shop is usable |
| BAL-002 | P1 | Increase combat/elite gold rewards | Combat 15-25g, Elite 25-40g |
| UX-001 | P1 | Add upgrade preview on rest screen | Show before/after comparison when selecting a card |

---

## In Progress

| ID | Priority | Task | Notes |
|----|----------|------|-------|

---

## Backlog

| ID | Priority | Task | Notes |
|----|----------|------|-------|
| BUG-002 | P0 | HP not persisting after combat | Hero HP resets to max when returning to map; `onCombatEnd` in gameStore.ts doesn't sync `combat.player.hp` back to `run.hp` |
| BUG-003 | P1 | Combat starts at Turn 2 instead of Turn 1 | Every combat shows "Turn 2" on first player action; likely double-increment in combatEngine.ts turn init |
| BUG-004 | P1 | Run summary stats all zero | Defeat screen shows Turns/Damage/Cards/Enemies all as 0; combat stats not accumulated into run state |
| BUG-005 | P1 | Gear from events not equipped | Event grants gear (e.g. Healing Salve) to `gearInventory` but never calls `equipGear`; combat slots stay empty |
| BUG-006 | P2 | React duplicate key errors on card lists | Rest upgrade screen triggers "Encountered two children with the same key" for duplicate cards; need unique instance keys |
| UI-005 | P1 | Card names truncated across all screens | "Ashblade Rec...", "Emberheart Knig...", "Divine Restor..." — card name overflow on hero selection, hand, shop, rest, rewards |
| UI-006 | P2 | Card rows overflow/clip at viewport edges | Hero selection, Fate's Offer, and hand cards are clipped on left/right edges; needs responsive layout or horizontal scroll |
| UI-007 | P3 | Unaffordable shop items lack visual indicator | Cards too expensive to buy appear identical to affordable ones (no grayed price or disabled state) |
| UX-002 | P1 | Ally targeting — let player choose attack target | Currently auto-targets enemies[0]; needs target selection UI |
| UX-003 | P2 | Card tooltips — show keyword explanations on hover | Strike, Deathblow, Echo, Ward, Taunt, Burn, Fury |
| UX-004 | P2 | Tutorial / onboarding flow | First-run guidance for new players |
| UX-005 | P2 | Better feedback on card play (damage numbers, heal) | Float numbers, flash effects |
| UI-001 | P2 | Map screen redesign | Current map is functional but plain |
| UI-002 | P2 | Card art / icons — replace placeholder text | Use generated pixel art or SVG icons |
| UI-003 | P2 | General UI polish — less "vibecoded" look | Consistent color palette, spacing, typography |
| UI-004 | P3 | Battle screen layout — board-style ally/enemy rows | Visual board with ally row vs enemy row |
| BAL-003 | P2 | Encounter difficulty tuning (Act 1 too hard?) | Review enemy HP/damage scaling per floor |
| BAL-004 | P2 | Card balance pass — review all card stats | Some cards may be dead picks |
| BAL-005 | P3 | Relic balance and variety | Add more relics, tune existing ones |
| FEAT-001 | P2 | Event system — more event variety | Only basic events exist currently |
| FEAT-002 | P3 | Save/load run state to localStorage | Persist runs across browser sessions |
