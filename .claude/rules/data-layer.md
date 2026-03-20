---
paths:
  - "src/data/**"
---

# Data Layer Rules

<important if="you are editing JSON data files or the data loader">
- All card/enemy/event/gear/hero definitions live as JSON in `src/data/`
- Balance changes = JSON edits ONLY, never code changes to engine
- Every card object MUST have: `id`, `name`, `type`, `faction`, `rarity`, `cost`, `keywords`
- Valid keywords: strike, echo, blessing, ward, taunt, deathblow, burn, poison, fury
- Hero starter decks MUST contain exactly 10 card IDs
- Gear cards MUST have both `upside` and `downside` fields
- Card costs: 0–8 inclusive. Enemy HP: > 0
- IDs MUST be unique across all card/gear collections
- Run `validateData()` from `src/data/dataLoader.ts` after changes to verify integrity
</important>

## Directory layout
- `cards/` — `heart.json`, `might.json`, `wisdom.json`, `neutral.json` (by faction)
- `enemies/` — `stage1.json`, `bosses.json` (by tier/type)
- `events/` — `stage1Events.json` (by stage)
- `gear/` — `allGear.json`
- `heroes/` — `heroes.json`
