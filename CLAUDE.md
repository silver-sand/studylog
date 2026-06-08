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

### File Conventions

- Components: `src/components/*.astro`
- Pages: `src/pages/*.astro`
- Styles: `src/styles/design-system.css`
- Services: `src/services/*.ts`
- Shared utils: `src/utils/*.ts`

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
