# SpendTrack

Offline-first spend tracker PWA built with Next.js 16, Dexie (IndexedDB), Tailwind CSS, and Recharts.

## Features implemented

- Daily, Monthly Needs, and Monthly Wants entry flows
- IndexedDB persistence with precomputed daily/weekly/monthly rollups
- Dashboard totals with current-week vs previous-week and month-over-month comparisons
- Analytics charts (trend + category split + monthly comparison)
- PWA manifest + service worker registration
- JSON export and import for IndexedDB data
- UTC storage + local date normalization with ISO week grouping

## Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000
