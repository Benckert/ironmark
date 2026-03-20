---
paths:
  - "src/stores/**"
---

# Zustand Store Rules

- Stores are thin wrappers that call engine functions from `src/engine/`
- Stores MUST NOT contain game logic — delegate all logic to engine functions
- Store state MUST remain JSON-serializable (for save/load via Dexie)
- Use Zustand's `set()` to update state with the result of engine function calls
