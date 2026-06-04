# StudyLog

AI-powered daily study progress tracker — log what you study, get AI-generated reviews, track syllabus completion, and visualize your progress.

Built for JEE/NEET/CBSE/MHT CET/CUET/GATE/CAT/UPSC prep but works for any exam or self-study.

## Features

### 🔐 Authentication
- Signup/login with zero-dependency crypto-based auth (Web Crypto API, SHA-256)
- Session tokens with 7-day cookie expiry
- Full **user data isolation** — every user sees only their own entries, reviews, syllabus progress, and settings
- All existing data defaults to the first registered user

### 📝 Daily Study Log
- One entry per day — write what you studied, how many hours, and your focus level
- AI automatically extracts subjects, chapters, and tags from your entry
- Study type tracking: theory, problem solving, revision, or test

### 🤖 AI Reviews
- **Daily review** — auto-generated summary of each day's study with topic breakdown and next-day recommendations
- **Weekly review** — deep analysis of your week with topic coverage table, strengths, areas for improvement, and action items
- Fallback mode works offline (keyword-based) when no API key is set

### 🧠 AI Mentor
- Interactive chat with an AI study partner who knows your full context
- Analyzes your syllabus progress, weak chapters, recent entries, and exam settings
- Can quiz you, clarify doubts, and suggest what to study next
- Streaming responses via SSE with markdown rendering
- Chip suggestions for quick questions
- **Provider diagnostics** — shows which AI model is responding and latency
- **Retry button** on failed responses
- **Provider fallback** — auto-fails over Groq → Gemini → Mock silently

### 📚 Syllabus Tracker — 6-State Revision System
- **8 exam syllabi pre-seeded** (381 chapters total):

  | Exam | Chapters |
  |------|----------|
  | JEE | 65 |
  | NEET | 50 |
  | CBSE Class 12 | 50 |
  | MHT CET | 84 |
  | CUET | 39 |
  | GATE | 25 |
  | CAT | 28 |
  | UPSC | 40 |

- Granular 6-state status: **NS** → **S** → **R1** → **R2** → **R3** → **M** (Not Started → Studied → Revision 1-3 → Mastered)
- Weighted progress calculation (weights: 0, 0.2, 0.4, 0.6, 0.8, 1.0)
- Revision timestamps and revision count tracking
- Color-coded segmented slider for fast status updates
- Subject-level and overall weighted completion percentages
- **Commerce stream support** — 5 commerce subjects (Accountancy, Business Studies, Economics, Applied Mathematics, English) under CBSE 12

### 📊 Analytics Dashboard
- **Streak tracking** — consecutive study days
- **Weekly progress** — hours logged vs target
- **Study trend** — 14-day SVG line chart of daily hours
- **Subject breakdown** — hours per subject with color-coded bars
- **Study type distribution** — theory vs problem-solving vs test hours
- **Focus trend** — 7-day focus rating chart
- **Week comparison** — this week vs last week with delta indicators

### 🩺 Weak Chapter Detection
- Health scores (0-100) based on status weight and days since last revision
- Chapters degrade 2 points/day after 7 days without revision (max -40 penalty)
- `/api/chapter-health` endpoint with sorted weak chapters
- Dashboard card with color-coded health bars

### ⚡ Daily Action Card
- "Today's Priority" widget on the dashboard
- Ranks weakest chapters (health < 50) into priority order
- Shows why each chapter is recommended (stale revision, not started, etc.)

### 🎯 Exam Pace Predictor
- Set target exam date in Settings
- Linear projection: progress rate per day, days needed at current pace
- Status classification: **On Track** / **Behind** / **Critical**
- Dashboard widget with projected completion date

### 🧪 Mock Test Analytics
- Track test scores per subject with date, score, max marks
- Analytics: average percentage, best/worst, trend detection (improving/declining/stable)
- Subject-level breakdown with color-coded bars
- Quick add-test flow from dashboard

### ⏱️ Study Timer
- Start/pause/resume/stop with subject and topic tracking
- Counts up in real-time (HH:MM:SS)
- **Save as Entry** — saves duration, subject, and topic directly to the Daily Log via sessionStorage
- Dedicated `/timer` page with sidebar link

### 🎵 Ambience Player
- Built-in ambient sounds in the sidebar: White Noise, Pink Noise, Brown Noise (Web Audio API — zero audio files needed)
- Rain sound (external URL)
- Volume slider and per-sound volume memory
- Active sound indicator, Stop All button
- Collapsible panel that stays between page navigations

### 🚀 Onboarding & Tour
- **4-step onboarding wizard** after signup: Name → Stream → Goal → Weekly Target
- **Guided tour** auto-starts on first dashboard visit with 5-step walkthrough
- **Getting Started checklist** — 5 trackable first steps with live progress
- **Tour tooltips** — reusable one-time tooltips on key pages (dashboard, syllabus, timer)

### ⚙️ Customizable
- Set weekly study hour targets
- Choose your exam type (8 pre-seeded syllabi)
- Set target exam date for pace prediction
- Add/remove subjects
- Dark theme throughout

## Stack

