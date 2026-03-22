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
| BUG-002 | P0 | HP not persisting after combat | Fixed `onCombatEnd` to sync `combat.player.hp` back to `run.hp` |
| BUG-003 | P1 | Combat starts at Turn 2 instead of Turn 1 | Moved first `startTurn()` into `initCombat` store action instead of component effect |
| BUG-004 | P1 | Run summary stats all zero | Added `extractCombatStats()` and accumulate into RunState via `onCombatEnd` |
| BUG-005 | P1 | Gear from events not equipped | All gear-granting paths (events, shop, rewards, gamble) now call `equipGear()` |
| BUG-006 | P2 | React duplicate key errors on card lists | Fixed duplicate keys in RestScreen and ShopScreen with index-based suffixes |
| UI-005 | P1 | Card names truncated across all screens | Replaced `truncate` with word-break wrapping in Card component |
| UI-006 | P2 | Card rows overflow/clip at viewport edges | Added `overflow-x-auto`, `flex-wrap`, and responsive padding to card containers |
| UI-007 | P3 | Unaffordable shop items lack visual indicator | Added `opacity-60 grayscale-[30%]` for unaffordable items |
| UX-002 | P1 | Ally targeting — let player choose attack target | Added multi-step targeting flow with per-ally enemy selection UI |
| UX-003 | P2 | Card tooltips — show keyword explanations on hover | Added `keywordDescriptions` with `title` tooltips on keyword badges |
| UX-004 | P2 | Tutorial / onboarding flow | Added 6-step tutorial overlay with "How to Play" button on main menu |
| UX-005 | P2 | Better feedback on card play (damage numbers, heal) | Added DamagePopup component with floating damage/heal numbers |
| UI-001 | P2 | Map screen redesign | Redesigned with gradient background, radial decoration, HP color coding |
| UI-002 | P2 | Card art / icons — replace placeholder text | Added faction-specific icons for allies and spells in Card component |
| UI-003 | P2 | General UI polish — less "vibecoded" look | Consistent color palette, spacing, typography across combat/map screens |
| UI-004 | P3 | Battle screen layout — board-style ally/enemy rows | Added labeled enemy/ally rows with VS divider in CombatScreen |
| BAL-003 | P2 | Encounter difficulty tuning (Act 1 too hard?) | Reduced Bandit Thug, Orc Warrior, Stone Golem HP/attack values |
| BAL-004 | P2 | Card balance pass — review all card stats | Buffed Ashblade Recruit attack, fixed Blood Frenzy target to all_allies |
| BAL-005 | P3 | Relic balance and variety | Added 4 new relics: Iron Ring, Ember Stone, Healer's Charm, Crystal Skull |
| FEAT-001 | P2 | Event system — more event variety | Added 5 new events (Ancient Forge, Goblin Gambler, Fallen Hero, Poisoned Spring, Mysterious Statue) |
| FEAT-002 | P3 | Save/load run state to localStorage | Already implemented via Dexie DB with auto-save on map return and Continue Run button |

| UX-006 | P2 | Uniform walkthrough dialog sizes | Fixed width + min-height on tutorial overlay so buttons don't shift |
| UX-007 | P2 | Tooltips for hero powers, passives, enemy intents | Added title tooltips to hero power button, hero passive, intent badges |
| BAL-006 | P1 | No rest node on first map row | Added 'rest' to row-0 constraint in mapGenerator |
| UI-008 | P1 | Vertical battle board layout (Hearthstone-style) | Enemies top, allies + hero bottom, replaced horizontal layout |
| AI-001 | P1 | Enemy AI targets allies instead of always hero | 70% chance to attack lowest-HP ally when allies present, 30% hero |

---

## In Progress

| ID | Priority | Task | Notes |
|----|----------|------|-------|

---

## Backlog

| ID | Priority | Task | Notes |
|----|----------|------|-------|

---

## Nice to Have

> Future ideas to explore once core gameplay is solid.

| ID | Priority | Task | Notes |
|----|----------|------|-------|
| NICE-001 | P3 | Speed stat affecting attack order | Add speed variable to allies/enemies that determines turn order in combat |
| NICE-002 | P3 | Keyboard navigation improvements | Arrow keys, tab order, focus management across all screens |
