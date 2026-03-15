# SpendTrack Project Instructions

This document defines how to build and maintain this project clearly and consistently.

## 1) Project Purpose

SpendTrack is an offline-first PWA for tracking:

- Daily Spending
- Monthly Needs
- Monthly Wants

Core requirements:

- Works offline (service worker + IndexedDB)
- Accurate weekly/monthly comparisons
- UTC-safe storage with local-date analytics
- JSON export/import portability

## 2) Tech Stack (Locked)

- Framework: Next.js 16 (App Router)
- Language: TypeScript (strict)
- Package manager: pnpm
- Storage: IndexedDB via Dexie
- Styling: Tailwind CSS (soft/pastel modern)
- Charts: Recharts

Do not introduce alternate stack tools unless there is a strong requirement.

## 3) Project Structure Responsibilities

- `app/`
  - Route pages only (screen composition, UI wiring, user interactions)
- `components/`
  - Reusable presentational and interactive UI components
- `lib/db/`
  - Dexie schema + repository functions (all IndexedDB access)
- `lib/analytics/`
  - Formatting and analytics helpers
- `lib/time/`
  - Timezone/date normalization and ISO week logic
- `lib/export/`
  - JSON export logic
- `lib/import/`
  - JSON import parsing and normalization
- `public/`
  - PWA assets (`manifest.webmanifest`, `sw.js`, icons)

Rule: keep DB/business logic out of page components whenever possible.

## 4) Data Model Rules (Source of Truth)

Canonical transaction categories:

- `daily_spending`
- `monthly_needs`
- `monthly_wants`

Transaction rules:

- Store `amount` as non-negative integer
- Store timestamp in UTC (`dateUTC`)
- Derive and persist `localDate`, `yearMonth`, `isoYear`, `isoWeek`
- Supported `entryType`: `manual | itemized | daily_total`

Rollups:

- `dailyRollups` and `periodRollups` are derived cache tables
- Always update rollups through repository methods
- Never manually mutate rollup tables from UI code

## 5) Timezone & Date Consistency

- Normalize input date into UTC for storage
- Use local date for grouping and display
- Use ISO week (Mon-Sun) for week comparisons
- Avoid custom week systems unless product requirement changes

## 6) Import/Export Standards

Export:

- Must include transactions + rollup tables + settings/meta
- Output is valid JSON and downloadable from UI

Import:

- Accept both app-export format and legacy monthly format (`sample.json` style)
- Import is append-only by default
- Validate date and amount before insertion
- Route all inserts through repository functions to keep rollups correct

## 7) UI/UX Consistency

- Mobile-first layouts
- Use existing utility classes in `app/globals.css` (`card`, `input`, `btn`, `btn-secondary`)
- Keep a soft/pastel visual tone (from Tailwind theme tokens)
- Do not hardcode unrelated new colors or ad-hoc component styles

## 8) Coding Conventions

- Keep functions small and single-purpose
- Prefer explicit TypeScript types for public functions
- Use descriptive names (avoid one-letter variables)
- Do not add inline comments unless logic is non-obvious
- Keep changes scoped to the requested feature

## 9) Development Workflow

Use pnpm only:

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

Before finalizing any feature:

1. Run `pnpm typecheck`
2. Run `pnpm build`
3. Ensure routes still render and core flows still work offline

## 10) Feature Change Checklist

When adding features, verify:

- [ ] Works offline with existing service worker behavior
- [ ] Uses repository layer for DB writes/reads
- [ ] Preserves timezone and ISO-week logic
- [ ] Keeps dashboard totals/comparisons correct
- [ ] Supports export/import compatibility if data shape changes
- [ ] Passes `pnpm typecheck` and `pnpm build`

## 11) Scope Discipline

- Prefer minimal, focused implementation
- Do not introduce unrelated refactors in feature PRs
- If changing schema, include migration strategy in Dexie versioning

---

If future contributors follow this file, the codebase stays predictable, maintainable, and consistent.
