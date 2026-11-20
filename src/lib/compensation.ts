export interface CurrentComp {
  monthlyBase: number
  months: number
  bonus: number
}

export interface NegotiationNumbers {
  currentTotal: number
  walkAway: number
  target: number
  ask: number
}

const roundTo100k = (n: number) => Math.round(n / 100_000) * 100_000

// ponytail: multipliers are a rule of thumb for a senior external move, not market data.
// Replace with per-company offer data once WisePrep collects it.
export function negotiationNumbers(c: CurrentComp, band: { low: number; high: number }): NegotiationNumbers {
  const currentTotal = c.monthlyBase * c.months + c.bonus
  const walkAway = roundTo100k(Math.max(currentTotal * 1.15, band.low * 0.9))
  const target = roundTo100k(Math.max(currentTotal * 1.25, (band.low + band.high) / 2))
  const ask = roundTo100k(target * 1.1)
  return { currentTotal, walkAway, target, ask }
}

export function formatTWD(n: number): string {
  return n >= 1_000_000 ? `NT$${(n / 1_000_000).toFixed(1)}M` : `NT$${Math.round(n / 1000)}K`
}
