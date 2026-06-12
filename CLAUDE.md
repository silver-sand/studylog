# StudyLog — gstack Configuration

## Project Context

StudyLog V5 is a student study tracker built with:
- **Astro 5** (SSR with Node adapter)
- **SQLite** (better-sqlite3) for local data storage
- **TypeScript** throughout
- **Vanilla CSS** with a custom design system (design-system.css)
- No Tailwind, no React components
- No external UI libraries — all components are hand-crafted Astro `.astro` files

## gstack Workflow

Use the gstack skills from `~/.claude/skills/gstack` for all structured development work.

### Workflow Pipeline

```
Think → Plan → Build → Review → Test → Ship
```

### Key Skills

| Slash Command | Purpose |
|---------------|---------|
| `/gstack` | Main gstack skill — list all available skills |
| `/office-hours` | Brainstorm feature ideas and write design docs |
| `/spec` | Turn vague intent into precise spec |
| `/review` | Engineering code review |
| `/design-review` | Design quality review |
| `/design-shotgun` | Generate multiple design variants |
| `/qa` | Browser-based QA testing |
| `/ship` | Land, test, and ship |
| `/retro` | Post-ship retrospective |

### Design Decisions

- **No vibe-coding**: Every design change must go through `/spec` → `/design-shotgun` or `/design-review` → implementation
- **No Tailwind**: Use design-system.css tokens instead
- **Astro framework**: Components are `.astro` files, not React
- **Build integration**: Always run `npm run build` before committing
- **Stitch source of truth**: For design tokens and visual layouts, use Google Stitch MCP as the primary reference — not manual CSS decisions

### Superpowers Methodology Integration

The gstack pipeline (`Think → Plan → Build → Review → Test → Ship`) maps to the Superpowers flow. Enhance each phase:

| Phase | Superpowers Practice |
|-------|---------------------|
| **Think** | Ask one question at a time. Propose 2-3 approaches with trade-offs. No code until spec approved. |
| **Plan** | Break into 2-5 minute tasks. Every task must list exact file paths, complete code, and expected command output. No "TBD", "TODO", or "add validation" without specifics. |
| **Build** | For multi-file work, prefer fresh subagent per task + two-stage review (spec compliance → code quality). |
| **Review** | Run the self-review checklist (coverage, placeholders, type consistency, completeness). |
| **Ship** | No final commit without `npm run build` passing. Verify success criteria from the spec. |

**Systematic debugging** (for bugs/errors):
1. **Investigate** — Read error carefully, reproduce, `git diff`, trace data flow backward. Never guess.
2. **Analyze** — Find working examples, list every difference from broken case.
3. **Hypothesize** — One variable at a time. Smallest test change. Verify before continuing.
4. **Fix** — One fix addressing root cause. No bundled refactoring. Verify no regressions.

**3-Fix Rule:** After 3 failed fix attempts, stop and question the architecture. Don't keep piling on patches.

The full methodology is documented in `~/.claude/CLAUDE.md`.

### File Conventions

- Components: `src/components/*.astro`
- Pages: `src/pages/*.astro`
- Styles: `src/styles/design-system.css`
- Services: `src/services/*.ts`
- Shared utils: `src/utils/*.ts`

## 🧠 Karpathy Coding Guidelines

These override the generic impulse to overcomplicate. Apply them to every code change:

1. **Think Before Coding** — State assumptions. Surface ambiguity. Suggest simpler approaches. Ask when uncertain.
2. **Simplicity First** — No speculative features, no unnecessary abstractions, no scope creep. Senior engineer test: "Is this overcomplicated?"
3. **Surgical Changes** — Every changed line must trace to the request. No drive-by refactoring, no style fixes, no touching adjacent code.
4. **Goal-Driven Execution** — Define verifiable success criteria before starting. Loop until they pass.

These apply before and during every gstack pipeline step. The full guidelines live in `~/.claude/CLAUDE.md`.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
