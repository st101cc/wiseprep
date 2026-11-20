// node --experimental-strip-types src/lib/week-prep.check.ts
import assert from 'node:assert/strict'
import { buildWeekPrep } from './week-prep.ts'
import { FALLBACK_STAGES } from './fallback-stages.ts'

const stage = (order: number, n: string) => ({ order, nameZh: n, questionTypes: ['案例'], prepTips: [`${n} tip a`, `${n} tip b`] })
const lookup = (c: string) => c.startsWith('custom-') ? null
  : { companyName: c.toUpperCase(), roleName: 'SWE', stages: [stage(1, '線上測驗'), stage(2, 'HR'), stage(3, '技術')] }
const today = '2026-11-20'
const base = { roleSlug: 'swe', stageCompletions: [true, false, false] }

const { thisWeek, later } = buildWeekPrep([
  { ...base, companySlug: 'undated' },
  { ...base, companySlug: 'far', stageDates: [null, '2026-11-27'] },             // today+7 -> later
  { ...base, companySlug: 'edge', interviewDate: '2026-11-26' },                 // today+6 -> this week
  { ...base, companySlug: 'soon', nextRoundDate: '2026-11-22', interviewDate: '2026-11-19' }, // past date ignored
  { ...base, companySlug: 'today', stageDates: ['2026-11-20', '2026-11-30', '2026-11-20'] },  // completed stage 0 ignored, stage 2 counts
  { ...base, companySlug: 'offer', status: 'offer', interviewDate: '2026-11-21' },
  { ...base, companySlug: 'rej', status: 'rejected' },
  { ...base, companySlug: 'wd', status: 'withdrawn' },
  { ...base, companySlug: 'done', stageCompletions: [true, true, true], interviewDate: '2026-11-21' },
  { ...base, companySlug: 'iv', status: 'interviewing', nextRoundDate: '2026-12-01' },
], today, lookup)

assert.deepEqual(thisWeek.map(g => [g.key, g.date]), [
  ['today-swe', '2026-11-20'], ['soon-swe', '2026-11-22'], ['edge-swe', '2026-11-26'],
])
assert.deepEqual(later.map(g => [g.key, g.date]), [
  ['far-swe', '2026-11-27'], ['iv-swe', '2026-12-01'], ['undated-swe', null],
], 'offer/rejected/withdrawn and fully-cleared targets dropped; undated last')

// header + tasks: next open stage, task keys unchanged from the old 今日任務 panel
const g = thisWeek[0]
assert.equal(g.company, 'TODAY'); assert.equal(g.role, 'SWE'); assert.equal(g.stageName, 'HR')
assert.deepEqual(g.tasks, [
  { key: 'today-swe-2-0', label: 'HR tip a' }, { key: 'today-swe-2-1', label: 'HR tip b' },
])

// custom target: no flow -> fallback stage name, no tasks, its own names
const [c] = buildWeekPrep([{
  companySlug: 'custom-x', roleSlug: 'custom-x', companyName: '某新創', roleName: '後端',
  stageCompletions: [true, false, false, false, false], nextRoundDate: '2026-11-21',
}], today, lookup, FALLBACK_STAGES).thisWeek
assert.deepEqual([c.company, c.role, c.stageName, c.stage, c.tasks], ['某新創', '後端', '線上程式測驗', null, []])

console.log('week-prep.check: ok')
