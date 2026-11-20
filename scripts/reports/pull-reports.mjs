// Runs on the Paperclip box (cron, daily). Pulls new anonymous interview reports from
// Supabase through the token-gated `reports_feed` function, validates them, stores them per
// company x role, and opens a "Merge reports" issue for the curator agent.
//
// The reports are anonymous and unverifiable: this script only checks that they are
// well-formed. How much to trust them is the curator's job (see its INSTRUCTIONS.md).
//
//   node pull-reports.mjs            # normal run (needs config.json next to it + ~/.wiseprep/reports.token)
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const LEVELS = ['Intern', 'New Grad', 'Junior', 'Mid', 'Senior', 'Manager']
const OFFERS = ['是', '否', 'Pending']
const PAGE = 500 // must match the limit in reports_feed
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max)

/** Returns a normalised report, or null if the row is malformed. Free text is length-capped, never trusted. */
export function sanitize(row, companySlugs, roleSlugs) {
  if (!row || !companySlugs.has(row.company_slug) || !roleSlugs.has(row.role_slug)) return null
  if (!LEVELS.includes(row.level)) return null
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(row.interview_month ?? '')) return null
  const stages = (Array.isArray(row.stages) ? row.stages : []).slice(0, 12)
    .map(s => ({
      name: clean(s?.name, 80),
      duration: clean(s?.duration, 40),
      difficulty: ['1', '2', '3', '4', '5'].includes(String(s?.difficulty)) ? String(s.difficulty) : '3',
    }))
    .filter(s => s.name)
  if (!stages.length) return null
  return {
    id: String(row.id), companySlug: row.company_slug, roleSlug: row.role_slug, submittedAt: row.submitted_at,
    level: row.level, month: row.interview_month, stages,
    offer: OFFERS.includes(row.offer) ? row.offer : null, remote: row.remote === true, tips: clean(row.tips, 500),
  }
}

// Same content from different rows counts once: cheap protection against one person (or a script) inflating counts.
export const fingerprint = r => createHash('sha1').update(JSON.stringify([r.level, r.month, r.stages, r.offer, r.remote])).digest('hex')

export function mergeReports(existing, incoming) {
  const ids = new Set(existing.map(r => r.id))
  const fps = new Set(existing.map(fingerprint))
  const added = []
  let duplicates = 0
  for (const r of incoming) {
    if (ids.has(r.id)) continue
    const fp = fingerprint(r)
    if (fps.has(fp)) { duplicates++; continue }
    ids.add(r.id); fps.add(fp); added.push(r)
  }
  return { all: [...existing, ...added], added, duplicates }
}

const writeJson = (path, data) => { writeFileSync(path + '.tmp', JSON.stringify(data, null, 2)); renameSync(path + '.tmp', path) }

async function paperclip(cfg, path, init) {
  const res = await fetch(`${cfg.paperclipUrl}/api${path}`, { ...init, headers: { 'Content-Type': 'application/json' } })
  if (!res.ok) throw new Error(`paperclip ${path} ${res.status}`)
  return res.json()
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url))
  const cfg = JSON.parse(readFileSync(join(here, 'config.json'), 'utf8'))
  const token = readFileSync(join(homedir(), '.wiseprep', 'reports.token'), 'utf8').trim()
  const dir = join(cfg.dataDir, 'reports')
  mkdirSync(dir, { recursive: true })
  const statePath = join(dir, '.state.json')
  const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { since: '1970-01-01T00:00:00Z', notified: {} }
  const slugs = f => new Set(JSON.parse(readFileSync(join(cfg.dataDir, f), 'utf8')).map(x => x.slug))
  const companySlugs = slugs('companies.json'), roleSlugs = slugs('roles.json')

  // ponytail: paging by submitted_at; two rows with the exact same timestamp across a page boundary could be skipped.
  let since = state.since, fetched = [], rows = []
  do {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/reports_feed`, {
      method: 'POST',
      headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: token, p_since: since }),
    })
    if (!res.ok) throw new Error(`reports_feed ${res.status}: ${(await res.text()).slice(0, 200)}`)
    fetched = await res.json()
    rows.push(...fetched)
    if (fetched.length) since = fetched[fetched.length - 1].submitted_at
  } while (fetched.length >= PAGE)

  const byPair = new Map()
  let rejected = 0
  for (const row of rows) {
    const r = sanitize(row, companySlugs, roleSlugs)
    if (!r) { rejected++; continue }
    const k = `${r.companySlug}--${r.roleSlug}`
    byPair.set(k, [...(byPair.get(k) ?? []), r])
  }

  let duplicates = 0
  const totals = {}
  for (const [pair, incoming] of byPair) {
    const file = join(dir, `${pair}.json`)
    const merged = mergeReports(existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [], incoming)
    duplicates += merged.duplicates
    if (merged.added.length) writeJson(file, merged.all)
  }
  // Only advance after every file is written, so a crash re-pulls instead of losing reports.
  state.since = since
  writeJson(statePath, state)

  // Open a curator issue for every pair that has reports the curator has not been told about.
  const issues = await paperclip(cfg, `/companies/${cfg.companyId}/issues`)
  const list = Array.isArray(issues) ? issues : issues.issues
  const opened = []
  for (const [pair] of byPair) {
    const file = join(dir, `${pair}.json`)
    const total = JSON.parse(readFileSync(file, 'utf8')).length
    totals[pair] = total
    const title = `Merge reports ${pair}`
    const open = list.some(i => i.title === title && !['done', 'cancelled'].includes(i.status))
    if (open || total <= (state.notified[pair] ?? 0)) continue
    await paperclip(cfg, `/companies/${cfg.companyId}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title, status: 'todo', assigneeAgentId: cfg.curatorId, projectId: cfg.projectId,
        description: `${total} anonymous reports in ${join(dir, pair + '.json')} (${state.notified[pair] ?? 0} already handled). They are unverified: follow "Merging user reports" in your instructions, including the reliability rules.`,
      }),
    })
    state.notified[pair] = total
    opened.push(pair)
  }
  writeJson(statePath, state)
  console.log(`${new Date().toISOString()} fetched=${rows.length} rejected=${rejected} duplicates=${duplicates} issues=${opened.join(',') || '-'}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error(`${new Date().toISOString()} ERROR ${e.message}`); process.exit(1) })
}
