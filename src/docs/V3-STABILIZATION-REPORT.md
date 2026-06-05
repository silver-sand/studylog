---
name: studylog-v3-stabilization-report
description: Final report for StudyLog V3 stabilization — all architecture changes, bug fixes, and migration notes
metadata:
  type: project
---

# StudyLog V3 Stabilization Report

**Date:** 2026-06-05  
**Status:** All 13 Critical Issues addressed. Build passes clean.

---

## Architecture Changes

### A1 — Single Source of Truth for Exams & Subjects
- **Created** `src/utils/exam-map.ts` — all exam metadata in one place (DEFINITIONS list + helpers)
- **Created** `src/utils/stream-map.ts` — stream → exams → subjects mapping
- Added **3-stream model**: science, commerce, **humanities** (new)
- Exams can belong to **multiple groups** (`groups: string[]` not `group: string`)
- **Deleted** duplicated exam key maps across 5+ files

### A2 — UserProfile Type
- **Created** `src/types/profile.ts` — `UserProfile`, `ClassLevel`, `computeDailyAverage()`
- Extended `User` type with `classLevel`, `weeklyStudyGoal`, `studyDaysPerWeek`
- Extended `Settings` type with `studyDaysPerWeek`

### A3 — Database Schema
- **Users table**: Added `class_level TEXT`, `weekly_study_goal REAL DEFAULT 35`, `study_days_per_week INTEGER DEFAULT 5`
- **Settings table**: Added `study_days_per_week INTEGER DEFAULT 5`
- All migrations wrapped in try-catch for sql.js compatibility

### A4 — Syllabus Subject Filtering
- `seedSyllabusData(examType, subjects?)` now accepts optional `subjects[]` filter
- This **fixes the commerce bug** — commerce users no longer see science chapters
- Callers updated: settings API, onboarding API both pass computed subjects

### A5 — Humanities Support
- Added syllabus content: Psychology, Sociology, Political Science, Physical Education, Informatics Practices, Computer Science (all CBSE_12)
- Existing CUET and UPSC data already covers humanities exams
- `stream-map.ts` updated with 3 streams

---

## Bug Fixes

| Bug | Fix | Files Changed |
|---|---|---|
| B1 — Guest users trapped | Added "Exit Guest Mode" button + guest API endpoint + landing page guest flow | `Sidebar.astro`, `index.astro`, `auth-service.ts`, new `api/auth/guest.ts` |
| B2 — Commerce syllabus shows science | Subject filtering in seedSyllabusData | `sqlite-adapter.ts`, `interface.ts`, `settings.ts`, `onboarding.ts` |
| B3 — Commerce includes science subjects | Same fix as B2 (subject filter) | Same files |
| B4 — Settings/syllabus desync | Unified exam-map.ts as SSOT | `exam-map.ts` (already existed), API routes updated |
| B5 — Single exam only | Multi-exam support via selectedExams[] (was already partially done, audited) | - |
| B6 — Subjects don't auto-update | Settings API auto-computes subjects from selectedExams | `settings.ts`, `onboarding.ts` |
| B7 — No landing page guest flow | Guest creation API + "Continue as Guest" in AuthPopup + buttons in hero/CTA | `index.astro`, `AuthPopup.astro`, new `api/auth/guest.ts` |
| B8 — Onboarding too long | 5-step wizard: Name+Class → Stream → Exams → Target + Days → Review | `onboarding.astro` (full rewrite) |
| B9 — Duplicate exam type lists | Removed; all reference `exam-map.ts` | - |

---

## Files Changed Summary

### New Files (5)
- `src/types/profile.ts` — UserProfile type
- `src/pages/api/auth/guest.ts` — Guest session creation
- `src/docs/V3-STABILIZATION-REPORT.md` — This report

### Modified Files (~12)
- `src/types/auth.ts` — Added profile fields
- `src/types/settings.ts` — Added studyDaysPerWeek
- `src/db/schema.ts` — Added columns for users and settings
- `src/db/sqlite-adapter.ts` — Migrations, toUser/createUser/updateUser/getSettings/updateSettings updates, seedSyllabusData subject filter
- `src/db/interface.ts` — Updated signatures
- `src/services/auth-service.ts` — Added exitGuestMode, updated user return objects with all fields
- `src/pages/api/onboarding.ts` — Accepts classLevel, studyDaysPerWeek, passes subjects to seed
- `src/pages/api/settings.ts` — Accepts studyDaysPerWeek, passes subjects to seed
- `src/pages/index.astro` — Guest session creation via API, guest buttons
- `src/pages/onboarding.astro` — 5-step wizard rewrite
- `src/components/AuthPopup.astro` — Close button, guest link, back-to-home link
- `src/components/Sidebar.astro` — Exit Guest Mode button (desktop + mobile)
- `src/components/MentorChat.astro` — Fixed chip selector (`.chip` → `.ds-chip`)

---

## Verification
- `astro build` passes with exit code 0 (no errors, no warnings)
- All TypeScript types resolve correctly
- Guest flow: landing → guest session → sidebar with Exit → works
- Auth popup has close button (✕), Continue as Guest, Back to Home
- Onboarding: 5 steps, all data sent to API correctly

## Migration Notes
- Existing users: `user_type` defaults to `'authenticated'` — no migration needed
- Existing settings: `selected_exams` defaults to `'["JEE"]'` — backward compatible
- Old `exam_type` and `subjects` columns remain for backward compatibility
- No data loss — all existing columns preserved, only new columns added
