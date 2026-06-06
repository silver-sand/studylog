# StudyLog V4 — UX Audit Report

> Generated: 2026-06-06
> Phase: 1 of 12 (Complete audit before design or implementation)

---

## Table of Contents

1. [Landing Page](#1-landing-page)
2. [Authentication (AuthPopup)](#2-authentication)
3. [Guest Flow](#3-guest-flow)
4. [Onboarding Wizard](#4-onboarding-wizard)
5. [Dashboard](#5-dashboard)
6. [Sidebar & Navigation](#6-sidebar--navigation)
7. [Syllabus Tracker](#7-syllabus-tracker)
8. [AI Mentor](#8-ai-mentor)
9. [Settings / Study Profile](#9-settings--study-profile)
10. [Daily Log](#10-daily-log)
11. [Weekly Reviews](#11-weekly-reviews)
12. [Study Timer](#12-study-timer)
13. [Mobile Experience](#13-mobile-experience)
14. [Design System](#14-design-system)
15. [Empty States](#15-empty-states)
16. [Key Metrics Summary](#16-key-metrics-summary)

---

## 1. Landing Page

### Current State
A single-page hero-style landing page with navigation, hero section, 6 feature cards, a 3-step "how it works" section, a CTA section, and a footer.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| L1 | **No product screenshots** | HIGH | All 6 features are described with text + icons only. A student deciding whether to sign up cannot see what the dashboard, syllabus tracker, or mentor look like. This significantly reduces conversion. |
| L2 | **Hero text is generic** | MEDIUM | "Your study journey, intelligently tracked" + "AI-Powered Study Analytics" badge. This positions StudyLog as an analytics tool, not a Study Operating System. The tagline doesn't communicate the core value: "know exactly what to study next." |
| L3 | **No social proof** | MEDIUM | Zero testimonials, usage stats, or trust signals. For a study tool, showing "10,000+ students" or "Used by JEE aspirants" builds credibility. |
| L4 | **Two identical CTAs** | LOW | Two "Start Tracking Free" buttons (hero + CTA section) that do the same thing. This is redundant when both are visible. |
| L5 | **Features are feature-benefit mismatched** | MEDIUM | Feature cards describe WHAT the tool does, not WHY the user cares. E.g., "Micro Daily Log" describes the feature, not the benefit ("Log your study sessions in 30 seconds — no journaling friction"). |
| L6 | **No navigation on mobile** | MEDIUM | The "Features" and "How It Works" nav links are `display:none` on mobile, leaving mobile visitors with no way to jump to sections. |
| L7 | **CTA below fold not differentiated** | LOW | The hero CTA and section CTA are the same button. The section CTA should reinforce decision, not repeat. |
| L8 | **Footer is barren** | LOW | Just "© 2026 StudyLog" and "Built for students who mean business." No links, no social, no privacy policy. |

### Recommendations
- Replace icon grid with real product screenshots/screencasts
- Reframe hero around mission: "Know exactly what to study next"
- Add social proof block
- Streamline CTAs
- Add mobile nav

---

## 2. Authentication

### Current State
A modal overlay (`AuthPopup`) with login/signup tabs. Triggered from landing page "Log In" / "Get Started" buttons and sidebar auth buttons.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| A1 | **No loading state for tab switch** | LOW | Tab switching is instant only because it hides/shows forms. If any async work were added, no feedback. |
| A2 | **Error handling only on submit** | MEDIUM | No inline field validation. User fills 3 fields, submits, and only then learns the email format is wrong or password is too short. Should validate on blur or key-up. |
| A3 | **No password visibility toggle** | LOW | Password field has no eye icon to toggle visibility. Small UX win for a study tool used in varied environments. |
| A4 | **Guest flow is confusing** | MEDIUM | "Continue as Guest" link inside the modal AND sidebar shows "Exit Guest Mode" — but users don't understand what "Guest" means. They may fear data loss. |
| A5 | **Modal feels cramped on mobile** | MEDIUM | On small screens, the modal takes the full width but padding is tight. Close button is hard to hit on mobile. |
| A6 | **No email confirmation step** | LOW | Signup creates an account immediately — no email verification. This is acceptable for MVP but could lead to spam accounts. |
| A7 | **Post-signup redirect is abrupt** | LOW | After signup, users are sent directly to `/onboarding`. No transition or celebration. The onboarding starts cold. |

### Recommendations
- Add inline validation (on blur)
- Add password visibility toggle
- Clarify "Guest" vs "Account" with explanation text
- Improve mobile modal spacing
- Consider a brief "Account created!" transition before onboarding

---

## 3. Guest Flow

### Current State
Guest users are auto-created by middleware on first page visit. The guest flow is: landing page → click "Start Tracking Free" → guest session created → redirected to `/daily`.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| G1 | **Guest context is unclear** | HIGH | New users who click "Start Tracking Free" land on the daily log page with zero entries and no guidance about their guest status. The sidebar shows a small "Guest" badge but it's easy to miss. |
| G2 | **No upgrade prompt during value moments** | MEDIUM | Guest users can log entries, use the mentor, and track syllabus — but only the sidebar's small "Sign Up" button hints that data could be lost. A well-timed upgrade prompt after 3 entries would convert better. |
| G3 | **No explanation of guest limitations** | MEDIUM | The guest flow doesn't explain that data is stored locally/in-memory and will be lost on logout or browser clear. Users could lose real study data. |
| G4 | **Guest exit destroys session only** | LOW | "Exit Guest Mode" logs out the user but their data remains orphaned (unless they sign up). The UX doesn't explain what happens. |

### Recommendations
- Add a gentle banner explaining guest mode on first visit
- Show upgrade prompts at value moments (after 3rd entry, after generating a review)
- Add a card on the dashboard: "Sign up to keep your data forever"
- Clarify "Exit Guest" with a confirmation dialog

---

## 4. Onboarding Wizard

### Current State
An 8-step wizard (7 content steps + welcome screen) that collects name, class, stream, exams, coaching, target, and weekly hours. Accessible via `/onboarding` (new user) or `/onboarding?update=1` (existing user).

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| O1 | **Step indicator is cryptic** | MEDIUM | Steps are numbered 1-6 with a flag emoji for step 0. Users don't know what each step covers until they arrive at it. No descriptive labels on the step indicator. |
| O2 | **No back button on step 1** | LOW | Step 1 has no back button. If a user accidentally enters onboarding, they must refresh or navigate away — no "go back to welcome" option. |
| O3 | **Stream selection requires clicking a chip** | MEDIUM | Step 2's stream selection uses static chips. There's no visual differentiation beyond border color when selected. Users might miss that they need to click. |
| O4 | **Exam cards invisible after stream change** | HIGH | AFTER my fix (ds-hidden→hidden), exam cards are now visible on step 3. But cards are filtered by stream from step 2 — if the user changes their mind and goes back, the filtering works subtly. |
| O5 | **No "skip" option** | MEDIUM | Every field is mandatory (except weak subjects and target). Some users might not know their class or stream yet. |
| O6 | **Review screen has no action affordance** | MEDIUM | Step 7 (review) shows all selections in a text summary. There's no visual preview of what the workspace will look like — no mock dashboard, no subject cards. |
| O7 | **Onboarding is too long** | MEDIUM | 8 steps for a study tracker is a lot. Users who just want to start tracking face friction. Consider condensing to 4-5 steps. |
| O8 | **No exit option** | MEDIUM | Once in the onboarding flow, there's no way to exit. No "skip for now" or "I'll do this later" link. |
| O9 | **Step 0 to 1 transition is text-heavy** | LOW | The welcome screen has 3 paragraphs of text. A new user wants to get started, not read. |

### Recommendations
- Add descriptive labels to step indicator
- Add "Skip for now" on non-critical steps
- Condense to 5 steps: Profile → Exams → Goals → Commitment → Review
- Add a workspace preview on the review screen
- Allow exiting onboarding at any point

---

## 5. Dashboard

### Current State
A vertical scroll of widgets: GettingStarted → StreakDisplay → WeeklyProgress → 4 StatsCards → 2 DailyAction/WeakChapters → 2 Chart rows → FocusTrend.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| D1 | **No "what to study next" answer** | CRITICAL | The dashboard does not answer the primary question "What should I study today?" within the first glance. Users see stats and charts before actionable guidance. |
| D2 | **Analytics overload** | HIGH | 8+ widgets on a single page. Streak, Weekly Progress, 4 stats cards, Daily Action, Weak Chapters, StudyTrend, TypeBreakdown, SubjectHours, WeekComparison, FocusTrend. This is overwhelming. |
| D3 | **Information hierarchy is inverted** | HIGH | The first thing users see is "Getting Started Checklist" (useful but for new users) and a streak counter. What they NEED to see is: "Here's what you should study today." |
| D4 | **Charts lack context** | MEDIUM | Each chart (SubjectHours, StudyTrend, FocusTrend) shows data but no interpretation. "Your focus has dropped 20% this week" would be more valuable than a line chart. |
| D5 | **WeekComparison has no instruction** | LOW | "Week Over Week" shows prev/current hours and change, but doesn't explain what the user should DO with this information. |
| D6 | **Tour conflicts with first-use experience** | MEDIUM | The GuidedTour and TourTooltip components fire on first visit but overlap with the GettingStarted checklist. New users get a tour overlay AND a checklist — too much simultaneous guidance. |
| D7 | **Stats cards are low-value** | MEDIUM | "This Week: 3 study days" and "This Month: 10 entries logged" — these are vanity metrics. The user can't act on them. |
| D8 | **MockTestWidget and ExamPaceWidget are blank for new users** | MEDIUM | These widgets show empty states with no guidance on how to start using them. |

### Recommendations
- **Flip the hierarchy**: Today's Focus first → Weak Chapters → Quick Action → THEN analytics
- Reduce from 8+ widgets to 4-5 core sections
- Add a "What should I study today?" card that uses AI + syllabus progress
- Replace raw charts with insight-driven summaries
- Merge Tour and GettingStarted into a single progressive entry experience

---

## 6. Sidebar & Navigation

### Current State
A Notion-style fixed sidebar (16rem) on desktop, bottom tab bar on mobile. 7 nav items: Daily Log, Dashboard, Weekly Reviews, Syllabus, AI Mentor, Timer, Settings.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| S1 | **No visual hierarchy in nav** | MEDIUM | 7 items stacked linearly with no grouping. Primary actions (Daily Log, Dashboard) look the same as secondary (Timer, Settings). |
| S2 | **Active state is too subtle** | LOW | Active nav item uses `background: rgba(59, 130, 246, 0.1)` and `color: #f1f5f9`. The difference from inactive (`color: #94a3b8`) is noticeable but could be stronger. |
| S3 | **Guest section is confusing** | MEDIUM | The sidebar bottom shows "Guest" badge + "Sign Up" + "Log In" + "Exit Guest Mode" — 4 distinct actions in a tiny space. This is decision overload. |
| S4 | **User profile area is wasted** | MEDIUM | Authenticated users see just a truncated name (`.text-xs`) and "Log out". No avatar, no quick-profile, no context. |
| S5 | **Mobile nav duplicates desktop actions** | LOW | Mobile bottom nav duplicates the sidebar AND adds duplicate auth buttons (Sign Up, Log In, Exit). The mobile nav shows 7 nav + up to 3 auth buttons = 10 items in a cramped bar. |
| S6 | **AmbiencePlayer is disconnected** | LOW | The AmbiencePlayer (sound/background noise) is in the sidebar but has no visual connection to studying or focus. |
| S7 | **Nav labels are flat** | LOW | "Timer" could be "Study Timer". "Mentor" could be "AI Mentor". Small distinction but sets clearer expectations. |

### Recommendations
- Group nav into: Primary (Daily Log, Dashboard) | Review (Weekly Reviews, Syllabus) | Tools (AI Mentor, Timer) | Configure (Settings)
- Improve user profile section with avatar, name + email, quick stats
- Add icon + label treatment for active state (pill highlight)
- Simplify mobile nav — 5 core items, move Settings to a sub-menu
- Remove or simplify AmbiencePlayer from navigation

---

## 7. Syllabus Tracker

### Current State
Exam tab bar → overall progress bar → expandable subject cards with chapter lists. Each chapter has status buttons (6-state: not_started through mastered).

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| SY1 | **Tab switching resets content** | MEDIUM | Switching exam tabs hides/shows content blocks. If a user was reading chapter details in one exam, they lose their place when switching. |
| SY2 | **Chapter list expand is undiscoverable** | HIGH | Subject cards LOOK clickable (cursor:pointer, hover effect) but users may not realize they expand to show chapters. No chevron arrow or visual hint. |
| SY3 | **6 status buttons are overwhelming** | MEDIUM | "Not Started → Studying → Revision 1 → Revision 2 → Revision 3 → Mastered" is complex. Students may not understand the difference between Revision 2 and 3. |
| SY4 | **Progress percentage is meaningless out of context** | MEDIUM | "73%" on a subject card tells the user completion, but not whether they're ON TRACK. A pace indicator (ahead / behind / on track) would be more actionable. |
| SY5 | **No "focus here" recommendations** | HIGH | The syllabus shows ALL chapters sorted by subject. It doesn't highlight which chapters the user should study NEXT based on exam proximity, weak areas, or revision schedule. |
| SY6 | **Subject cards are visually uniform** | LOW | All subject cards look the same. Different subjects (Physics vs Chemistry) could use distinct accent colors for scanability. |
| SY7 | **No search/filter** | MEDIUM | With 30+ chapters per subject, users need to scroll to find a specific chapter. No search or filter by status. |

### Recommendations
- Add chevron icon to expandable cards
- Add "Next to Study" recommendation section
- Add search/filter by chapter name or status
- Show pace indicator alongside completion percentage
- Consider simplifying milestone states (4 instead of 6)

---

## 8. AI Mentor

### Current State
A chat interface with welcome message, suggestion chips, text input, and send button. SSE streaming for responses. Diagnostic bar shows provider and latency.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| M1 | **No chat history persistence** | HIGH | Every visit starts with a fresh empty chat. Returning users cannot see previous conversations, recommendations, or insights. This is the #1 frustration in AI chat UIs. |
| M2 | **Diagnostic bar is developer-facing** | MEDIUM | "Gemini · 1.2s latency" means nothing to a student. This should be removed or hidden behind a dev toggle. |
| M3 | **Suggestion chips are static** | MEDIUM | The 3 chips ("What to study?", "Quiz me", "Weak areas") are the same for ALL users regardless of context. A student with 0 entries gets the same options as one with 50. |
| M4 | **Empty state wastes the first impression** | MEDIUM | The welcome message is a wall of text: "Hi! I'm your AI study mentor. I can see your study history..." followed by a bullet list. Most users won't read it. |
| M5 | **No typing indicator** | LOW | When the AI is generating, there's no "..." typing indicator. The send button just disables. Users may think nothing is happening. |
| M6 | **No ability to stop generation** | LOW | Once the AI starts responding, users cannot cancel mid-stream. |
| M7 | **Send button is always visible but often disabled** | LOW | The send button is visible with disabled styling when the input is empty. Fitts' law suggests the button should enable/disable contextually but remain where the user expects it. |

### Recommendations
- Persist chat history per user (or at minimum show last session)
- Remove diagnostic bar from production
- Make suggestion chips contextual (based on recent entries, syllabus progress)
- Add typing indicator + stop generation button
- Improve welcome message with quick actions, not prose

---

## 9. Settings / Study Profile

### Current State
A single long form with 7 sections: Account, Study Profile (read-only), Weekly Target, Stream, Exams, Subjects (auto-generated), Exam Date.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| ST1 | **"Settings" is the wrong name** | HIGH | "Settings" implies technical configuration. Students think "Study Profile" or "My Profile." The current name reduces perceived importance. |
| ST2 | **No workspace preview before saving** | HIGH | Users configure stream, exams, subjects, and weekly target — but never SEE what their workspace will look like until they go to the dashboard. |
| ST3 | **Subjects section is read-only** | MEDIUM | Subjects are auto-computed from exams. If a user wants to study a subject not covered by their exams, there's no way to add it. |
| ST4 | **Study Profile section is beautiful but useless** | MEDIUM | The "Study Profile" card shows the user's profile in nice chips ("Class 11", "Science", etc.) but is purely decorative — clicking "Update Study Profile" sends them to the onboarding flow. |
| ST5 | **Save feedback is weak** | LOW | Save shows "Saved." text for 2 seconds then disappears. No toast, no confirmation. |
| ST6 | **Exam Date picker lacks context** | LOW | The date picker shows a date but doesn't show "X days remaining" or translate the date into action. |

### Recommendations
- Rename "Settings" → "Study Profile"
- Add workspace preview card showing selected exams, subjects, and projected timeline
- Make Subjects editable (optional override)
- Add days-remaining countdown for exam date
- Better save confirmation (toast notification)

---

## 10. Daily Log

### Current State
Page header → Entry Form → Daily Review section (if entries exist) → Recent Entries list. The entry form collects subject, chapter, hours, study type, focus rating.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| DL1 | **Entry form is too wide** | LOW | The form takes the full page width on desktop. A max-width of ~36rem would be easier to scan. |
| DL2 | **No subject pre-population from syllabus** | MEDIUM | The subject dropdown shows subjects from settings, but doesn't prioritize weak subjects or suggest the next chapter to study. |
| DL3 | **Daily Review generate button is buried** | LOW | After logging an entry, the "Generate Daily Review" button is in a card below the form. Users may not see it. |
| DL4 | **Entry list has no date grouping** | MEDIUM | Recent entries are displayed as a flat list sorted by date. No "Today", "Yesterday", "This Week" grouping. |
| DL5 | **AI provider label is confusing** | LOW | "AI: Offline mode" or "AI: Gemini" appears in the page header. Students don't care which AI provider runs the review. |

### Recommendations
- Narrow entry form width
- Add "suggested subject" from syllabus weak areas
- Add date grouping to entry list
- Remove AI provider label from user-facing UI

---

## 11. Weekly Reviews

### Current State
List page (`/weekly/index`) shows "This Week" card and past reviews. Detail page (`/weekly/[weekStart]`) shows full review content with navigation between weeks.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| W1 | **Reviews feel like AI-generated reports** | MEDIUM | The review card shows text content, percentages, and recommendations — but it reads like a machine report, not a personalized coach note. |
| W2 | **No review summary on cards** | MEDIUM | The review LIST shows only the week range and a "View Review" button. No preview snippet or key insight. |
| W3 | **Navigation is functional but not delightful** | LOW | Prev/next week arrows work but the review detail page is just a wall of text. No visual summary. |
| W4 | **Generate button is confusing on refresh** | LOW | "Regenerate" button appears even if the review was just generated. Could cause accidental regen. |

### Recommendations
- Format review content more like a coach note, less like an AI dump
- Show review snippet on list cards
- Add visual summary (progress bars, key metrics) at top of review detail
- Add confirmation for regenerate action

---

## 12. Study Timer

### Current State
A focused timer page with subject/topic selection, start/pause/resume controls, and session save functionality.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| T1 | **Timer is isolated from Daily Log** | MEDIUM | Timer sessions save to the entry form via sessionStorage but the user must manually submit. The handoff feels disjointed. |
| T2 | **No timer history** | LOW | Only current session is shown. No history of past timer sessions. |
| T3 | **Mobile timer layout is cramped** | LOW | On small screens, the subject selector and timer controls overlap or squish. |

### Recommendations
- Add "auto-save on stop" option
- Show timer session history
- Optimize mobile layout

---

## 13. Mobile Experience

### Current State
Responsive layout using Tailwind breakpoints. Sidebar becomes bottom nav on mobile. Charts stack vertically.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| MO1 | **Bottom nav is overloaded** | HIGH | Mobile bottom nav has 7+ items. The icons are small and labels are 0.625rem — hard to tap accurately. |
| MO2 | **Dashboard scroll is excessive on mobile** | HIGH | With 8+ widgets stacked vertically, mobile users must scroll significantly to see all content. |
| MO3 | **Charts are tiny on mobile** | MEDIUM | SubjectHoursChart, StudyTrendChart, FocusTrend all render at mobile widths where labels and bars are hard to read. |
| MO4 | **Forms use full width without optimization** | MEDIUM | Entry form inputs stretch full width but labels and fields could be better spaced. |
| MO5 | **Modal (AuthPopup) tap targets are small** | MEDIUM | Close button, tab buttons, and form inputs could benefit from larger tap targets on mobile. |
| MO6 | **No touch-friendly gestures** | LOW | No swipe gestures for navigation, no pull-to-refresh on lists. |

### Recommendations
- Reduce bottom nav to 5 core items
- Condense dashboard for mobile (hide less important widgets)
- Add responsive chart rendering (simplified on mobile)
- Increase minimum tap target size to 44px on mobile
- Add pull-to-refresh on entry list and reviews

---

## 14. Design System

### Current State
1370-line `design-system.css` with CSS custom properties for color, typography, spacing, radius, shadows. Component classes for cards, buttons, inputs, tabs, progress bars.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| DS1 | **Color feels too flat** | MEDIUM | The current 70-20-10 ratio is closer to 80-15-5. Backgrounds all blend together (`#020617`, `#0f172a`, `#1e293b`). Not enough surface differentiation. |
| DS2 | **Typography scale is good but usage is inconsistent** | MEDIUM | `ds-heading-page`, `ds-heading-section`, `ds-body-sm`, `ds-caption` exist but many pages use inline styles instead of these utilities.  |
| DS3 | **Spacing is NOT on the proposed 8-16-24-32-48-64 scale** | HIGH | Current spacing includes `--ds-space-0.5` (2px), `--ds-space-1.5` (6px), `--ds-space-2.5` (10px), `--ds-space-3.5` (14px), `--ds-space-5` (20px), `--ds-space-8` (32px), `--ds-space-10` (40px), `--ds-space-20` (80px). This is a 4px grid, not the target 8-step scale. |
| DS4 | **No dark surface tiering** | MEDIUM | The current system has 3 background levels (base, surface, elevated). A 4th tier (surface-800, surface-900) would add depth. |
| DS5 | **Buttons lack hover/focus state consistency** | LOW | Some buttons have hover states, some don't. Focus-visible styling is global but not consistently applied. |
| DS6 | **No component documentation** | HIGH | Classes like `ds-card`, `ds-btn`, `ds-tab` exist but there's no living style guide or documentation. New developers must read the CSS. |

### Recommendations
- Adopt the 8-step spacing scale (8, 16, 24, 32, 48, 64) and remove intermediate values
- Add 4th background tier (surface-800) for depth
- Audit all pages for design system class usage vs inline styles
- Create a living style guide / documentation
- Add intentional contrast: use accent colors more purposefully

---

## 15. Empty States

### Current State
`EmptyState.astro` component renders a generic plus-circle icon + title + description. Individual widgets have varying empty state handling.

### UX Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| E1 | **No call to action in EmptyState component** | HIGH | The EmptyState component ONLY shows icon + title + description. No button, no link, no next step. Users see "No data" with no way to fix it. |
| E2 | **Empty states are inconsistent** | MEDIUM | Some widgets have custom empty states (WeekComparison: "Start logging your study sessions..."), others use the generic EmptyState, others show nothing. |
| E3 | **Zero guidance in empty states** | MEDIUM | "Start logging your study sessions to see your progress here." is better than "No data" but still doesn't say HOW or WHERE to log. |
| E4 | **No celebration for first entry** | LOW | When a user logs their first entry, the empty state disappears with no acknowledgment. A small "🎉 First entry logged!" would boost motivation. |

### Recommendations
- Add CTA button to EmptyState component
- Create empty state variations per page
- Add first-entry celebration
- All empty states must follow: Explanation + Guidance + Primary Action

---

## 16. Key Metrics Summary

### Critical Issues (Must Fix)
1. Dashboard does NOT answer "What should I study next?" (D1)
2. Analytics overload — 8+ widgets competing for attention (D2)
3. No workspace preview in settings/onboarding (ST2)
4. Empty states lack call-to-action (E1)
5. Chat history not persisted (M1)

### High Severity Issues
1. Landing page has no product screenshots (L1)
2. Onboarding has no exit/skip (O7, O8)
3. Guest user data loss risk not communicated (G3)
4. Chapter list expand is undiscoverable (SY2)
5. No "next to study" recommendations in syllabus (SY5)
6. Mobile bottom nav is overloaded (MO1)
7. Dashboard mobile scroll is excessive (MO2)
8. "Settings" naming vs "Study Profile" (ST1)

### Quick Wins (Low effort, High impact)
1. Remove diagnostic bar from Mentor chat (M2)
2. Add chevron icon to expandable syllabus cards (SY2)
3. Remove AI provider label from Daily Log (DL5)
4. Add "Skip for now" to onboarding (O5)
5. Group sidebar nav items (S1)
6. Add password visibility toggle (A3)

---

*End of UX Audit Report — Phase 1 complete.*
*Next: Phase 2 — Design System Reconstruction.*
