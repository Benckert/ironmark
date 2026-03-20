---
paths:
  - "src/components/**"
---

# React Component Rules

- Component names: PascalCase. File names: camelCase (e.g., `CombatScreen` in `CombatScreen.tsx`)
- Screen-level components live in `src/components/screens/`
- Use Zustand store hooks for game state — avoid prop drilling for global state
- Use Framer Motion for animations (via `useAnimation` hook in `src/hooks/`)
- Use Tailwind CSS for all styling
- Components MUST NOT contain game logic — read state from stores, dispatch actions to stores
