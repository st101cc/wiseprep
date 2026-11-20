// node --experimental-strip-types src/lib/calendar-events.check.ts
import assert from 'node:assert/strict'
import { buildEvents, addDays, type Lookup } from './calendar-events.ts'
import { FALLBACK_STAGES } from './fallback-stages.ts'

const stage = (n: string) => ({ nameZh: n, estimatedDuration: '60 分鐘', questionTypes: ['案例'], prepTips: ['tip ' + n] })
const lookup: Lookup = () => ({ companyName: 'BCG X', stages: [stage('線上測驗'), stage('HR'), stage('技術案例')] })
const today = '2026-11-20'
const t = { companySlug: 'bcg', roleSlug: 'fde', stageCompletions: [true, false, false], nextRoundDate: '2026-11-25' }

const ev = buildEvents([t], today, lookup, 'http://x')
assert.equal(ev.length, 4, '1 round + 3 prep blocks')
assert.deepEqual(ev[0].start, { date: '2026-11-25' })
assert.equal(ev[0].summary, '面試：BCG X – HR', 'completed stage 0 is skipped, next open stage named')
assert.deepEqual(ev.slice(1).map(e => 'dateTime' in e.start && e.start.dateTime.slice(0, 10)), ['2026-11-22', '2026-11-23', '2026-11-24'])
assert.ok(ev[1].description.includes('☐ tip HR'))

// ids are stable and valid base32hex (Google event id alphabet)
assert.deepEqual(buildEvents([t], today, lookup, 'http://x').map(e => e.id), ev.map(e => e.id))
assert.ok(ev.every(e => /^[a-v0-9]{5,1024}$/.test(e.id)))

// moving the date changes every id (old events get deleted by sync)
const moved = buildEvents([{ ...t, nextRoundDate: '2026-11-27' }], today, lookup, 'http://x')
assert.ok(moved.every(e => !ev.some(o => o.id === e.id)))

// past round skipped; prep blocks before today skipped
assert.equal(buildEvents([{ ...t, nextRoundDate: '2026-11-19' }], today, lookup, 'http://x').length, 0)
assert.equal(buildEvents([{ ...t, nextRoundDate: '2026-11-21' }], today, lookup, 'http://x').length, 2, 'round + prep on 11-20 only')

// interviewDate -> next open stage, nextRoundDate -> the one after
const both = buildEvents([{ ...t, interviewDate: '2026-11-25', nextRoundDate: '2026-12-02' }], today, lookup, 'http://x')
assert.deepEqual(both.filter(e => 'date' in e.start).map(e => e.summary), ['面試：BCG X – HR', '面試：BCG X – 技術案例'])

// all stages done -> nothing; per-stage dates (tracker v2) used when present
assert.equal(buildEvents([{ ...t, stageCompletions: [true, true, true] }], today, lookup, 'http://x').length, 0)
const v2 = buildEvents([{ ...t, nextRoundDate: undefined, stageDates: [null, null, '2026-12-01'] }], today, lookup, 'http://x')
assert.equal(v2[0].summary, '面試：BCG X – 技術案例')

// custom target: own companyName beats the lookup, FALLBACK_STAGES names, links to /dashboard
const noFlow: Lookup = (slug) => ({ companyName: slug, stages: [] })
const custom = { companySlug: 'custom-ab12', roleSlug: 'custom-ab12', custom: true, companyName: '小新創', stageCompletions: [true, false, false, false, false], nextRoundDate: '2026-11-25' }
const cev = buildEvents([custom], today, noFlow, 'http://x', FALLBACK_STAGES)
assert.equal(cev.length, 4)
assert.equal(cev[0].summary, `面試：小新創 – ${FALLBACK_STAGES[1]}`)
assert.equal(cev[1].summary, `準備：${FALLBACK_STAGES[1]} – 小新創`)
assert.ok(cev.every(e => e.description.endsWith('http://x/dashboard')))
assert.ok(!cev.some(e => e.description.includes('/companies/')))

assert.equal(addDays('2026-12-31', 1), '2027-01-01')
console.log('calendar-events: ok')
