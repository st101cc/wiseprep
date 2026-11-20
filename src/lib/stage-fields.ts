// Per-stage fields (stageDates / stageNotes) are arrays aligned with the interview stages.

/** Returns a copy of `arr` padded with null to at least `count` items, with index `i` set to `value || null`. */
export function setAligned(
  arr: (string | null | undefined)[] | undefined,
  i: number,
  value: string,
  count: number,
): (string | null)[] {
  const len = Math.max(count, arr?.length ?? 0, i + 1)
  const out = Array.from({ length: len }, (_, k) => arr?.[k] ?? null)
  out[i] = value || null
  return out
}

/** Earliest stage date on or after `today` (YYYY-MM-DD) among stages not yet completed. */
export function nextStageDate(
  dates: (string | null | undefined)[] | undefined,
  completions: boolean[],
  today: string,
): { index: number; date: string } | null {
  let best: { index: number; date: string } | null = null
  dates?.forEach((date, index) => {
    if (!date || completions[index] || date < today) return
    if (!best || date < best.date) best = { index, date }
  })
  return best
}

/** Local date as YYYY-MM-DD. */
export function localDateString(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
