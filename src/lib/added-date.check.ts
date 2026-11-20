// node --experimental-strip-types src/lib/added-date.check.ts
import assert from 'node:assert/strict'
import { formatAddedDate } from './added-date.ts'

// Local date, not UTC: 23:30 local on 2026-11-20 stays 2026-11-20 whatever the TZ.
assert.equal(formatAddedDate(new Date(2026, 10, 20, 23, 30).toISOString()), '2026-11-20')
assert.equal(formatAddedDate(new Date(2026, 0, 5, 0, 15).toISOString()), '2026-01-05', 'zero-padded')

// Missing / empty / invalid -> hidden.
assert.equal(formatAddedDate(undefined), null)
assert.equal(formatAddedDate(''), null)
assert.equal(formatAddedDate('not a date'), null)

console.log('added-date ok')
