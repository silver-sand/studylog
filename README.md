# StudyLog

AI-powered daily study progress tracker — log what you study, get AI-generated reviews, track syllabus completion, and visualize your progress.

Built for JEE/NEET/CBSE/MHT CET prep but works for any exam or self-study.

## Features

### 📝 Daily Study Log
- One entry per day — write what you studied, how many hours, and your focus level
- AI automatically extracts subjects, chapters, and tags from your entry
- Study type tracking: theory, problem solving, revision, or test

### 🤖 AI Reviews
- **Daily review** — auto-generated summary of each day's study with topic breakdown and next-day recommendations
- **Weekly review** — deep analysis of your week with topic coverage table, strengths, areas for improvement, and action items
- Fallback mode works offline (keyword-based) when no API key is set

### 📊 Analytics Dashboard
- **Streak tracking** — consecutive study days
- **Weekly progress** — hours logged vs target
- **Study trend** — 14-day SVG line chart of daily hours
- **Subject breakdown** — hours per subject with color-coded bars
- **Study type distribution** — theory vs problem-solving vs test hours
- **Focus trend** — 7-day focus rating chart
- **Week comparison** — this week vs last week with delta indicators

### 📚 Course Tracker
- 4 exam syllabi pre-seeded: **JEE** (65 chapters), **NEET** (50), **CBSE Class 12** (50), **MHT CET** (84)
- Track chapter status: Not Started → In Progress → Completed
- Color-coded progress bars per subject
- Overall exam completion percentage
- Expandable chapter lists with live status toggles

### ⚙️ Customizable
- Set weekly study hour targets
- Choose your exam type
- Add/remove subjects
- Dark theme throughout

## Stack

- **Framework:** [Astro 5](https://astro.build/) (SSR)
- **Database:** SQLite via [sql.js](https://github.com/sql-js/sql.js)
- **AI:** [Google Gemini 2.0 Flash](https://ai.google.dev/) (free tier) + Mock fallback
- **Charts:** Pure CSS + SVG — no external chart library
- **Styling:** Dark theme, scoped CSS, Inter + JetBrains Mono fonts
- **Adapter:** @astrojs/node

## Quick Start

```bash
git clone https://github.com/silver-sand/studylog.git
cd studylog
npm install
npm run dev
```

Open **http://localhost:4321** and start logging.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `mock` | AI backend (`mock` or `gemini`) |
| `GEMINI_API_KEY` | — | Google Gemini API key (if using `gemini`) |
| `STUDYLOG_DB_PATH` | `./db/studylog.db` | SQLite database file path |

Set `AI_PROVIDER=mock` for offline use — no API key needed.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Preview production build |
| `npx tsx scripts/seed-fake-entries.mjs` | Seed test data |

## Project Structure

```
src/
├── ai/              # AI service (Gemini + Mock)
├── components/      # Astro components (21 total)
├── db/              # Database layer (schema, adapter, interface)
├── layouts/         # BaseLayout with sidebar
├── pages/           # Routes and API endpoints
│   ├── api/         # REST API routes
│   └── weekly/      # Weekly review detail page
├── services/        # Business logic layer
├── types/           # TypeScript interfaces
└── utils/           # Helpers (dates, UUID, syllabus data)

scripts/
├── seed-fake-entries.mjs    # Generate test data
└── delete-weekly-review.mjs # Clear weekly reviews
```

## License

MIT
