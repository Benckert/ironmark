# Structuring markdown configs for Claude Code and OpenClaw

**The single most impactful optimization for both Claude Code and OpenClaw is keeping instruction files short, modular, and context-aware** — loading only what matters for the current task rather than injecting everything into every session. Both tools treat markdown files as advisory context injected into the system prompt, consuming precious tokens on every API call. Claude Code supports a sophisticated multi-level discovery system with lazy loading and path-scoped rules, while OpenClaw assembles its prompt from a suite of purpose-specific files (SOUL.md, AGENTS.md, HEARTBEAT.md, and others). The tools share a common architecture — markdown in, system prompt out — but differ substantially in discovery mechanics, skill routing, and token management. This report covers the optimal folder hierarchies, writing techniques, and operational patterns for both platforms based on official documentation, community battle-testing, and cross-tool best practices.

---

## How Claude Code discovers and prioritizes markdown files

Claude Code uses a **two-direction discovery mechanism**. At startup, it walks *upward* from the current working directory toward the filesystem root, loading every CLAUDE.md file it finds. During a session, it loads subdirectory CLAUDE.md files *downward* on demand — only when Claude reads or writes files in those directories. This lazy loading is critical for monorepos, where package-level instructions add context only when relevant.

The precedence order, from highest to lowest authority:

1. **Managed policy** — organization-wide, cannot be excluded (`/Library/Application Support/ClaudeCode/CLAUDE.md` on macOS, `/etc/claude-code/CLAUDE.md` on Linux)
2. **User global** — `~/.claude/CLAUDE.md`, personal preferences across all projects
3. **Project root** — `./CLAUDE.md` or `./.claude/CLAUDE.md`, committed to version control
4. **Local project** — `./CLAUDE.local.md`, personal overrides auto-added to `.gitignore`
5. **Subdirectory files** — loaded lazily when Claude accesses those directories

All loaded files are **concatenated into context**, not replaced. When instructions conflict, more specific files take practical precedence. CLAUDE.md files support **`@path/to/file` import syntax** with up to **5 hops** of recursive imports, enabling progressive disclosure without monolithic files. The `.claude/rules/` directory adds another layer: each `.md` file there acts as additional CLAUDE.md-equivalent content, with optional `paths:` YAML frontmatter to scope rules to specific file globs (e.g., `"src/api/**/*.ts"`). Path-scoped rules load only when Claude works with matching files.

The recommended Claude Code directory hierarchy:

```
~/.claude/                          # User-level (global)
├── CLAUDE.md                       # Personal preferences
├── settings.json                   # User settings
├── rules/                          # User-level rules
│   └── preferences.md
├── skills/                         # User-level skills
│   └── explain-code/
│       └── SKILL.md
└── commands/                       # User-level custom commands
    └── review.md

project-root/
├── CLAUDE.md                       # Project conventions (committed)
├── .claude/
│   ├── settings.json               # Project settings
│   ├── settings.local.json         # Personal project config
│   ├── rules/                      # Modular, path-scoped rules
│   │   ├── code-style.md           # Always loaded (no paths frontmatter)
│   │   ├── testing.md
│   │   └── frontend/
│   │       └── react.md            # paths: "src/**/*.tsx"
│   ├── skills/                     # Project-level skills
│   │   └── pdf-processing/
│   │       ├── SKILL.md            # Required entrypoint
│   │       ├── scripts/
│   │       └── templates/
│   ├── commands/                   # Custom slash commands
│   │   ├── dev/
│   │   │   └── code-review.md
│   │   └── session/
│   │       └── handoff.md
│   └── agents/                     # Custom agent definitions
├── packages/frontend/
│   └── CLAUDE.md                   # Lazy-loaded when frontend files touched
└── .mcp.json                       # MCP server configuration
```

---

## Claude Code's skills system and how to make skills trigger reliably

Skills are **filesystem-based, on-demand prompt expansion packages**. Each skill is a directory containing a `SKILL.md` file with YAML frontmatter and markdown instructions. Unlike CLAUDE.md (always loaded) or rules (loaded by file path), skills inject their content only when invoked — either by the user typing `/skill-name` or by Claude automatically deciding the skill is relevant.

The loading operates through **three-level progressive disclosure**. At startup, only the name and description from every skill's YAML frontmatter are loaded into an `<available_skills>` XML block in the system prompt, costing roughly **100 tokens per skill**. When Claude determines a skill matches the current task, it loads the full SKILL.md body. When the skill's instructions reference bundled scripts or templates, those load on demand as well.

