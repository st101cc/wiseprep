// Builds src/data/companies.json from REAL Wikidata facts (canonical names,
// industry, HQ, website, founding year) merged over a curated seed list.
//
// Interview-signal fields (interviewDataCount / confidenceScore / hasUserReports)
// are NOT invented here — they are derived from the interview flows we actually
// hold (src/data/interview-flows.json). A company with no real flows honestly
// reports zero, which is the whole point of "real vs. demo".
//
// Re-run: npm run scrape:companies

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  searchEntity, getEntities, label, claimEntityIds, claimStrings, claimYear, P,
} from './lib/wikidata.mjs'
import { mapIndustry, mapCities } from './lib/mappers.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(here, '../../src/data')
const SEED = resolve(here, 'seed/companies.seed.json')
const OUT = resolve(DATA_DIR, 'companies.json')
const FLOWS = resolve(DATA_DIR, 'interview-flows.json')

export async function run() {
  const seed = JSON.parse(readFileSync(SEED, 'utf8')).companies
  console.log(`[companies] seed entries: ${seed.length}`)

  // 1. Resolve each seed entry to a Wikidata QID (pinned or searched).
  const resolved = []
  for (const s of seed) {
    let qid = s.qid ?? null
    if (!qid) {
      qid = await searchEntity(s.searchName, 'en')
      if (qid) console.log(`[companies] resolved ${s.slug} -> ${qid}`)
      else console.warn(`[companies] ! no Wikidata match for "${s.searchName}" (${s.slug}) — using seed only`)
    }
    resolved.push({ seed: s, qid })
  }

  // 2. Fetch the company entities, then the entities they reference (industry, HQ).
  const companyQids = [...new Set(resolved.map((r) => r.qid).filter(Boolean))]
  const entities = await getEntities(companyQids)

  const refQids = new Set()
  for (const qid of companyQids) {
    const e = entities[qid]
    claimEntityIds(e, P.industry).forEach((id) => refQids.add(id))
    claimEntityIds(e, P.headquarters).forEach((id) => refQids.add(id))
  }
  const refs = await getEntities([...refQids])

  // 3. Build records: real Wikidata facts win, seed fills the gaps.
  const flowSignals = readFlowSignals()
  const nowMonth = new Date().toISOString().slice(0, 7)
  let enriched = 0

  const companies = resolved.map(({ seed: s, qid }) => {
    const e = qid ? entities[qid] : null

    const nameEn = (e && label(e, ['en'])) || s.searchName
    const nameZh = (e && label(e, ['zh-tw', 'zh-hant', 'zh'])) || s.name

    const industryLabels = e ? claimEntityIds(e, P.industry).map((id) => label(refs[id], ['en', 'zh-tw'])) : []
    const industry = mapIndustry(industryLabels) || s.industry

    const hqLabels = e ? claimEntityIds(e, P.headquarters).flatMap((id) => [label(refs[id], ['zh-tw', 'zh-hant', 'zh']), label(refs[id], ['en'])]) : []
    const cities = mapCities(hqLabels)
    const location = cities.length ? cities : s.location

    const website = e ? (claimStrings(e, P.website)[0] ?? null) : null
    const founded = e ? claimYear(e, P.inception) : null
    if (e) enriched++

    const sig = flowSignals[s.slug] ?? { count: 0, hasUserReports: false, lastUpdated: nowMonth }

    return {
      slug: s.slug,
      name: nameZh,
      nameEn,
      industry,
      companyType: s.companyType,
      location,
      commonRoles: s.commonRoles,
      interviewDataCount: sig.count,
      lastUpdated: sig.lastUpdated,
      hasUserReports: sig.hasUserReports,
      // Real, sourced extras (optional in the type; surfaced in the UI where useful):
      website,
      founded,
      wikidataId: qid,
    }
  })

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(OUT, JSON.stringify(companies, null, 2) + '\n')
  console.log(`[companies] wrote ${companies.length} companies (${enriched} enriched from Wikidata) -> ${OUT}`)
  return companies
}

// Derive interview signals from the flows we actually hold.
// count = number of authored flow records (NOT s.count, which was fabricated).
// hasUserReports stays false until real /report submissions are processed via
// `npm run reports:to-flows` and manually promoted into interview-flows.json.
function readFlowSignals() {
  if (!existsSync(FLOWS)) return {}
  let flows
  try { flows = JSON.parse(readFileSync(FLOWS, 'utf8')) } catch { return {} }
  const byCompany = {}
  for (const f of flows) {
    const k = f.companySlug
    const s = f.source ?? {}
    const cur = byCompany[k] ?? { count: 0, hasUserReports: false, lastUpdated: '' }
    cur.count += 1
    if ((s.lastUpdated ?? '') > cur.lastUpdated) cur.lastUpdated = s.lastUpdated
    byCompany[k] = cur
  }
  return byCompany
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('scrape-companies.mjs')) {
  run().catch((e) => { console.error(e); process.exit(1) })
}
