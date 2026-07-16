# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server (after build)
```

## Architecture

**WisePrep** is a static Next.js 14 (App Router) prototype — a bilingual (zh-TW/EN) interview prep platform for Taiwan's tech sector. There is no backend, no API routes, and no database. Content lives in versioned JSON under `src/data/`, surfaced through `src/lib/mock-data.ts`.

### Data layer

- **`src/lib/types.ts`** — All TypeScript interfaces: `Company`, `Role`, `InterviewFlow`, `InterviewStage`. Read this first when touching any data shape.
- **`src/data/companies.json`** — 52 companies. **Generated, do not hand-edit** — run `npm run scrape:companies` (Wikidata-sourced: canonical zh/en names, industry, HQ, website, founding year). Edit the seed at `scripts/scrape/seed/companies.seed.json` instead, then re-scrape.
- **`src/data/roles.json`** — 12-role curated taxonomy (hand-edited).
- **`src/data/interview-flows.json`** — Curated interview flows (hand-edited). No ToS-permitting bulk source exists for interview-process data, so these stay curated; `interviewDataCount`/`confidenceScore`/`hasUserReports` on each company are *derived from these flows* by the scraper.
- **`src/lib/mock-data.ts`** — Imports the three JSON files, casts to typed arrays, exposes helpers (`getCompanyBySlug`, `getRoleBySlug`, `getInterviewFlow`, `getFlowsForCompany`, `getFlowsForRole`). Same API as before the JSON migration.
- **`src/lib/utils.ts`** — Only exports `cn()` (clsx + tailwind-merge).

### Scraper (`scripts/scrape/`)

Re-runnable data pipeline. `npm run scrape` runs all sources; `npm run scrape:companies` runs just companies. Uses Node's built-in `fetch` (Node 18+), no extra deps. Wikidata is CC0 / open-API (ToS-permitting). `lib/wikidata.mjs` = API client; `lib/mappers.mjs` = label→enum mapping; `scrape-companies.mjs` = main merge of Wikidata facts over the curated seed.

### Reports → draft flows (`scripts/reports/`)

How real interview flows grow: users submit via `/report` (saved to `localStorage`), then click **匯出回報資料** to download `wiseprep-reports.json`. Run `npm run reports:to-flows -- <file>` to convert those into **draft** entries at `src/data/interview-flows.draft.json` (correct shape, sensible defaults, `TODO` markers + `_review` context). Drafts are never auto-merged — a curator fills the TODOs and moves good entries into `interview-flows.json` by hand. The draft file is a throwaway review artifact.

### Routing

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/companies` | Filterable company grid |
| `/companies/[slug]` | Company detail + tabbed interview timelines |
| `/roles` | Role grid grouped by category |
| `/roles/[roleSlug]` | Role guide with skills, checklist, and company-selector timeline |
| `/dashboard` | User progress tracker (client-side state only) |
| `/jd-analyze` | Paste a JD, get mock skill analysis |
| `/report` | Anonymous interview flow submission form |

Dynamic routes use `notFound()` for unknown slugs.

### Components (`src/components/`)

Shared UI lives in `components/`; layout wrappers (navbar, footer) in `components/layout/`. Key reusable pieces:

- `interview-flow-timeline.tsx` — Vertical stage timeline, used on both `/companies/[slug]` and `/roles/[roleSlug]`.
- `confidence-indicator.tsx` — Data reliability badge (full and compact variants).
- `progress-tracker.tsx` — Clickable stage progress bar (dashboard).
- `preparation-checklist.tsx` — Multi-section interactive checklist.
- `skill-badge.tsx` — CVA-styled tag for skills.

### UI stack

Tailwind CSS 3 + Radix UI primitives (Accordion, Dialog, Select, Tabs, Toast, etc.) + lucide-react icons. Import path alias `@/*` resolves to `src/*`. Use the `cn()` helper for all conditional classNames.

### Styling conventions

- Primary: indigo-600; success: emerald; warning: amber.
- Fonts: Inter (display/headings), Noto Sans TC (body/Chinese).
- All layout uses Tailwind; no CSS modules or styled-components.