The critical SKILL.md frontmatter fields are `name` (becomes the slash command), `description` (the primary routing signal), `context: fork` (runs in an isolated subagent), and `disable-model-invocation` (prevents auto-triggering). A well-structured SKILL.md looks like:

```yaml
---
name: pdf-processing
description: Extract and analyze text from PDF documents. ALWAYS invoke this
  skill when users ask to process, read, or fill PDF forms. Do not attempt PDF
  operations directly without this skill.
---
# PDF Processing
Use the extract_text.py script in this directory:
    python3 scripts/extract_text.py <input_file>
After extraction, summarize key points in structured format.
```

**Skills not auto-triggering is the #1 community-reported issue.** Testing shows roughly **50% activation rate** with standard passive descriptions like "Use when users ask about PDFs." The fix is writing **directive descriptions** — telling Claude what to always do, not passively describing the skill. Directive phrasing like "ALWAYS invoke this skill when..." showed **20× better activation odds** than passive phrasing in community testing. Additionally, the total character budget for skill descriptions defaults to **15,000 characters** (roughly 4,000 tokens). If you exceed this, skills are **silently excluded** with no warning. Check with `/context` and override with `SLASH_COMMAND_TOOL_CHAR_BUDGET=30000` if needed.

---

## OpenClaw's purpose-specific markdown file suite

OpenClaw takes a fundamentally different approach from Claude Code. Rather than one overloaded CLAUDE.md file, OpenClaw uses a suite of **purpose-specific markdown files**, each answering a distinct question about the agent's behavior. All files live in a workspace directory (typically `~/.openclaw/workspace/`) and are injected into the system prompt at the start of every message.

The core files and their roles:

- **SOUL.md** — "Who are you?" The most important file. Defines personality, values, communication style, and behavioral boundaries. Keep under **2,000 words**. This is the agent's identity, not its operating manual.
- **AGENTS.md** — "What do you do and how?" Defines session behavior, workflow steps, memory management rules, multi-agent coordination, error handling. Procedures belong here, not in SOUL.md.
- **HEARTBEAT.md** — "What runs on a schedule?" Plain-English cron jobs. Keep tiny to avoid prompt bloat. If effectively empty, OpenClaw skips the heartbeat run to save API calls.
- **IDENTITY.md** — "What do users see?" Lightweight public-facing metadata: name, role label, avatar info.
- **USER.md** — "Who is the human?" Context about the user: timezone, expertise, preferences, access levels.
- **TOOLS.md** — "How do you use your tools?" Documents available tools and usage notes. Does not grant permissions; tells the agent *how* to use tools it already has.
- **MEMORY.md** — "What do you remember?" Persistent memory store for patterns, preferences, and accumulated facts. Only loaded in direct (main) sessions, never in group chats, to prevent personal context leaking.
- **BOOT.md** — Startup routine checklist. **BOOTSTRAP.md** — One-time first-run setup, then deleted.

OpenClaw's skills follow the same SKILL.md format as Claude Code (YAML frontmatter + markdown body) and are discovered from **three tiers**: workspace skills (`<workspace>/skills/`, highest precedence), managed/local skills (`~/.openclaw/skills/`, middle), and bundled skills (lowest). Extra skill directories can be added via `skills.load.extraDirs` in `openclaw.json`.

The recommended OpenClaw folder hierarchy:

```
~/.openclaw/
├── openclaw.json               # Central configuration
├── workspace/                  # Primary workspace
│   ├── SOUL.md                 # Agent personality
│   ├── AGENTS.md               # Operating procedures
│   ├── IDENTITY.md             # Public-facing metadata
│   ├── USER.md                 # Human context
│   ├── TOOLS.md                # Tool documentation
│   ├── HEARTBEAT.md            # Scheduled tasks
│   ├── MEMORY.md               # Persistent memory (tier 1)
│   ├── BOOT.md                 # Startup routine
│   ├── memory/                 # Extended memory
│   │   ├── YYYY-MM-DD.md       # Daily working notes
│   │   └── heartbeat-state.json
│   ├── skills/                 # Workspace skills (highest precedence)
│   │   └── <skill-name>/
│   │       ├── SKILL.md
│   │       └── scripts/
│   ├── projects/
│   ├── notes/
│   └── subagents/
├── skills/                     # Managed/local skills (middle precedence)
│   └── <skill-name>/
│       └── SKILL.md
└── agents/                     # Per-agent directories
    └── <agent_id>/
        └── sessions/
```

