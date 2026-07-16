# WisePrep

A bilingual (Traditional Chinese / English) interview preparation platform for Taiwan's tech sector. WisePrep helps job seekers understand the real interview process at specific companies and roles — not just generic tips, but curated stage-by-stage timelines, skill checklists, and preparation roadmaps tailored to each target.

## Background

Preparing for a tech interview in Taiwan is hard because interview process information is scattered across PTT threads, Dcard posts, and word-of-mouth. There is no centralized, structured resource that tells you: _"If you're interviewing at Trend Micro for a backend engineer role, here's what each round looks like, what skills matter most, and what to focus on."_

WisePrep was built to fill that gap. The core idea is simple: if you know which company and role you're targeting, the preparation path should be concrete and actionable. The platform provides:

- **Company profiles** — 52+ Taiwan tech companies sourced from Wikidata, with industry, location, and interview data counts
- **Role guides** — 12 curated role types (Backend Engineer, Data Scientist, etc.) with required skills, nice-to-haves, and interview question patterns
- **Interview flow timelines** — Stage-by-stage breakdowns of real interview processes (round names, formats, estimated durations, difficulty, and prep tips per stage)
- **JD analyzer** — Paste a job description and get a mock skill-gap analysis
- **Progress dashboard** — Track your preparation across companies and stages (client-side only)
- **Community reports** — Anonymous submission form so users can contribute real interview experiences back into the dataset

WisePrep is a **static Next.js site** — there is no backend or database. All content lives in versioned JSON files under `src/data/`, and the data pipeline is a Node.js scraper that pulls company metadata from the Wikidata open API.

## How to Use

### Prerequisites

- Node.js 18+
- npm

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

### Production build

```bash
npm run build
npm start
```

### Updating company data

Company metadata (names, industry, HQ, website, founding year) is sourced from Wikidata. To refresh it:

```bash
npm run scrape
```

Do **not** hand-edit `src/data/companies.json` — it is generated. To add or correct a company, edit the seed file at `scripts/scrape/seed/companies.seed.json`, then re-run the scraper.

### Adding interview flows from user reports

When users submit interview experiences via `/report`, they can export a `wiseprep-reports.json` file. To convert these into draft interview flows:

```bash
npm run reports:to-flows -- <path-to-wiseprep-reports.json>
```

This generates `src/data/interview-flows.draft.json` with `TODO` markers for a curator to review. Once reviewed, move the validated entries into `src/data/interview-flows.json` by hand. Drafts are never auto-merged.

### Key routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/companies` | Filterable company grid |
| `/companies/[slug]` | Company detail with tabbed interview timelines |
| `/roles` | Role grid grouped by category |
| `/roles/[roleSlug]` | Role guide with skills, checklist, and per-company timelines |
| `/dashboard` | Personal progress tracker |
| `/jd-analyze` | Job description analyzer |
| `/report` | Anonymous interview experience submission |

### Linting

```bash
npm run lint
```

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS 3, Radix UI primitives, Lucide React icons
- **Data:** Static JSON (`src/data/`) loaded via `src/lib/mock-data.ts`
- **Data pipeline:** Node.js scraper using Wikidata's CC0 open API
