// Converts anonymous interview reports (exported from the /report form via the
// "匯出回報資料" button) into DRAFT interview-flow entries for human review.
//
//   npm run reports:to-flows -- ./wiseprep-reports.json
//
// Output: src/data/interview-flows.draft.json
//
// Drafts are intentionally NOT merged into src/data/interview-flows.json. A
// report only captures a thin skeleton (stage name / duration / difficulty), so
// each draft has TODO markers (format, questionTypes, prepTips, interviewerRole)
// that a curator fills in before pasting the good ones into the real file. This
// keeps real flow data trustworthy rather than auto-polluted by raw submissions.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(here, '../../src/data')
const OUT = resolve(DATA_DIR, 'interview-flows.draft.json')

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Usage: npm run reports:to-flows -- <path-to-exported-reports.json>')
  process.exit(1)
}

const companies = loadSlugs('companies.json')
const roles = loadSlugs('roles.json')
const existingFlows = existsSync(resolve(DATA_DIR, 'interview-flows.json'))
  ? JSON.parse(readFileSync(resolve(DATA_DIR, 'interview-flows.json'), 'utf8'))
  : []
const existingPairs = new Set(existingFlows.map((f) => `${f.companySlug}::${f.roleSlug}`))

let reports
try {
  reports = JSON.parse(readFileSync(resolve(process.cwd(), inputPath), 'utf8'))
} catch (e) {
  console.error(`Could not read/parse ${inputPath}: ${e.message}`)
  process.exit(1)
}
if (!Array.isArray(reports)) {
  console.error('Expected the export to be a JSON array of reports.')
  process.exit(1)
}
console.log(`[reports] read ${reports.length} report(s) from ${inputPath}`)

// Group by company × role; multiple reports for the same pair become one draft.
const groups = new Map()
let skipped = 0
for (const r of reports) {
  if (!r?.companySlug || !r?.roleSlug) { skipped++; continue }
  if (!companies.has(r.companySlug)) { console.warn(`[reports] ! unknown company "${r.companySlug}" — skipped`); skipped++; continue }
  if (!roles.has(r.roleSlug)) { console.warn(`[reports] ! unknown role "${r.roleSlug}" — skipped`); skipped++; continue }
  const key = `${r.companySlug}::${r.roleSlug}`
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(r)
}

const drafts = []
for (const [key, group] of groups) {
  const [companySlug, roleSlug] = key.split('::')
  // Representative skeleton = the report with the most stages.
  const rep = group.reduce((a, b) => (stagesOf(b).length > stagesOf(a).length ? b : a))
  const lastUpdated = group.map((r) => r.month).filter(Boolean).sort().pop() || nowMonth()
  const count = group.length

  drafts.push({
    id: `${companySlug}-${roleSlug}-draft`,
    companySlug,
    roleSlug,
    source: {
      count,
      hasUserReports: true,
      isInferred: false,
      lastUpdated,
      // More reports -> more confidence, but capped below curated-high until reviewed.
      confidenceScore: Math.min(45 + count * 8, 70),
    },
    stages: stagesOf(rep).map((s, i) => ({
      order: i + 1,
      name: s.name || 'TODO（英文關卡名）',
      nameZh: s.name || 'TODO（中文關卡名）',
      estimatedDuration: s.duration || 'TODO',
      format: rep.remote ? 'video' : 'onsite', // review: report has no per-stage format
      difficulty: clampDifficulty(s.difficulty),
      questionTypes: [], // TODO: fill from report tips / curator knowledge
      prepTips: [], // TODO
      interviewerRole: 'TODO（待補面試官角色）',
    })),
    _review: {
      aggregatedReports: count,
      offers: group.map((r) => r.offer).filter(Boolean),
      levels: [...new Set(group.map((r) => r.level).filter(Boolean))],
      tips: group.map((r) => r.tips).filter(Boolean),
      alreadyInRealFlows: existingPairs.has(`${companySlug}::${roleSlug}`),
      note: 'Draft from user reports. Fill TODO fields, then move into interview-flows.json.',
    },
  })
}

writeFileSync(OUT, JSON.stringify(drafts, null, 2) + '\n')
console.log(`[reports] wrote ${drafts.length} draft flow(s) (${skipped} report(s) skipped) -> ${OUT}`)
const collisions = drafts.filter((d) => d._review.alreadyInRealFlows).map((d) => d.id)
if (collisions.length) console.log(`[reports] note: ${collisions.length} draft(s) overlap existing real flows — merge, don't duplicate: ${collisions.join(', ')}`)

// --- helpers -------------------------------------------------------------
function loadSlugs(file) {
  return new Set(JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf8')).map((x) => x.slug))
}
function stagesOf(r) {
  return Array.isArray(r?.stages) ? r.stages : []
}
function clampDifficulty(d) {
  const n = Math.round(Number(d))
  return Math.max(1, Math.min(5, Number.isFinite(n) ? n : 3))
}
function nowMonth() {
  return new Date().toISOString().slice(0, 7)
}
