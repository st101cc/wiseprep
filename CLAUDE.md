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

**WisePrep** is a static Next.js 14 (App Router) prototype — a bilingual (zh-TW/EN) interview prep platform for Taiwan's tech sector. Content lives in versioned JSON under `src/data/`, surfaced through `src/lib/mock-data.ts`. Server code: `/api/next-step` (LLM analysis), `/api/google/*` + `/api/calendar/sync` (Google Calendar) and `/api/parse-cv` (CV upload → text via `unpdf`, PDF/TXT/MD, nothing stored); user state is localStorage-first, mirrored to Supabase when logged in.

### Data layer

- **`src/lib/types.ts`** — All TypeScript interfaces: `Company`, `Role`, `InterviewFlow`, `InterviewStage`. Read this first when touching any data shape.
- **`src/data/companies.json`** — 53 companies. **Generated, do not hand-edit** — run `npm run scrape:companies` (Wikidata-sourced: canonical zh/en names, industry, HQ, website, founding year). Edit the seed at `scripts/scrape/seed/companies.seed.json` instead, then re-scrape.
- **`src/data/roles.json`** — 13-role curated taxonomy (hand-edited).
- **`src/data/interview-flows.json`** — Curated interview flows (hand-edited). No ToS-permitting bulk source exists for interview-process data, so these stay curated; `interviewDataCount`/`confidenceScore`/`hasUserReports` on each company are *derived from these flows* by the scraper.
- **`src/lib/mock-data.ts`** — Imports the three JSON files, casts to typed arrays, exposes helpers (`getCompanyBySlug`, `getRoleBySlug`, `getInterviewFlow`, `getFlowsForCompany`, `getFlowsForRole`). Same API as before the JSON migration.
- **`InterviewFlow.compensation`** (optional) — sourced salary band + target band per company×role, rendered by `components/compensation-card.tsx` with a private (localStorage-only) offer calculator. Math lives in `src/lib/compensation.ts`; check with `node --experimental-strip-types src/lib/compensation.check.ts` (`*.check.ts` is excluded from tsconfig).
- **Auth + sync** — Supabase email magic link (`/profile`). `src/lib/cloud-state.ts`: `saveLocal()` writes localStorage and pushes the synced keys to `profiles.state` (one jsonb row per user, RLS-scoped; schema in `scripts/supabase/schema.sql`); `components/cloud-sync.tsx` pulls the account copy on load/sign-in if newer.
- **`/api/next-step`** — verifies the Supabase token, reads the caller's profile, builds the prompt (`src/lib/next-step.ts`) and calls any OpenAI-compatible endpoint via `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` / `LLM_FALLBACK_MODEL` (server-only env; falls back on 429/5xx).
- **Google Calendar sync** — `/profile` connects Google (scope `calendar.app.created`: only the app-created "WisePrep" calendar). `src/lib/calendar-events.ts` (pure, check: `node --experimental-strip-types src/lib/calendar-events.check.ts`) turns targets into all-day round events + 3 evening prep blocks; `src/lib/google-calendar.ts` does OAuth/REST via fetch, AES-GCM-encrypted refresh token in Supabase `google_calendar`, idempotent sync (deterministic event ids, deletes stale future events). Routes: `/api/google/{connect,exchange,disconnect}`, `/api/calendar/sync`; target changes auto-sync via `saveLocal` when connected. Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_KEY`. Auth helper for all routes: `src/lib/server-auth.ts` `requireUser()`.
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
