---
paths:
  - "src/components/**"
---

# React Component Rules

- Component files use PascalCase: `CombatScreen.tsx`, `CardHand.tsx`
- Screen-level components live in `src/components/screens/`
- Feature components grouped by domain: `combat/`, `cards/`, `map/`, `shared/`
- Use Zustand store hooks for game state — avoid prop drilling for global state
- Use Framer Motion for animations (via `useAnimation` hook in `src/hooks/`)
- Use Tailwind CSS for all styling — no CSS modules or inline style objects

<important if="you are adding game logic to a React component">
Components MUST NOT contain game logic. Read state from stores, dispatch actions
to stores. If you need a calculation, add it to `src/engine/` and call it from
the store or derive it in a selector.
</important>
