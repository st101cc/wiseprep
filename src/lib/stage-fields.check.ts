import assert from 'node:assert/strict'
import { setAligned, nextStageDate, localDateString } from './stage-fields.ts'

// Padding: missing array is padded to stage count
assert.deepEqual(setAligned(undefined, 2, '2026-12-01', 5), [null, null, '2026-12-01', null, null])
// Clearing stores null, other entries kept
assert.deepEqual(setAligned(['2026-12-01', 'x'], 1, '', 3), ['2026-12-01', null, null])
// Never shrinks; grows to index if beyond count
assert.deepEqual(setAligned(['a', 'b', 'c'], 0, 'z', 2), ['z', 'b', 'c'])
assert.deepEqual(setAligned([], 3, 'n', 2), [null, null, null, 'n'])
// Does not mutate input
const src = ['a']
setAligned(src, 0, 'b', 1)
assert.deepEqual(src, ['a'])

// nextStageDate: earliest upcoming, skipping past, empty and completed stages
const today = '2026-11-20'
assert.deepEqual(
  nextStageDate(['2026-11-01', null, '2026-12-05', '2026-11-25', '2026-11-21'], [false, false, false, false, true], today),
  { index: 3, date: '2026-11-25' },
)
assert.deepEqual(nextStageDate(['2026-11-20'], [false], today), { index: 0, date: '2026-11-20' })
assert.equal(nextStageDate(undefined, [], today), null)
assert.equal(nextStageDate(['2026-11-19'], [false], today), null)

assert.equal(localDateString(new Date(2026, 0, 5)), '2026-01-05')

console.log('stage-fields.check: ok')
