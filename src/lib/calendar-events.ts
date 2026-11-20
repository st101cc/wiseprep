// Pure: turns tracked targets into the Google Calendar events WisePrep wants to exist.
// Server-side only (node:crypto). Flow data comes in through `lookup` so this file
// has no JSON/alias imports and its check runs under plain node.
import { createHash } from 'node:crypto'

export interface TargetLike {
  companySlug: string
  roleSlug: string
  stageCompletions: boolean[]
  interviewDate?: string
  nextRoundDate?: string
  stageDates?: (string | null | undefined)[]
}

export interface StageLike {
  nameZh: string
  estimatedDuration: string
  questionTypes: string[]
  prepTips: string[]
}

export type Lookup = (companySlug: string, roleSlug: string) =>
  { companyName: string; stages: StageLike[] } | null

type When = { date: string } | { dateTime: string; timeZone: string }

export interface CalEvent {
  id: string
  summary: string
  description: string
  start: When
  end: When
}

const TZ = 'Asia/Taipei'
// ponytail: fixed 20:00–21:00 on the 3 evenings before a round; make it a user setting if anyone asks.
const PREP_DAYS = [3, 2, 1]
const PREP_HOUR = 20

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// sha1 hex uses only 0-9a-f, which is valid base32hex, as Google requires for event ids.
const eventId = (...parts: (string | number)[]) => createHash('sha1').update(parts.join('|')).digest('hex')

/** Upcoming rounds for one target: [date, stage index]. */
function rounds(t: TargetLike, stageCount: number): [string, number][] {
  const open = Array.from({ length: stageCount }, (_, i) => i).filter(i => !t.stageCompletions[i])
  const out = new Map<string, [string, number]>()
  const add = (date: string | null | undefined, i: number | undefined) => {
    if (date && i !== undefined) out.set(`${date}|${i}`, [date, i])
  }
  t.stageDates?.forEach((d, i) => { if (!t.stageCompletions[i]) add(d, i) })
  // Dashboard dates: interviewDate = next open stage, nextRoundDate = the one after (or the next, if alone).
  add(t.interviewDate, open[0])
  add(t.nextRoundDate, t.interviewDate ? open[1] ?? open[0] : open[0])
  return Array.from(out.values())
}

export function buildEvents(targets: TargetLike[], today: string, lookup: Lookup, origin: string): CalEvent[] {
  const events: CalEvent[] = []
  for (const t of targets) {
    const info = lookup(t.companySlug, t.roleSlug)
    const company = info?.companyName ?? t.companySlug
    const stages = info?.stages ?? []
    const stageCount = stages.length || t.stageCompletions.length
    const link = `${origin}/companies/${t.companySlug}`

    for (const [date, i] of rounds(t, stageCount)) {
      if (date < today) continue
      const s = stages[i]
      const name = s?.nameZh ?? `第 ${i + 1} 關`
      events.push({
        id: eventId(t.companySlug, t.roleSlug, 'round', date, i),
        summary: `面試：${company} – ${name}`,
        description: [s && `時間：${s.estimatedDuration}`, s && `題型：${s.questionTypes.join('、')}`, link].filter(Boolean).join('\n'),
        start: { date },
        end: { date: addDays(date, 1) },
      })
      for (const before of PREP_DAYS) {
        const day = addDays(date, -before)
        if (day < today) continue
        const hh = String(PREP_HOUR).padStart(2, '0'), hh1 = String(PREP_HOUR + 1).padStart(2, '0')
        events.push({
          id: eventId(t.companySlug, t.roleSlug, 'prep', date, `${i}-${before}`),
          summary: `準備：${name} – ${company}`,
          description: [...(s?.prepTips ?? []).map(tip => `☐ ${tip}`), '', link].join('\n'),
          start: { dateTime: `${day}T${hh}:00:00`, timeZone: TZ },
          end: { dateTime: `${day}T${hh1}:00:00`, timeZone: TZ },
        })
      }
    }
  }
  return events
}