---

## Token budgets differ dramatically between the two platforms

Claude Code operates within Anthropic's **200K context window** and uses **prompt caching** aggressively. CLAUDE.md content is part of the cached system prompt prefix, so subsequent turns in the same session serve config files at roughly **90% cheaper token cost**. The practical guidance is to keep each CLAUDE.md under **200 lines** — files at this length achieve approximately **92% rule adherence**, while files over 400 lines drop to **71%**. The total instruction budget from all sources (CLAUDE.md, rules, skill descriptions) should stay within **10–15% of the context window**, leaving 50–60% for working context and 15–20% for output.

OpenClaw's token situation is more constrained, especially with local models. The system prompt, tools, and workspace files consume roughly **20,000–40,000 tokens** before the first user message. Tool schemas alone add approximately **8,000 tokens per request**. According to GitHub Issue #9157, workspace injection consumed **35,600 tokens per message** in a complex workspace, representing 93.5% waste in multi-message conversations since the same files are re-sent every turn. Individual files are capped by `bootstrapMaxChars` (default **20,000 characters**), with a total cap of `bootstrapTotalMaxChars` (**150,000 characters**). Files exceeding limits are truncated using a **70/20/10 split** — 70% from the head, 20% from the tail, 10% reserved for the truncation marker, meaning middle content can be silently lost.

For local models, the minimum viable context window is **32K tokens**, but this leaves almost no room for actual conversation after system prompt injection. **128K tokens** is recommended for comfortable operation; 200K+ is ideal. Ollama's default context window may be as small as 8K, which cannot even handle OpenClaw's base markdown files. Explicitly setting `contextWindow` in the model configuration is essential.

Key token optimization strategies that apply to both platforms:

- **Delete obvious information** — if the model can infer it from package.json or file structure, remove it
- **Use imperative, telegraphic language** — short directives consume fewer tokens and are followed more reliably
- **Reference instead of inline** — use `@path/to/file` imports (Claude Code) or keep detailed docs in separate files loaded on demand
- **Path-scope rules** — load frontend rules only when touching frontend files
- **Use `context: fork`** for skills over 200 lines to run them in isolated subagent context
- **Keep skill descriptions short** — the aggregate skill catalog consumes tokens on every turn

---

## Writing markdown that AI agents actually follow

The most critical finding across all research is that **how you write instructions matters as much as what you write**. Both Claude Code and OpenClaw wrap config file content in system-level framing that explicitly tells the model the content "may or may not be relevant." This means the model actively decides whether to follow each instruction, and as context fills up, config instructions get deprioritized.

**XML tags within markdown** provide the strongest signal for instruction compliance. The `<important if="condition">` pattern is particularly effective in Claude Code:

```markdown
<important if="you are writing or modifying tests">
- Use `createTestApp()` helper for integration tests
- Mock database with `dbMock` from `packages/db/test`
- Test fixtures live in `__fixtures__/` directories
</important>
```

Conditions should be specific and narrow — `<important if="you are writing code">` matches everything and defeats the purpose. Reserve XML tags for domain-specific rules where compliance matters most. Use standard markdown headers for broad categories and XML for critical subsections.

**RFC 2119 language** (MUST, SHOULD, MUST NOT) is widely adopted but has important caveats. Multiple GitHub issues document Claude reading and acknowledging MUST/NEVER instructions, then immediately violating them. The community consensus is to **use deterministic enforcement** (git hooks, linters, CI checks) for hard constraints, and reserve markdown instructions for guidance that benefits from AI judgment. A pre-commit hook that rejects `@ts-ignore` is more reliable than a CLAUDE.md rule saying "NEVER use @ts-ignore."

**Quantified rules dramatically outperform vague ones.** "Functions ≤30 lines, files ≤300 lines, nesting ≤3 levels, parameters ≤4" achieves far higher compliance than "keep functions short." Similarly, negative examples with specific Bad/Good code comparisons are more effective than abstract prohibitions.

For OpenClaw with local models, instructions must be even more explicit and blunt. Smaller models are more literal about tool permissions and may need instructions repeated in multiple files. Cross-model calibration is valuable: run the same prompts through strong and weak models, and wherever the weak model drifts, tighten those instructions.

---

## Known issues that shape how you should organize configs

Both platforms have documented failure modes that directly inform optimal organization:

