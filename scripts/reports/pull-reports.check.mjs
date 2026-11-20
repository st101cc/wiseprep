// node scripts/reports/pull-reports.check.mjs
import assert from 'node:assert/strict'
import { sanitize, mergeReports } from './pull-reports.mjs'

const cs = new Set(['bcg-x-taiwan']), rs = new Set(['forward-deployed-ai-engineer'])
const row = (o = {}) => ({
  id: 'a1', company_slug: 'bcg-x-taiwan', role_slug: 'forward-deployed-ai-engineer', level: 'Mid', interview_month: '2026-10',
  stages: [{ name: 'HR 面試', duration: '30 分鐘', difficulty: '2' }], offer: 'Pending', remote: false, tips: 'ok', submitted_at: '2026-11-01T00:00:00+00:00', ...o,
})

const r = sanitize(row(), cs, rs)
assert.equal(r.companySlug, 'bcg-x-taiwan')
assert.equal(r.stages[0].name, 'HR 面試')

// malformed rows are rejected
assert.equal(sanitize(row({ company_slug: 'nope' }), cs, rs), null)
assert.equal(sanitize(row({ level: 'CEO' }), cs, rs), null)
assert.equal(sanitize(row({ interview_month: '2026-13' }), cs, rs), null)
assert.equal(sanitize(row({ stages: [] }), cs, rs), null)
assert.equal(sanitize(row({ stages: 'x' }), cs, rs), null)
assert.equal(sanitize(null, cs, rs), null)

// free text is capped, control characters removed, bad difficulty defaulted
const long = sanitize(row({ tips: 'x'.repeat(2000) + '\u0000', stages: [{ name: 'a\nb', difficulty: '99' }] }), cs, rs)
assert.equal(long.tips.length, 500)
assert.equal(long.stages[0].name, 'a b')
assert.equal(long.stages[0].difficulty, '3')
assert.equal(sanitize(row({ stages: Array.from({ length: 30 }, (_, i) => ({ name: 's' + i })) }), cs, rs).stages.length, 12)

// same content from a different row counts once; same id is ignored
const a = sanitize(row({ id: 'a1' }), cs, rs), b = sanitize(row({ id: 'b2' }), cs, rs)
const c = sanitize(row({ id: 'c3', level: 'Senior' }), cs, rs)
const m1 = mergeReports([], [a, b, c])
assert.equal(m1.added.length, 2)
assert.equal(m1.duplicates, 1)
const m2 = mergeReports(m1.all, [a, sanitize(row({ id: 'd4' }), cs, rs)])
assert.equal(m2.added.length, 0)
assert.equal(m2.all.length, 2)
console.log('pull-reports: ok')
