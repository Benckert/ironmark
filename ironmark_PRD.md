# Project Codename: IRONMARK — Product Requirements Document

> **Last updated:** 2026-03-19
> **Status:** Pre-development
> **Document type:** Source of Truth — all implementation decisions derive from this document
> **Target platform:** Web (desktop browser, responsive for tablet)
> **Play mode:** Solo only (co-op and versus deferred to post-MVP)

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Game Overview](#2-game-overview)
3. [Core Loop](#3-core-loop)
4. [Run Structure](#4-run-structure)
5. [Combat System](#5-combat-system)
6. [Card System](#6-card-system)
7. [Factions](#7-factions)
8. [Keywords & Synergies](#8-keywords--synergies)
9. [Gear System (Tradeoff Mechanic)](#9-gear-system-tradeoff-mechanic)
10. [Reward & Gambling Systems](#10-reward--gambling-systems)
11. [Map & Navigation](#11-map--navigation)
12. [Run-Start Gamble](#12-run-start-gamble)
13. [Shop System](#13-shop-system)
14. [Enemy & Encounter Design](#14-enemy--encounter-design)
15. [Boss Design](#15-boss-design)
16. [Event System](#16-event-system)
17. [Meta-Progression](#17-meta-progression)
18. [Difficulty Scaling](#18-difficulty-scaling)
19. [Card Data Schema](#19-card-data-schema)
20. [UI/UX Requirements](#20-uiux-requirements)
21. [Audio & Animation](#21-audio--animation)
22. [Technical Architecture](#22-technical-architecture)
23. [MVP Scope Definition](#23-mvp-scope-definition)
24. [Post-MVP Roadmap](#24-post-mvp-roadmap)
25. [Open Questions & Design Risks](#25-open-questions--design-risks)
26. [Glossary](#26-glossary)

---

## 1. Vision & Goals

### 1.1 Elevator Pitch

A solo roguelite fantasy deckbuilder where every piece of gear has an upside and a downside, every reward is a gamble, and every run tells a different story through emergent card synergies. Think Slay the Spire's structure meets Brotato's tradeoff items meets Hearthstone's keyword system, wrapped in a dark fantasy theme.

### 1.2 Design Pillars

1. **Gambling as philosophy** — Randomness determines what options appear; the player determines which options matter. Weighted RNG with limited rerolls at run start and between encounters. The thrill of uncertainty is a feature, not a bug.
2. **Tradeoff-driven gear** — Every gear card boosts something and weakens something else. The player who wins is the one who turns downsides into irrelevancies through clever build synergy.
3. **Keyword combos & emergent synergy** — Cards carry keyword abilities that interact through rules, not hard-coded scripts. Discovering powerful keyword combinations is the core skill expression.
4. **Roguelite freshness** — No two runs play the same. Procedural dungeon paths, randomized rewards, and lean deckbuilding where removing cards matters as much as adding them.
5. **Respect the player's time** — A full run takes 20–30 minutes. Individual encounters resolve in 2–4 minutes. No grinding, no filler, no mandatory tutorials after the first run.

### 1.3 Target Audience

- Primary: Players who enjoy Slay the Spire, Balatro, Inscryption, Monster Train
- Secondary: Players who enjoy Brotato, Hades, Risk of Rain 2
- Complexity target: Medium — accessible to newcomers within 1–2 runs, with depth that rewards 100+ hours of play

### 1.4 Success Metrics (Internal)

- A playtest session where someone voluntarily starts a second run immediately after finishing the first
- At least 3 distinct viable build archetypes per faction
- Average run duration of 15–25 minutes
- No single dominant strategy after 50+ test runs

---

## 2. Game Overview

### 2.1 Genre

Solo roguelite deckbuilder with gambling-flavored reward systems.

### 2.2 Theme & Setting

Dark fantasy. A shattered world of fallen kingdoms, corrupted magic, and forgotten gods. The player is a wandering hero delving into procedurally generated dungeons — each run is a different expedition into the unknown. The tone sits between Lord of the Rings' gravitas and Slay the Spire's mechanical abstraction — lore exists through card flavor text and event narratives, not cutscenes.

### 2.3 Core Fantasy

"I built something broken and beautiful from random parts, and it barely worked." The player should feel like a scavenger-engineer, assembling a war machine from whatever the dungeon throws at them, turning other players' trash into their treasure through creative thinking.

---

## 3. Core Loop

```
┌─────────────────────────────────────────────────────────┐
│                    THE CORE LOOP                         │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐   │
│  │  Choose   │───▶│  Navigate │───▶│  Enter Encounter │   │
│  │  Map Node │    │  to Node  │    │  (Combat/Event/  │   │
│  └──────────┘    └──────────┘    │   Shop/Rest)      │   │
│       ▲                          └────────┬─────────┘   │
│       │                                   │              │
│       │          ┌──────────────┐         │              │
│       │          │  Receive     │         │              │
│       └──────────│  Rewards     │◀────────┘              │
│                  │  (Gamble!)   │                         │
│                  └──────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

The loop repeats until the player defeats the stage boss or dies. Each iteration takes 2–5 minutes.

---

## 4. Run Structure

### 4.1 MVP Run Structure (1 Stage)

```
[Run-Start Gamble] → [Map: 7–9 nodes with branching paths] → [Boss] → [Victory/Death]
```

A single stage contains:
- **4 Combat nodes** (normal encounters)
- **1 Elite node** (harder encounter, better rewards + relic)
- **1 Shop node** (buy cards, gear, remove cards)
- **1 Rest node** (heal OR upgrade a card OR remove a card)
- **1 Event node** (narrative choice with mechanical consequences)
- **1 Boss node** (end of stage, must defeat to win the run)

Nodes are arranged in a branching graph (see Section 11) so the player must choose a path through 5–6 nodes before reaching the boss. Not all nodes are visited in a single run.

### 4.2 Full Run Structure (Post-MVP, 3 Stages)

```
[Run-Start Gamble]
  → [Stage 1: ~9 nodes + Boss 1]
  → [Path Choice: pick 1 of 2–3 Stage 2 themes]
  → [Stage 2: ~9 nodes + Boss 2]
  → [Path Choice: pick 1 of 2–3 Stage 3 themes]
  → [Stage 3: ~9 nodes + Final Boss]
  → [Victory/Death]
```

### 4.3 Run State

At any point during a run, the following state exists:

| State | Initial Value | Changes During Run |
|-------|--------------|-------------------|
| Hero | Chosen at run start | Never changes |
| HP | Hero's starting HP (25–30) | Combat damage, healing, gear effects |
| Max HP | Same as starting HP | Can be modified by gear/events |
| Mana | 1 (turn 1 of first encounter) | +1 per turn, resets each encounter to 1 |
| Max Mana | 8 | Rarely modified |
| Gold | 0 | Earned from encounters, spent in shops/rerolls |
| Deck | Hero's 10-card starter | Cards added/removed/upgraded |
| Gear | Empty (0/4 slots) | Gear equipped from rewards/shop |
| Relics | 0–1 from run-start gamble | Gained from elites/events |
| Current Node | Start | Advances through map |

---

## 5. Combat System

### 5.1 Overview

Combat is **sequential and turn-based**, inspired by Slay the Spire. The player plays cards one at a time from their hand, each resolving immediately. Enemies telegraph their next action (displayed as an intent icon above them), and the player's job is to react optimally given their hand and board state.

### 5.2 Turn Structure

```
TURN START
  1. Gain mana: current_max_mana = min(turn_number, 8). Refill to current_max_mana.
     - Turn 1 = 1 mana, Turn 2 = 2 mana, ... Turn 8+ = 8 mana.
  2. Draw cards: draw up to hand_size (default 5). If deck is empty, shuffle discard into deck first.
  3. Trigger "start of turn" effects (Poison ticks, Burn ticks, gear effects).
  4. Reveal enemy intents for this turn.

PLAYER ACTION PHASE (no time limit)
  5. Player may play any number of cards from hand (limited by mana).
     - Ally cards: placed onto the board (max 4 allies in play).
     - Spell cards: effect resolves immediately, card goes to discard.
     - Gear cards: equipped to hero (max 4 gear slots), replaces if full.
  6. Player may activate Hero Power (once per turn, costs mana).
  7. Player may choose to END TURN at any time.

ENEMY PHASE
  8. Each enemy executes its telegraphed intent (attack, buff, summon, etc.) in order (left to right).
     - Attack damage hits the hero directly (no ally blocking unless Taunt).
     - If an ally has Taunt, enemy attacks redirect to that ally.
  9. Trigger "end of turn" effects for both sides.

TURN END
  10. Discard all remaining cards in hand.
  11. Advance turn counter. Repeat from TURN START.
```

### 5.3 Combat Resolution Rules

- **Damage:** Reduces target HP. When HP reaches 0, the unit dies.
- **Overkill:** Excess damage is lost (does not carry over to other targets).
- **Ally death:** Triggers Deathblow keywords if present. Card goes to a "graveyard" (not discard pile — cannot be redrawn during this encounter).
- **Hero death:** HP reaches 0 → run ends immediately. No revives in base game.
- **Victory condition:** All enemies are dead. Proceed to reward screen.
- **No turn limit:** Encounters do not have a timer. (Post-MVP: some bosses may introduce turn-pressure mechanics.)

### 5.4 Targeting

- **Single-target spells/attacks:** Player clicks the target enemy.
- **AoE (Area of Effect):** Hits all enemies automatically (no targeting needed).
- **Self-target:** Buffs/heals that affect the hero or a friendly ally — player clicks the target ally.
- **Random target:** System selects randomly, highlighted before resolution.

### 5.5 Enemy Intents

Enemies display their planned action at the start of each turn:

| Intent Icon | Meaning | Display |
|-------------|---------|---------|
| ⚔️ Sword | Attack for X damage | Shows damage number |
| 🛡️ Shield | Gain X armor | Shows armor number |
| 💀 Skull | Debuff / apply status | Shows status name |
| ➕ Plus | Buff self or ally | Shows buff name |
| 📢 Horn | Summon reinforcements | Shows summon type |
| ❓ Unknown | Boss-only: hidden intent | No information |

### 5.6 Board Layout

```
┌─────────────────────────────────────────────────┐
│  ENEMY SIDE                                      │
│  [Enemy 1]  [Enemy 2]  [Enemy 3]  (max 4)      │
│  Intent: ⚔️8  Intent: 🛡️5  Intent: 💀Poison   │
├─────────────────────────────────────────────────┤
│  HERO AREA                                       │
│  [Ally 1]  [Ally 2]  [Ally 3]  [Ally 4] (max 4)│
│                                                  │
│  [Hero Portrait]  HP: 22/28  Mana: 3/4          │
│  Gear: [Slot1] [Slot2] [Slot3] [Slot4]          │
├─────────────────────────────────────────────────┤
│  HAND                                            │
│  [Card] [Card] [Card] [Card] [Card]             │
│         Deck: 12    Discard: 3                   │
└─────────────────────────────────────────────────┘
```

---

## 6. Card System

### 6.1 Three Card Types

Every card in the game is one of exactly three types:

#### 6.1.1 Ally Cards

Persistent board presence. Played from hand to the board. Remain in play until killed.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name |
| `type` | "ally" | Always "ally" |
| `cost` | number (0–8) | Mana cost to play |
| `attack` | number (0–10) | Damage dealt when attacking |
| `health` | number (1–12) | Max HP; dies at 0 |
| `keywords` | Keyword[] | Special abilities |
| `faction` | Faction | Might, Wisdom, Heart, or Neutral |
| `rarity` | Rarity | Common, Uncommon, Rare |
| `flavorText` | string | Lore/atmosphere text |

**Ally behavior:** At the end of the player's action phase (before enemy phase), all allies in play automatically attack. Each ally deals its `attack` value to a target enemy. If only one enemy exists, all allies attack it. If multiple enemies exist, the player assigns targets during the action phase.

**Max board size:** 4 allies. Playing a 5th requires sacrificing one already in play.

#### 6.1.2 Spell Cards

One-time effects. Played from hand, resolve immediately, then go to discard pile.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name |
| `type` | "spell" | Always "spell" |
| `cost` | number (0–8) | Mana cost to play |
| `effect` | Effect | What happens when played |
| `keywords` | Keyword[] | Special abilities (e.g., Echo) |
| `faction` | Faction | Might, Wisdom, Heart, or Neutral |
| `rarity` | Rarity | Common, Uncommon, Rare |
| `flavorText` | string | Lore text |

**Effect types include:** deal damage (single/AoE), heal (hero/ally), draw cards, gain armor, apply status effects, manipulate deck (search, reorder top cards), destroy target, summon a temporary ally.

#### 6.1.3 Gear Cards

Persistent modifiers attached to the hero. **Every gear card has both an upside and a downside.**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name |
| `type` | "gear" | Always "gear" |
| `cost` | number (0–6) | Mana cost to equip |
| `upside` | Effect | Positive ongoing effect |
| `downside` | Effect | Negative ongoing effect |
| `keywords` | Keyword[] | Keyword interactions (rare on gear) |
| `faction` | Faction | Might, Wisdom, Heart, or Neutral |
| `rarity` | Rarity | Common, Uncommon, Rare |
| `flavorText` | string | Lore text |

**Max gear slots:** 4. Equipping a 5th requires discarding one. Discarded gear goes to a void (not discard pile — it's gone for the run).

**Gear is not drawn from deck.** When a gear card is added to the player's collection (from rewards/shop), it goes into a separate gear inventory. Gear is equipped from the gear inventory at any time during the player's action phase in combat, costing mana. Once equipped, it stays equipped for the remainder of the run (not just the encounter).

**Design change from original GDD:** Gear is NOT shuffled into the player's deck. This prevents "dead draw" situations where you draw gear you've already equipped. Gear exists in a separate inventory and can be equipped during any combat.

### 6.2 Card Rarities

| Rarity | Color | Relative Power | Cards per Faction |
|--------|-------|---------------|-------------------|
| **Common** | White/Gray | Low | ~8–10 |
| **Uncommon** | Blue | Medium | ~6–8 |
| **Rare** | Gold | High / build-defining | ~3–4 |

### 6.3 Card Upgrades

Cards can be upgraded once (at Rest nodes or via events). Upgrades are permanent for the run. Upgraded cards gain a "+" suffix and a visual glow.

Upgrade effects:
- Ally: +1 Attack or +1 Health (whichever makes more sense for the card)
- Spell: −1 Mana Cost (minimum 0) OR +50% effect magnitude
- Gear: Upside increases by ~30% OR downside decreases by ~30%

### 6.4 Starter Decks

Each Hero begins with a **10-card starter deck** composed of weak-but-functional cards from their faction:

**Standard composition per faction:**
- 4× Basic Ally (1-cost, 1/2 stats — minimal but present)
- 3× Basic Spell (1-cost, deal 2 damage or equivalent)
- 2× Basic Spell variant (0–1 cost, draw 1 card or block 3 damage)
- 1× Faction-specific signature card (2-cost, introduces faction mechanic)

---

## 7. Factions

Three factions at MVP, with a fourth (Shadow) planned for post-MVP.

### 7.1 Might (Red)

**Theme:** Warriors, knights, berserkers, fire. Direct confrontation and overwhelming force.

**Mechanical identity:**
- Highest Attack values on allies
- Direct damage spells (single-target and AoE)
- Self-buffing effects (+Attack, +Damage)
- "When this attacks" triggers
- Gear that trades defense/utility for raw power

**Signature keyword:** **Strike** — triggers an additional effect whenever this unit attacks.

**Strengths:** Damage output, board pressure, speed (kills enemies fast)
**Weaknesses:** No healing, poor card draw, fragile to sustained fights

**Playstyle:** Aggressive. Kill enemies before they kill you. Lean deck with high-attack allies and burn spells. Gear that maximizes damage at the cost of survivability.

**Hero example — Kael, Ashwalker:**
- Passive: "Whenever you play an Ally, it gains +1 Attack this turn."
- Hero Power (2 mana): Deal 2 damage to a target enemy.
- Starting HP: 28

### 7.2 Wisdom (Blue)

**Theme:** Wizards, scholars, seers, ice/arcane. Knowledge and manipulation.

**Mechanical identity:**
- Highest card draw and deck manipulation
- Cheap/free spells with "when you cast a spell" triggers
- Weak allies with powerful abilities
- Spell-synergy chains (playing spells makes future spells stronger)
- Gear that trades ally power for spell power

**Signature keyword:** **Echo** — after playing this card, return it to your hand once before it discards permanently.

**Strengths:** Card advantage, flexibility, spell combos, deck manipulation
**Weaknesses:** Low ally stats, vulnerable to early aggression, dependent on finding combo pieces

**Playstyle:** Control. Draw cards, thin your deck, chain spells for devastating combo turns. Win through efficiency rather than brute force.

**Hero example — Lira, Frostweaver:**
- Passive: "Spells cost 1 less mana (minimum 0). Allies cost 1 more."
- Hero Power (1 mana): Draw 1 card.
- Starting HP: 25

### 7.3 Heart (Gold)

**Theme:** Clerics, druids, protectors, nature/light. Endurance and fortification.

**Mechanical identity:**
- Healing spells (hero and ally HP recovery)
- High-health allies with defensive keywords (Ward, Taunt)
- Shield/armor generation
- Sustain over time — outlast the enemy
- Gear that trades offensive power for survivability

**Signature keyword:** **Blessing** — gives a persistent buff to a target ally until end of combat.

**Strengths:** Survivability, healing, ally protection, long-fight advantage
**Weaknesses:** Very low damage output, slow, struggles against enemies that scale over time

**Playstyle:** Defensive. Build a wall of high-health allies, keep them alive with heals and wards, and slowly grind enemies down. Win through attrition.

**Hero example — Orin, Stonekeeper:**
- Passive: "At the end of your turn, heal your lowest-HP ally for 2."
- Hero Power (2 mana): Give an ally +2 Health and Ward.
- Starting HP: 32

### 7.4 Neutral

A small pool of ~8–10 cards available to all heroes. Generalist cards with decent stats but no keywords. Safe picks for filling gaps but never the core of a strategy.

### 7.5 Cross-Faction Drafting

During a run, rewards may offer cards from ANY faction (weighted toward the player's own faction — see Section 10). Drafting off-faction cards provides new capabilities but dilutes keyword density, creating a meaningful tension between coverage and synergy.

**Weighting:** 60% own faction, 25% other available factions combined, 15% neutral.

---

## 8. Keywords & Synergies

### 8.1 Core Keywords (MVP Set)

| Keyword | Description | Found On | Faction Affinity |
|---------|------------|----------|-----------------|
| **Strike** | Triggers a bonus effect when this ally attacks | Allies | Might |
| **Echo** | After playing, return this to hand once | Spells | Wisdom |
| **Blessing** | Give a persistent buff to target ally | Spells, Allies | Heart |
| **Ward** | Blocks the next instance of damage, then consumed | Allies, Spells | Heart |
| **Taunt** | Enemies must attack this ally first | Allies | Heart, Neutral |
| **Deathblow** | Triggers an effect when this ally dies | Allies | Might, Neutral |
| **Burn X** | Target takes X damage at the start of each turn (stacks) | Spells, Allies | Might |
| **Poison X** | Target takes X damage at the start of each turn (stacks, ignores armor) | Spells | Neutral |
| **Fury** | Gains +1 Attack each time this ally takes damage | Allies | Might |

### 8.2 Keyword Interaction Rules

Keywords follow simple rules that create emergent combos:

1. **Stacking:** Burn and Poison stack additively. Applying Burn 2 to a target with Burn 3 results in Burn 5.
2. **Ward consumption:** Ward absorbs the entire first damage instance regardless of amount, then is removed. A new Ward can be applied afterward.
3. **Taunt priority:** If multiple allies have Taunt, the leftmost one is targeted first.
4. **Strike timing:** Strike triggers resolve after attack damage is dealt but before the target's Deathblow (if the target dies).
5. **Deathblow timing:** Triggers after the killing blow resolves. If multiple allies die simultaneously, Deathblows resolve left to right.
6. **Echo timing:** Echo returns the card to hand at the end of the current resolution. The returned copy costs its normal mana and can be played again this turn if mana allows.
7. **Blessing duration:** Blessing buffs persist until end of the current combat encounter, not just end of turn.

### 8.3 Designed Synergy Examples

These emerge from rules, not hard-coded interactions:

| Combo Name | Faction Mix | How It Works |
|------------|-------------|-------------|
| Burn Engine | Might pure | Strike allies that apply Burn when attacking. More allies = more Burn stacking. |
| Spell Storm | Wisdom pure | Echo spells + "when you cast a spell" triggers = chain multiple spell casts in one turn. |
| Immortal Wall | Heart pure | Taunt + Ward + Blessing (reapply Ward). Allies absorb all damage indefinitely. |
| Sacrifice Engine | Might + Heart | Deathblow allies that summon tokens + Heart spells that heal/buff tokens. |
| Attrition Control | Wisdom + Heart | Card draw to find answers + healing to survive. Win slowly with Poison from neutral cards. |
| Glass Cannon | Might + Wisdom | Card draw to find damage spells + Might damage buffs. Fragile but explosive turns. |

---

## 9. Gear System (Tradeoff Mechanic)

### 9.1 Core Rule

**Every gear card in the game has an upside AND a downside. No exceptions.**

This is the game's signature mechanic and primary differentiator. It must be preserved across all expansions and updates.

### 9.2 Tradeoff Design Principles

1. **Downsides must be real.** A −1 to an irrelevant stat is not a meaningful downside. Each downside should be painful for at least one common build archetype.
2. **Downsides must be buildable-around.** A player who deliberately avoids the stat being penalized should feel smart, not lucky.
3. **Upsides and downsides should affect different axes.** An item that gives +3 Attack / −2 Attack is boring. An item that gives +3 Attack / −1 Card Draw creates a meaningful tradeoff between two different strategic dimensions.
4. **Rare gear has bigger swings.** Common gear: +2/−1. Uncommon gear: +3/−2. Rare gear: +5/−3 or transformative effects with harsh restrictions.
5. **Some downsides should create build directions.** "Cannot heal" is not just a restriction — it's a signal to build around lifesteal, ward, or max-HP buffs instead.

### 9.3 Gear Examples by Rarity

#### Common Gear (small swings, accessible)

| Name | Upside | Downside |
|------|--------|----------|
| Iron Gauntlets | +1 Attack to all allies | Hero takes +1 damage from spells |
| Traveler's Cloak | +1 Card Draw per turn | −5 Max HP |
| Healing Salve | Heal 1 HP at end of each turn | Spells cost +1 mana |
| Sharpening Stone | +2 damage on first attack each turn | Allies have −1 Health |

#### Uncommon Gear (moderate swings, build-defining)

| Name | Upside | Downside |
|------|--------|----------|
| Berserker's Axe | +3 Attack to hero | All healing received is halved |
| Blood Ruby Pendant | +1 Card Draw per turn | Lose 2 HP at start of each turn |
| Iron Crown | All allies gain +2 Health | Hero takes +2 damage from all sources |
| Mage's Focus | Spells deal +2 damage | Cannot play more than 1 Ally per turn |

#### Rare Gear (extreme swings, run-defining)

| Name | Upside | Downside |
|------|--------|----------|
| Cursed Grimoire | First spell each turn costs 0 mana | When you play a spell, discard a random card |
| Healer's Vow | Heal 3 HP at end of each turn | Cannot equip gear that gives +Attack |
| Goblin Lockpicks | +100% gold from encounters | −8 Max HP permanently |
| Crown of Thorns | Allies gain Fury (passive) | Your Hero cannot attack or use Hero Power |

### 9.4 Gear Acquisition

Gear can be acquired from:
- **Post-combat rewards** (gear card offered among the 3 options)
- **Shop** (2–3 gear items available per shop visit)
- **Elite encounters** (guaranteed gear drop in addition to card reward)
- **Events** (some events offer gear as a choice)

### 9.5 Gear Inventory & Equipping

- Gear is stored in a **separate inventory** (not shuffled into the deck).
- Gear can be equipped during ANY combat encounter for its mana cost.
- Once equipped, gear stays equipped for the rest of the run.
- Max 4 equipped gear. Equipping a 5th requires permanently discarding one equipped piece.
- Gear in inventory (not yet equipped) has no effect.
- Inventory size is unlimited — hoarding gear for later equip decisions is valid strategy.

---

## 10. Reward & Gambling Systems

### 10.1 Philosophy

Every reward moment should feel like a **controlled gamble**. The player never knows exactly what they'll be offered, but they always have agency in how they respond. Three tools control the gambling feel: weighted pools, limited rerolls, and the skip option.

### 10.2 Post-Combat Reward Flow

```
[Combat Victory]
  → [Gold earned: base_gold + bonus]
  → [Card Reward Screen]
     → 3 cards revealed sequentially (animated fan reveal — see 10.5)
     → Player may: PICK 1 card, SKIP (take nothing), or REROLL (costs gold)
  → [If Elite: Bonus Relic/Gear reward]
  → [Return to Map]
```

### 10.3 Rarity Weights (Card Rewards)

**Normal encounters:**

| Rarity | Base Weight | Notes |
|--------|-----------|-------|
| Common | 60% | Reliable baseline |
| Uncommon | 37% | Meaningful upgrade |
| Rare | 3% | Exciting find |

**Elite encounters:**

| Rarity | Weight |
|--------|--------|
| Common | 50% |
| Uncommon | 40% |
| Rare | 10% |

**Hidden rarity offset (pity timer):**
- Starts at −5% modifier to Rare chance.
- Each time all 3 offered cards are Common, offset increases by +1%.
- When a Rare card appears in rewards, offset resets to −5%.
- Offset caps at +40% (guarantees Rare within ~45 consecutive Common-only rewards).
- Players never see this system; it just prevents drought streaks.

### 10.4 Faction Weighting

The 3 offered cards are drawn from weighted faction pools:

| Pool | Weight | Description |
|------|--------|-------------|
| Player's faction | 60% | Cards matching the hero's faction |
| Other factions | 25% | Split evenly among other 2 factions |
| Neutral | 15% | Faction-neutral cards |

Each of the 3 reward cards rolls independently.

### 10.5 Reward Reveal Animation

The reward screen uses an **animated card fan reveal:**

1. Three cards appear face-down in a fan layout.
2. Cards flip sequentially (left → center → right) with a 0.4s delay between each.
3. Each flip has a brief "shimmer" animation, with the border color indicating rarity before the full card is visible.
4. After all 3 are revealed, the player can hover for full card details.
5. A "REROLL" button and "SKIP" button are always visible.

**Audio cues:** Each card flip has a distinct sound. Rare cards have a special "legendary" reveal sound.

### 10.6 Reroll System

- **Cost:** Gold. Base cost = 25 gold. Escalates by +25 per reroll within the same reward screen. Resets at the next reward screen.
- **Reroll 1:** 25 gold. **Reroll 2:** 50 gold. **Reroll 3:** 75 gold. Etc.
- **What happens:** All 3 cards are discarded and 3 new cards are drawn from the same weighted pools. New cards are revealed with the same fan animation.
- **No limit on rerolls** (limited only by gold), but the escalating cost makes more than 2–3 rerolls very expensive.
- **Skip is always free.** The player can always decline all options without cost.

### 10.7 Reward Type Distribution by Node

| Node Type | Gold | Card Reward | Gear Reward | Relic |
|-----------|------|------------|-------------|-------|
| Normal Combat | 10–20 | Yes (3 choices) | No | No |
| Elite Combat | 20–35 | Yes (3 choices) | Yes (1 offered) | Yes (1 offered) |
| Boss | 50 | No | No | Yes (1 of 3 choice) |
| Shop | N/A | Buy with gold | Buy with gold | Sometimes available |
| Rest | N/A | No | No | No |
| Event | Varies | Sometimes | Sometimes | Sometimes |

---

## 11. Map & Navigation

### 11.1 Map Structure

The map is a **directed acyclic graph (DAG)** rendered as a vertical column of rows, similar to Slay the Spire's map.

```
Row 0: [START]
Row 1: [Combat]  [Combat]  [Event]
Row 2: [Combat]  [Shop]
Row 3: [Elite]   [Combat]  [Rest]
Row 4: [Combat]  [Event]
Row 5: [Rest]    [Combat]
Row 6: [BOSS]
```

### 11.2 Generation Rules

1. Map has **6 rows** between START and BOSS.
2. Each row has **2–3 nodes**.
3. Edges connect nodes in adjacent rows. Each node has 1–2 outgoing edges.
4. Every node must be reachable from START.
5. BOSS is always a single node reached from all Row 5 nodes.
6. **Node type distribution per stage:**
   - Combat: 4
   - Elite: 1
   - Shop: 1
   - Rest: 1
   - Event: 1–2
7. **Constraints:**
   - Elite cannot appear in Row 1 (too early).
   - Shop cannot appear in Row 1 (no gold yet).
   - Rest cannot appear in the same row as the Elite (prevents avoiding elite then immediately resting).
8. Player can see the entire map from the start. Node types are visible. This enables strategic path planning.

### 11.3 Map Interaction

- Player clicks a node connected to their current position.
- Path highlights show all valid next nodes.
- Visited nodes are grayed out. Current node is highlighted.
- The map can be viewed at any time during a run (overlay/sidebar).

---

## 12. Run-Start Gamble

### 12.1 Overview

Before the map is revealed, the player is presented with a **"Fate's Offer"** screen — 4 options structured as a risk gradient.

### 12.2 Option Structure

| Option # | Type | Example | Risk Level |
|----------|------|---------|-----------|
| 1 | **Safe small bonus** | Gain 50 gold | None |
| 2 | **Safe small bonus** | Remove 1 card from starter deck | None |
| 3 | **Moderate reward + mild downside** | Gain a random Uncommon card + start with −3 Max HP | Low |
| 4 | **High-variance gamble** | Replace your starting relic with a random Rare relic | High |

### 12.3 Implementation

- All 4 options are generated procedurally from option templates.
- Option 4 (gamble) should have **positive expected value** but **high variance** — sometimes you get an incredible relic, sometimes you get one that actively hurts your build.
- The 4 options are always presented in the same risk order (safe → safe → moderate → gamble) so players can quickly identify the gamble option.
- Only 1 option can be chosen. Choice is final.

---

## 13. Shop System

### 13.1 Shop Inventory

When the player enters a shop node, the following is available:

| Category | Items Available | Price Range |
|----------|----------------|-------------|
| Cards | 3 cards (weighted by faction/rarity) | 25–100 gold |
| Gear | 2 gear items | 40–120 gold |
| Card Removal | Remove 1 card from deck | 50 gold (escalates +25 per use) |
| Reroll Shop | Refresh all shop items | 10 gold (escalates +10 per use) |

### 13.2 Pricing

| Rarity | Card Price | Gear Price |
|--------|-----------|-----------|
| Common | 25–35 | 40–50 |
| Uncommon | 50–65 | 65–85 |
| Rare | 80–100 | 100–120 |

Prices have ±10% random variance.

### 13.3 Card Removal

- Costs 50 gold for first removal, +25 for each subsequent removal in the same run.
- Player chooses which card to remove from their deck.
- Removed cards are gone permanently for the run.
- Starter cards can be removed.
- This is a critical strategic tool — lean decks draw key cards more consistently.

---

## 14. Enemy & Encounter Design

### 14.1 Enemy Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name |
| `health` | number | Hit points |
| `intents` | IntentPattern[] | Ordered list of actions, cycles |
| `keywords` | Keyword[] | Passive abilities |
| `statusOnDeath` | Effect? | Optional effect when killed |

### 14.2 Intent Patterns

Enemies follow a **predefined intent cycle** that repeats. The player can learn patterns over multiple encounters.

Example — **Goblin Raider:**
```
Turn 1: Attack 5
Turn 2: Attack 5
Turn 3: Buff +2 Attack
Turn 4: Attack 7 (5 base + 2 buff)
[Cycle repeats from Turn 1, retaining buffs]
```

### 14.3 MVP Enemy Pool (Stage 1)

Design **15 unique enemies** across 3 difficulty tiers:

**Tier 1 (early encounters, Row 1–2):**
- 5 enemies with 5–10 HP, simple attack patterns, 0–1 keywords
- Examples: Goblin Scout, Forest Spider, Bandit Thug

**Tier 2 (mid encounters, Row 3–4):**
- 5 enemies with 10–18 HP, 2-phase patterns, 1 keyword
- Examples: Orc Warrior (has Fury), Cultist Priest (heals others), Dire Wolf (attacks twice)

**Tier 3 (late encounters, Row 5):**
- 5 enemies with 15–25 HP, complex patterns, 1–2 keywords
- Examples: Dark Knight (has Ward + high attack), Necromancer (summons skeletons on cycle)

### 14.4 Encounter Composition

Each combat node draws from the appropriate tier:

| Row | # Enemies | Tier Mix |
|-----|-----------|----------|
| 1–2 | 1–2 | Tier 1 only |
| 3–4 | 2–3 | Tier 1 + Tier 2 |
| 5 | 2–3 | Tier 2 + Tier 3 |

### 14.5 Elite Encounter

One elite enemy. Higher stats (25–35 HP), 2+ keywords, unique mechanic. Drops gear + relic in addition to card reward.

**MVP Elites (2):**
- **Ironbound Sentinel:** 30 HP, gains +3 Armor every 2 turns, attacks for 8. Punishes slow strategies.
- **Shadowweaver:** 25 HP, summons a 3/3 Shade every 3 turns, attacks for 5. Punishes ignoring board control.

---

## 15. Boss Design

### 15.1 Boss Structure

Each boss has **2 phases**. Phase 2 activates when the boss reaches 50% HP. The boss card visually "flips" to show Phase 2 stats/abilities.

### 15.2 MVP Boss: The Hollow King

**Lore:** A fallen monarch who refused to die. His crypt is the stage's final chamber.

**Phase 1 (30 HP):**
- Attack pattern: [Attack 6] → [Summon 1/1 Skeleton] → [Attack 8] → [Heal 5 + Summon 1/1 Skeleton] → repeat
- Passive: When a Skeleton dies, The Hollow King gains +1 Attack permanently.
- Strategy: Kill skeletons quickly (before they die to AoE and buff the boss), or ignore them and rush the boss.

**Phase 2 (flips at 15 HP):**
- Attack pattern: [Attack 10] → [Summon 2/2 Skeleton with Deathblow: deal 3 damage to hero] → [Attack 12] → repeat
- Passive: Skeletons now have Deathblow.
- Strategy: Can no longer freely AoE skeletons. Must carefully manage which targets to attack.

---

## 16. Event System

### 16.1 Event Structure

Events are narrative-choice encounters. Each event presents a short text scene and 2–3 choices with mechanical consequences.

### 16.2 MVP Events (5 unique)

**Event 1: The Abandoned Shrine**
- Choice A: "Pray." → Heal 8 HP.
- Choice B: "Desecrate." → Gain 30 gold. Gain a Curse card (0-cost spell: does nothing, wastes deck space).

**Event 2: The Wandering Merchant**
- Choice A: "Trade." → Lose 20 gold. Gain a random Uncommon card.
- Choice B: "Rob." → Gain 40 gold. Next encounter has +1 enemy.

**Event 3: The Cursed Chest**
- Choice A: "Open it." → Gain a random Rare gear. Lose 10% Max HP permanently.
- Choice B: "Walk away." → Nothing happens.

**Event 4: The Wounded Soldier**
- Choice A: "Help." → Lose 5 HP. Gain a random Ally card from any faction.
- Choice B: "Ignore." → Nothing happens.

**Event 5: The Crossroads**
- Choice A: "Left path." → Reveal the next 2 map nodes' contents (provides information).
- Choice B: "Right path." → Gain a random Common gear.
- Choice C: "Straight ahead." → Skip to the next row on the map (skip one encounter).

---

## 17. Meta-Progression

### 17.1 MVP Meta-Progression (Minimal)

For MVP, meta-progression is limited to:

| Unlock | How Earned | Effect |
|--------|-----------|--------|
| Heroes | Beat the boss with each hero | Unlocks next hero (start with 2, unlock 1) |
| Card pool expansion | Complete runs (win or lose) | After 5/10/15 runs, add 3 new cards to the pool each time |
| Difficulty tiers | Beat the game | Unlock Tier 2 (see Section 18) |
| Run history | Automatic | Viewable log of past runs with stats |

### 17.2 Design Rule

Unlocks make the game **wider** (more options), never **taller** (more powerful). A new player can beat the game on run 1 if they play well.

---

## 18. Difficulty Scaling

### 18.1 Ascension Tiers (Post-MVP)

After beating the game, unlock progressive difficulty modifiers:

- **Tier 2:** Enemies have +2 HP.
- **Tier 3:** Player starts with 10 less gold.
- **Tier 4:** Shops cost 25% more.
- **Tier 5:** Elites have an additional keyword.
- **Tier 6:** Draw 1 fewer card per turn.
- **Tier 7+:** Stacking combinations of the above.

Each tier adds on top of previous tiers.

---

## 19. Card Data Schema

### 19.1 JSON Schema (Source of Truth)

All card data lives in JSON files. The game engine reads these files. Card balance changes = JSON edits, no code changes.

```typescript
// types/card.ts

type CardType = "ally" | "spell" | "gear";
type Faction = "might" | "wisdom" | "heart" | "neutral";
type Rarity = "common" | "uncommon" | "rare";
type Keyword =
  | "strike"
  | "echo"
  | "blessing"
  | "ward"
  | "taunt"
  | "deathblow"
  | "burn"
  | "poison"
  | "fury";

interface BaseCard {
  id: string;               // Unique ID: "might_ally_001"
  name: string;
  type: CardType;
  faction: Faction;
  rarity: Rarity;
  cost: number;             // Mana cost
  keywords: Keyword[];
  flavorText: string;
  artId: string;            // Reference to art asset
  upgraded: boolean;        // Default false
  upgradeEffect: UpgradeEffect;
}

interface AllyCard extends BaseCard {
  type: "ally";
  attack: number;
  health: number;
  strikeEffect?: Effect;     // Effect triggered by Strike keyword
  deathblowEffect?: Effect;  // Effect triggered by Deathblow keyword
}

interface SpellCard extends BaseCard {
  type: "spell";
  effect: Effect;
  targetType: "single_enemy" | "all_enemies" | "single_ally" | "self" | "all_allies" | "random_enemy";
}

interface GearCard extends BaseCard {
  type: "gear";
  upside: GearEffect;
  downside: GearEffect;
}

interface Effect {
  type: "damage" | "heal" | "draw" | "armor" | "apply_status" | "summon" | "destroy" | "buff_attack" | "buff_health" | "mana_gain";
  value: number;
  target?: string;
  statusType?: Keyword;
  duration?: number;
}

interface GearEffect {
  description: string;       // Human-readable: "+2 Attack to all allies"
  type: string;              // Machine-readable effect type
  value: number;
  trigger?: "start_of_turn" | "end_of_turn" | "on_play" | "on_attack" | "passive";
}

interface UpgradeEffect {
  description: string;       // "Attack +1"
  property: string;          // "attack" | "cost" | "health" | "upside.value" etc.
  modifier: number;          // +1, -1, etc.
}
```

### 19.2 Example Card Data

```json
{
  "id": "might_ally_001",
  "name": "Ashblade Recruit",
  "type": "ally",
  "faction": "might",
  "rarity": "common",
  "cost": 1,
  "attack": 2,
  "health": 2,
  "keywords": [],
  "flavorText": "First into the breach, last to complain.",
  "artId": "art_ashblade_recruit",
  "upgraded": false,
  "upgradeEffect": {
    "description": "Attack +1",
    "property": "attack",
    "modifier": 1
  }
}
```

```json
{
  "id": "might_gear_003",
  "name": "Berserker's Axe",
  "type": "gear",
  "faction": "might",
  "rarity": "uncommon",
  "cost": 2,
  "keywords": [],
  "upside": {
    "description": "+3 Attack to hero",
    "type": "buff_hero_attack",
    "value": 3,
    "trigger": "passive"
  },
  "downside": {
    "description": "All healing received is halved",
    "type": "modify_healing",
    "value": -50,
    "trigger": "passive"
  },
  "flavorText": "It drinks deep, and so must you.",
  "artId": "art_berserkers_axe",
  "upgraded": false,
  "upgradeEffect": {
    "description": "Downside reduced: healing reduced by 30% instead of 50%",
    "property": "downside.value",
    "modifier": 20
  }
}
```

---

## 20. UI/UX Requirements

### 20.1 Visual Style

**Clean modern UI with illustrated card frames**, inspired by Balatro's aesthetic. Key traits:

- Dark background (deep navy/charcoal) with high-contrast cards
- Cards have distinct colored borders per rarity (white/blue/gold)
- Faction colors used consistently: Might = Red, Wisdom = Blue, Heart = Gold, Neutral = Gray
- Minimal clutter — no more than 3 things animating simultaneously
- Typography: Clear, bold card names; smaller readable body text for effects
- Card art: Placeholder colored rectangles with icon for MVP; illustrated later

### 20.2 Screen Flow

```
[Main Menu]
  ├── [New Run] → [Hero Select] → [Run-Start Gamble] → [Map Screen]
  │                                                        ├── [Combat Screen]
  │                                                        ├── [Reward Screen]
  │                                                        ├── [Shop Screen]
  │                                                        ├── [Rest Screen]
  │                                                        ├── [Event Screen]
  │                                                        └── [Boss Screen]
  ├── [Collection] → [View all unlocked cards and gear]
  ├── [Run History] → [Past run summaries]
  └── [Settings] → [Volume, animation speed, etc.]
```

### 20.3 Key UI Components

| Component | Description |
|-----------|-------------|
| **CardComponent** | Renders any card (ally/spell/gear) with consistent frame. Hover shows full details. Click to play (in combat) or select (in reward/shop). |
| **HandDisplay** | Horizontal row of cards at bottom of combat screen. Cards fan out, expand on hover. |
| **BoardDisplay** | Shows allies in play + enemies with intents. |
| **HeroHUD** | HP bar, mana crystals, gear slots, hero portrait. Always visible in combat. |
| **MapView** | Vertical node graph. Nodes are clickable circles with type icons. Paths drawn as connecting lines. |
| **RewardScreen** | Overlay: 3 cards in fan layout with flip animation. Reroll button, skip button, gold display. |
| **ShopScreen** | Grid layout: cards for sale, gear for sale, card removal service. Gold display. |
| **DeckViewer** | Overlay: scroll through all cards in current deck. Accessible anytime. |

### 20.4 Responsive Design

- **Primary target:** Desktop (1280×720 minimum, 1920×1080 optimal)
- **Secondary target:** Tablet landscape (1024×768)
- **Not targeted for MVP:** Mobile portrait

### 20.5 Accessibility

- All card text must be readable at 14px minimum
- Color-coded elements must also have icon/shape differentiation (not color-only)
- Keyboard navigation for all menu screens
- Animation speed toggle (1x, 2x, skip)

---

## 21. Audio & Animation

### 21.1 MVP Audio (Minimal)

- Card play: click/swoosh sound
- Card flip (reveal): quick snap sound
- Rare card reveal: sparkle/chime sound
- Damage dealt: impact thud
- Enemy dies: crumble/shatter
- Hero takes damage: grunt + screen shake
- Victory: short fanfare
- Defeat: somber tone
- Background music: looping ambient track per screen (menu, combat, map)

All audio should be toggleable. Placeholder/free sounds acceptable for MVP.

### 21.2 Key Animations

| Animation | Duration | Priority |
|-----------|----------|----------|
| Card play from hand | 0.3s | High |
| Damage number popup | 0.5s | High |
| Card reward flip | 0.4s per card | High |
| Enemy death | 0.5s | Medium |
| Mana crystal fill | 0.2s | Low |
| Map node travel | 0.5s | Low |
| Screen transitions | 0.3s | Low |

All animations should be skippable/fast-forwardable.

---

## 22. Technical Architecture

### 22.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | React 18+ | Largest AI training corpus, best component ecosystem |
| **Language** | TypeScript (strict mode) | Type safety critical for game state correctness |
| **State Management** | Zustand | Minimal boilerplate, great TS support, good for complex state |
| **Styling** | CSS Modules or Tailwind CSS | Scoped styles, rapid iteration |
| **Animation** | Framer Motion | Declarative animation, React-native |
| **Persistence** | IndexedDB via Dexie.js | No server needed, works offline, structured data |
| **Build Tool** | Vite | Fast HMR, excellent TS support |
| **Testing** | Vitest + React Testing Library | Game logic unit tests are critical |
| **Deployment** | Vercel or Netlify | Free tier, zero-config for static sites |

### 22.2 Project Structure

```
ironmark/
├── public/
│   ├── assets/
│   │   ├── audio/          # Sound effects and music
│   │   └── images/         # Card art, UI elements, icons
│   └── index.html
├── src/
│   ├── engine/             # PURE GAME LOGIC — no React imports
│   │   ├── combat/         # Combat resolution, damage calc, turn flow
│   │   │   ├── combatEngine.ts
│   │   │   ├── damageResolver.ts
│   │   │   ├── intentResolver.ts
│   │   │   └── keywordResolver.ts
│   │   ├── cards/          # Card effects, keyword logic, deck operations
│   │   │   ├── cardEffects.ts
│   │   │   ├── deckManager.ts
│   │   │   └── gearManager.ts
│   │   ├── map/            # Map generation, node types, pathfinding
│   │   │   ├── mapGenerator.ts
│   │   │   └── mapTypes.ts
│   │   ├── rewards/        # Reward generation, rarity rolling, pity timer
│   │   │   ├── rewardGenerator.ts
│   │   │   ├── rarityRoller.ts
│   │   │   └── shopGenerator.ts
│   │   ├── encounters/     # Encounter composition, enemy selection
│   │   │   ├── encounterBuilder.ts
│   │   │   └── enemyAI.ts
│   │   ├── events/         # Event system, choice resolution
│   │   │   └── eventEngine.ts
│   │   ├── run/            # Run state management, meta-progression
│   │   │   ├── runState.ts
│   │   │   └── metaProgression.ts
│   │   └── types/          # All TypeScript type definitions
│   │       ├── card.ts
│   │       ├── combat.ts
│   │       ├── enemy.ts
│   │       ├── event.ts
│   │       ├── gear.ts
│   │       ├── map.ts
│   │       ├── reward.ts
│   │       └── run.ts
│   ├── data/               # JSON data files — balance changes go here
│   │   ├── cards/
│   │   │   ├── might.json
│   │   │   ├── wisdom.json
│   │   │   ├── heart.json
│   │   │   └── neutral.json
│   │   ├── enemies/
│   │   │   ├── stage1.json
│   │   │   └── bosses.json
│   │   ├── gear/
│   │   │   └── allGear.json
│   │   ├── events/
│   │   │   └── stage1Events.json
│   │   └── heroes/
│   │       └── heroes.json
│   ├── stores/             # Zustand stores
│   │   ├── gameStore.ts    # Master run state
│   │   ├── combatStore.ts  # Active combat state
│   │   └── uiStore.ts     # UI state (modals, animations, screen)
│   ├── components/         # React components
│   │   ├── screens/        # Full-screen views
│   │   │   ├── MainMenu.tsx
│   │   │   ├── HeroSelect.tsx
│   │   │   ├── RunStartGamble.tsx
│   │   │   ├── MapScreen.tsx
│   │   │   ├── CombatScreen.tsx
│   │   │   ├── RewardScreen.tsx
│   │   │   ├── ShopScreen.tsx
│   │   │   ├── RestScreen.tsx
│   │   │   ├── EventScreen.tsx
│   │   │   ├── VictoryScreen.tsx
│   │   │   └── DefeatScreen.tsx
│   │   ├── cards/          # Card display components
│   │   │   ├── Card.tsx
│   │   │   ├── CardHand.tsx
│   │   │   ├── CardTooltip.tsx
│   │   │   └── CardRewardFan.tsx
│   │   ├── combat/         # Combat UI components
│   │   │   ├── EnemyDisplay.tsx
│   │   │   ├── AllyBoard.tsx
│   │   │   ├── HeroHUD.tsx
│   │   │   ├── ManaBar.tsx
│   │   │   ├── IntentIcon.tsx
│   │   │   └── DamagePopup.tsx
│   │   ├── map/            # Map components
│   │   │   ├── MapView.tsx
│   │   │   ├── MapNode.tsx
│   │   │   └── MapPath.tsx
│   │   └── shared/         # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── GoldDisplay.tsx
│   │       ├── HealthBar.tsx
│   │       └── Tooltip.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useCombat.ts
│   │   ├── useReward.ts
│   │   └── useAnimation.ts
│   ├── utils/              # Pure utility functions
│   │   ├── random.ts       # Seeded RNG, weighted random, pity timer
│   │   ├── shuffle.ts      # Fisher-Yates shuffle
│   │   └── format.ts       # Text formatting helpers
│   ├── db/                 # Dexie.js database setup
│   │   └── database.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── engine/             # Unit tests for game logic
│   └── integration/        # Integration tests for full flows
├── package.json
├── tsconfig.json
├── vite.config.ts
├── PRD.md                  # This document
├── IMPLEMENTATION_PLAN.md  # Implementation plan
└── CLAUDE.md               # Instructions for Claude Code
```

### 22.3 Architecture Principles

1. **Engine is pure.** The `src/engine/` directory contains ZERO React imports. All game logic is pure TypeScript functions that take state in and return new state out. This enables unit testing without React, and makes it possible to swap the UI layer later.

2. **Data drives balance.** All card stats, enemy stats, event text, and loot tables live in `src/data/` as JSON. Balance changes never require code changes. The engine reads JSON at startup and uses it as lookup tables.

3. **Zustand stores are thin.** Stores hold state and call engine functions. They do not contain game logic. A store action looks like: `playCard: (cardId) => set(state => combatEngine.playCard(state, cardId))`.

4. **Deterministic with seeded RNG.** All randomness uses a seeded PRNG (e.g., `seedrandom` library). Every run has a seed. Given the same seed and same player choices, the run produces identical results. This enables replay, debugging, and potential future features like daily challenge seeds.

5. **State is serializable.** The entire game state can be serialized to JSON and stored in IndexedDB. This enables mid-run saves, run history, and crash recovery.

---

## 23. MVP Scope Definition

### 23.1 In Scope (Must Have)

- [ ] Main menu with "New Run" button
- [ ] Hero selection screen (2 heroes: 1 Might, 1 Wisdom)
- [ ] Run-start gamble (4 options)
- [ ] Map generation and navigation (1 stage, 6 rows)
- [ ] Combat system (sequential turns, auto-mana, hand management)
- [ ] Enemy intents displayed and resolved
- [ ] 3 card types (Ally, Spell, Gear) fully functional
- [ ] Keyword system (Strike, Echo, Ward, Taunt, Deathblow, Burn — 6 keywords)
- [ ] Gear with upside/downside
- [ ] Post-combat reward screen (3 cards, animated fan reveal, reroll, skip)
- [ ] Shop (buy cards, buy gear, remove cards)
- [ ] Rest node (heal, upgrade, remove)
- [ ] Event system (3 events minimum)
- [ ] 1 Elite encounter
- [ ] 1 Boss (The Hollow King, 2 phases)
- [ ] Deck viewer (see all cards in current deck)
- [ ] Victory/defeat screens with run summary
- [ ] Seeded RNG
- [ ] Mid-run save (auto-save after each node)
- [ ] Responsive for desktop (1280×720 minimum)

### 23.2 Card Count Target (MVP)

| Category | Count |
|----------|-------|
| Might Ally cards | 6 unique |
| Might Spell cards | 4 unique |
| Might Gear cards | 3 unique |
| Wisdom Ally cards | 6 unique |
| Wisdom Spell cards | 4 unique |
| Wisdom Gear cards | 3 unique |
| Heart Ally cards | 6 unique |
| Heart Spell cards | 4 unique |
| Heart Gear cards | 3 unique |
| Neutral cards | 5 (mix of types) |
| Starter deck cards | 4 unique per faction (12 total) |
| **Total unique card designs** | **~56** |

### 23.3 Out of Scope (Post-MVP)

- Co-op and versus modes
- Shadow faction (4th faction)
- Stages 2 and 3 (branching stage themes)
- Meta-progression beyond basic unlocks
- Ascension/difficulty tiers
- Mobile portrait layout
- Account system / cloud saves
- Leaderboards
- Daily challenge seeds
- Card art (use placeholder icons/colors)
- Sound effects and music (can be silent MVP)
- Tutorial system (text tooltip walkthrough sufficient)

---

## 24. Post-MVP Roadmap

| Phase | Features | Target |
|-------|---------|--------|
| **MVP** | Core combat loop, 1 stage, 2 heroes, 3 factions, ~56 cards | First playable |
| **Alpha** | 3 stages, path branching, 3rd hero (Heart), events expanded, basic audio | Feature-complete core loop |
| **Beta** | Meta-progression, ascension tiers, 4th hero, card pool expanded to ~100, card art | Content-complete |
| **1.0** | Shadow faction, co-op mode, polish, mobile, daily challenges | Public release |

---

## 25. Open Questions & Design Risks

| # | Question / Risk | Status | Notes |
|---|----------------|--------|-------|
| 1 | Is 8 max mana too high? Could lead to overpowered late-combat turns. | Open | Playtest will determine; may cap at 6. |
| 2 | Should allies attack automatically at end of turn, or manually? | Decided: Auto | Allies attack at end of player's action phase. |
| 3 | Is 4 gear slots too many? Could lead to information overload. | Open | Consider reducing to 3 for MVP. |
| 4 | How should multi-target ally attacks work with multiple enemies? | Open | Current: player assigns targets. Could simplify to auto-target weakest. |
| 5 | Gear mana cost: should equipping gear cost mana? | Decided: Yes | Costs mana in combat. Creates tension with playing cards. |
| 6 | Can you un-equip gear? | Decided: No | Once equipped, stays until replaced or run ends. |
| 7 | What happens when the deck runs out of cards mid-combat? | Decided | Shuffle discard pile into new draw pile. If both empty, no more draws. |
| 8 | Balance risk: Wisdom's card draw + free spells could be degenerate. | Open | Needs playtesting. May need a "spells cast this turn" diminishing returns mechanic. |

---

## 26. Glossary

| Term | Definition |
|------|-----------|
| **Run** | A single playthrough from hero selection to victory or death. All progress within a run is temporary. |
| **Stage** | A section of the dungeon with its own map, encounters, and boss. MVP has 1 stage. |
| **Node** | A location on the map (combat, elite, shop, rest, event, boss). |
| **Encounter** | A combat fight against 1–4 enemies. |
| **Deck** | The player's collection of Ally and Spell cards that are drawn during combat. |
| **Hand** | The subset of deck cards currently available to play (default 5). |
| **Discard Pile** | Cards played or discarded this encounter. Reshuffled into deck when deck is empty. |
| **Graveyard** | Allies that died this encounter. Not reshuffled (dead is dead for this fight). |
| **Gear Inventory** | Collection of unequipped gear cards. Not part of the deck. |
| **Equipped Gear** | Gear currently active on the hero (max 4 slots). |
| **Relic** | Passive bonus item gained from elites, bosses, or events. Always active, no slots limit. |
| **Keyword** | A named ability on a card that follows specific rules (Strike, Echo, etc.). |
| **Pity Timer** | Hidden system that increases rare reward chances after consecutive non-rare rewards. |
| **Reroll** | Spend gold to regenerate the reward options. Cost escalates per use. |
| **Skip** | Decline all reward options. Always free. |
| **Seed** | Random number that determines all RNG outcomes for a run. Same seed = same run (given same choices). |

---

*End of PRD. This document is the source of truth. All implementation decisions derive from it. When in doubt, this document wins.*