- **Framework:** [Astro 5](https://astro.build/) (SSR)
- **Database:** SQLite via [sql.js](https://github.com/sql-js/sql.js)
- **AI:** [Google Gemini 2.0 Flash](https://ai.google.dev/) (free tier), [Groq Llama 3 70B](https://groq.com/), + Mock fallback
- **Charts:** Pure CSS + SVG — no external chart library
- **Auth:** Zero-dependency Web Crypto API (SHA-256, crypto.getRandomValues)
- **Audio:** Web Audio API noise synthesis — no audio files required
- **Styling:** Dark theme, scoped CSS, Inter + JetBrains Mono fonts
- **Adapter:** @astrojs/node (standalone)

## Quick Start

```bash
git clone https://github.com/silver-sand/studylog.git
cd studylog
npm install
npm run dev
```

Open **http://localhost:4321** — sign up, complete onboarding, and start logging.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | auto-detect | AI backend: `mock`, `gemini`, or `groq` (auto: gemini if key found, groq if Groq key, else mock) |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `GROQ_API_KEY` | — | Groq API key ([console.groq.com/keys](https://console.groq.com/keys)) |
| `AI_MODEL` | provider default | Model override (Gemini: `gemini-2.0-flash`, Groq: `llama-3.3-70b-versatile`) |
| `HOST` | `localhost` | Bind address for production (`0.0.0.0` for Render) |
| `STUDYLOG_DB_PATH` | `./db/studylog.db` | SQLite database file path |

Set `AI_PROVIDER=mock` for offline use — no API key needed.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (`localhost:4321`) |
| `npm run build` | Build for production |
| `npm start` / `npm run preview` | Start production server |
| `npx tsx scripts/seed-fake-entries.mjs` | Seed test data (entries) |

## Deploying

### Render (recommended — free, no credit card, no code changes)
1. Push to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. **Build command:** `npm install && npm run build`
4. **Start command:** `node dist/server/entry.mjs`
5. Add `GEMINI_API_KEY` as environment variable if using AI features

The free tier uses a persistent filesystem — sql.js database works out of the box. Note: disk is recycled on each redeploy so data is ephemeral across deploys.

## Project Structure

```
src/
├── ai/                  # AI service (Gemini + Groq + Mock)
│   ├── interface.ts           # AIService interface
│   ├── gemini.ts              # Google Gemini implementation
│   ├── groq.ts                # Groq Llama implementation
│   ├── mock.ts                # Mock fallback implementation
│   └── index.ts               # Factory / provider selection
├── components/          # Astro components
│   ├── EntryForm.astro        # Daily entry form
│   ├── ChapterList.astro      # 6-state syllabus list
│   ├── SyllabusCard.astro     # Subject progress card
│   ├── Sidebar.astro          # Navigation sidebar + ambience player
│   ├── WeakChapters.astro     # Weak chapter health card
│   ├── DailyActionCard.astro  # Priority recommendations
│   ├── ExamPaceWidget.astro   # Pace prediction widget
│   ├── MockTestWidget.astro   # Test score tracker
│   ├── MentorChat.astro       # AI Mentor chat UI with diagnostics
│   ├── StudyTimer.astro       # Study timer with save-as-entry
│   ├── AmbiencePlayer.astro   # Ambient sound player (Web Audio API)
│   ├── GuidedTour.astro       # Multi-step post-signup walkthrough
│   ├── GettingStarted.astro   # First-steps checklist card
│   ├── TourTooltip.astro      # Reusable one-time page tooltips
│   └── ...                    # Analytics chart components
├── db/                 # Database layer
│   ├── schema.ts              # SQL schema with user_id on all tables
│   ├── interface.ts           # DB interface with setCurrentUser
│   └── sqlite-adapter.ts      # sql.js implementation (user-scoped)
├── layouts/            # BaseLayout with sidebar + session user
├── pages/              # Routes and API endpoints
│   ├── index.astro            # Daily log / entry form
│   ├── dashboard.astro        # Analytics dashboard + tour + checklist
│   ├── login.astro            # Login page
│   ├── signup.astro           # Signup page
│   ├── onboarding.astro       # 4-step onboarding wizard
│   ├── syllabus.astro         # Syllabus tracker page
│   ├── mentor.astro           # AI Mentor chat page
│   ├── timer.astro            # Study timer page
│   ├── settings.astro         # Settings page
│   ├── api/
│   │   ├── auth/              # Login, signup, logout, session
│   │   ├── chapter-health/    # Weak chapter health API
│   │   ├── exam-pace/         # Pace prediction API
│   │   ├── mentor/            # AI Mentor streaming API (SSE)
│   │   ├── mock-tests/        # Mock test CRUD
│   │   ├── onboarding/        # Onboarding config endpoint
│   │   └── ...                # Existing API routes
│   └── weekly/                # Weekly review detail page
├── services/           # Business logic layer
│   ├── auth-service.ts        # Password hashing, session management
│   ├── user-scope.ts          # Request-scoped DB user context
│   └── ...
├── types/              # TypeScript interfaces
│   ├── entry.ts, review.ts, settings.ts
│   ├── ai.ts, mock-test.ts, auth.ts
│   └── ...
└── utils/              # Helpers (dates, UUID, syllabus data)

scripts/
├── seed-fake-entries.mjs    # Generate test data
└── delete-weekly-review.mjs # Clear weekly reviews
```

## License

MIT
