---
paths:
  - "src/stores/**"
---

# Zustand Store Rules

<important if="you are creating or modifying Zustand stores">
- Stores are thin wrappers that call engine functions from `src/engine/`
- Stores MUST NOT contain game logic — delegate ALL logic to engine functions
- Store state MUST remain JSON-serializable (for save/load via Dexie)
- Use Zustand's `set()` to update state with the result of engine function calls
- Import engine functions directly — do not re-implement calculations in stores
</important>

Bad:
```ts
// WRONG — game logic in store
set({ hp: state.hp - damage * (1 - state.armor / 100) })
```

Good:
```ts
// RIGHT — delegate to engine
set(applyDamage(get(), damage))
```
