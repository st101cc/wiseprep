// node --experimental-strip-types src/lib/application-status.check.ts
import assert from 'node:assert/strict'
import { statusOf, formatStatusDate, APPLICATION_STATUSES, STATUS_LABELS } from './application-status.ts'

// Old entries (no status) and unknown values fall back to wishlist.
assert.equal(statusOf({}), 'wishlist')
assert.equal(statusOf({ status: 'bogus' }), 'wishlist')
assert.equal(statusOf({ status: 'toString' }), 'wishlist', 'prototype keys are not statuses')
assert.equal(statusOf({ status: 'offer' }), 'offer')

assert.equal(APPLICATION_STATUSES.length, 7)
assert.equal(STATUS_LABELS.withdrawn, '已撤回')

assert.equal(formatStatusDate('2026-11-20'), '11/20')
assert.equal(formatStatusDate('2026-01-05'), '1/5', 'no zero padding')
assert.equal(formatStatusDate(undefined), null)
assert.equal(formatStatusDate(''), null)
assert.equal(formatStatusDate('2026-1-5'), null)

console.log('application-status ok')
