// Run: node --experimental-strip-types src/lib/compensation.check.ts
import assert from 'node:assert/strict'
import { negotiationNumbers, formatTWD } from './compensation.ts'

const band = { low: 2_700_000, high: 3_500_000 }

// Below market: band drives the numbers.
let r = negotiationNumbers({ monthlyBase: 100_000, months: 14, bonus: 200_000 }, band)
assert.equal(r.currentTotal, 1_600_000)
assert.equal(r.walkAway, 2_400_000) // 2.7M * 0.9 = 2.43M -> 2.4M
assert.equal(r.target, 3_100_000)
assert.equal(r.ask, 3_400_000)

// Above market: current pay drives the numbers.
r = negotiationNumbers({ monthlyBase: 250_000, months: 14, bonus: 500_000 }, band)
assert.equal(r.currentTotal, 4_000_000)
assert.equal(r.walkAway, 4_600_000)
assert.equal(r.target, 5_000_000)
assert.ok(r.walkAway <= r.target && r.target <= r.ask)

assert.equal(formatTWD(2_736_627), 'NT$2.7M')
assert.equal(formatTWD(850_000), 'NT$850K')
console.log('compensation checks passed')