**Claude Code's most impactful issues:**
- **Context compaction destroys instructions** — when `/compact` runs, CLAUDE.md instructions can be summarized away. Add "When compacting, always preserve [critical rules]" to your CLAUDE.md. Run manual `/compact` at 50% context usage, not when it's already full.
- **Path-scoped rules only inject on Read, not Write** (Bug #23478) — file creation conventions are silently ignored when new files are created. Workaround: use a PostToolUse hook on Write that forces a Read of the target directory.
- **Skills silently excluded when descriptions exceed budget** — no warning shown. Run `/context` regularly to check.
- **`CLAUDE.local.md` is effectively deprecated** — imports work better across git worktrees.
- **Instructions deprioritized in long sessions** — as context fills with code and tool output, CLAUDE.md values get deprioritized. Hook-based injection (SessionStart + UserPromptSubmit hooks) can re-inject critical rules.

**OpenClaw's most impactful issues:**
- **System prompt may not load with local models** — Qwen on llama.cpp/Ollama has documented cold-start failures where workspace files load correctly but the model cannot see them. The agent may hallucinate files that don't exist.
- **Large local models fail silently** — Qwen 2.5 32B produced no replies in TUI/web/Telegram while smaller models worked fine. No error thrown.
- **Thinking mode dramatically increases token usage** (10–50×) — reasoning models leak internal thoughts into replies if not properly configured.
- **Workspace files re-injected on every message** — exponential cost growth in long sessions. Sessions can reach multi-megabyte sizes causing UI freezes.
- **"Confirm before acting" is unreliable** — natural language constraints are not interpreted as hard limits by the model. One documented case involved an agent deleting an inbox despite explicit "confirm before acting" instructions.
- **Security: SOUL.md and MEMORY.md are attack vectors** — the ClawHavoc campaign targeted these files directly. A compromised SOUL.md hijacks the agent permanently. Never install untrusted skills from ClawHub without auditing.

---

## Version control and cross-tool maintenance strategies

The cleanest pattern separates **team-shared** configs (committed to git) from **personal** configs (gitignored or stored in user-level directories). For Claude Code, `CLAUDE.md`, `.claude/rules/`, `.claude/commands/`, and `.claude/settings.json` should be committed. `CLAUDE.local.md`, `~/.claude/CLAUDE.md`, and auto-memory files stay personal. For OpenClaw, workspace files are typically per-agent and stored outside the project repo, but skill definitions and AGENTS.md-style files can be committed if multiple developers share an agent configuration.

For teams using multiple AI coding tools, three synchronization approaches have emerged. **Symlinks** (`ln -s AGENTS.md CLAUDE.md`) work for simple cases. **Pre-commit hooks** can copy a single source-of-truth file to all tool-specific locations. The **`rulesync`** npm package generates tool-specific files from a shared `.rulesync/*.md` directory. The emerging cross-tool standard is **AGENTS.md**, now supported by Codex, Cursor, Copilot, Gemini, Windsurf, and partially by Claude Code, and stewarded by the Agentic AI Foundation under the Linux Foundation.

Treat rules files like code: review changes in pull requests, validate `paths:` globs against actual file paths using tools like `claude-rules-doctor`, and resist the temptation to auto-generate with `/init` — the default output includes obvious information that wastes tokens. The highest-leverage activity is **ruthless pruning**: if Claude or OpenClaw already does something correctly without being told, delete that instruction.

---

## Conclusion

The optimal approach for both platforms centers on **modularity, progressive disclosure, and disciplined token management**. For Claude Code, use a concise root `CLAUDE.md` under 200 lines as the core identity document, split domain-specific rules into path-scoped `.claude/rules/` files, organize skills as directories with directive (not passive) trigger descriptions, and enforce hard constraints through hooks rather than markdown. For OpenClaw, maintain clean separation between SOUL.md (identity), AGENTS.md (procedures), and purpose-specific files, keep SOUL.md under 2,000 words, and budget for the 20–40K token overhead that workspace files impose on every message — especially critical when targeting local models with limited context windows.

The most underappreciated insight across both platforms is that **markdown config files are advisory, not deterministic**. Both tools explicitly tell the model that these instructions "may or may not be relevant." Writing shorter, more specific, quantified instructions with XML-tagged priority sections produces dramatically better compliance than long, vague rule lists. The tools are converging: AGENTS.md provides cross-tool portability, SKILL.md is becoming a shared standard for portable expertise packages, and the fundamental principle — treat context like a finite resource to be budgeted, not a dumping ground — applies universally.