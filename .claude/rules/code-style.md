# Code Style

- Strict TypeScript: no `any`, no `as` casts unless absolutely necessary
- Pure functions preferred. Minimize side effects
- `interface` over `type` for object shapes
- Descriptive variable names (no single-letter variables except loop counters)
- Functions ≤ 50 lines, files ≤ 400 lines, nesting ≤ 4 levels, parameters ≤ 5
- Name files in camelCase. Name React components in PascalCase (e.g., `CombatScreen.tsx`)
- All randomness uses seeded PRNG via `SeededRNG` — NEVER `Math.random()`

<important if="you are creating new .claude/ markdown files, rules, commands, or skills">
Consult `agent-markdown-guide.md` for writing techniques and structure.
Key principles: path-scope rules via YAML `paths:` frontmatter, use `<important>` XML tags
for critical rules, quantify constraints, keep each file under 200 lines,
write directive skill descriptions ("ALWAYS invoke when...").
</important>
