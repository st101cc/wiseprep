// Pure: groups tracked targets into the dashboard 本週準備 panel.
// No imports, so week-prep.check.ts runs under plain node; flow data comes in through `lookup`.

export interface WeekTargetLike {
  companySlug: string
  roleSlug: string
  status?: string
  companyName?: string
  roleName?: string
  stageCompletions: boolean[]
  interviewDate?: string
  nextRoundDate?: string
  stageDates?: (string | null | undefined)[]
}

export interface WeekStageLike {
  order: number
  nameZh: string
  questionTypes: string[]
  prepTips: string[]
}

export interface PrepTask { key: string; label: string }

export interface PrepGroup<S extends WeekStageLike = WeekStageLike> {
  key: string
  company: string
  role: string
  stageName: string
  stage: S | null        // null when the target has no flow (custom): no built-in checklist
  date: string | null    // next dated round, YYYY-MM-DD
  tasks: PrepTask[]
}

const CLOSED = ['offer', 'rejected', 'withdrawn']

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** `today` is a local YYYY-MM-DD. thisWeek = next round within today..today+6; later = the rest (dated ascending, then undated). */
export function buildWeekPrep<S extends WeekStageLike>(
  targets: WeekTargetLike[],
  today: string,
  lookup: (companySlug: string, roleSlug: string) => { companyName: string; roleName: string; stages: S[] } | null,
  fallbackStages: string[] = [],
): { thisWeek: PrepGroup<S>[]; later: PrepGroup<S>[] } {
  const groups: PrepGroup<S>[] = []
  for (const t of targets) {
    if (t.status && CLOSED.includes(t.status)) continue
    const info = lookup(t.companySlug, t.roleSlug)
    const stages = info?.stages ?? []
    const count = stages.length || t.stageCompletions.length || fallbackStages.length
    const next = Array.from({ length: count }, (_, i) => i).find(i => !t.stageCompletions[i])
    if (next === undefined) continue

    const candidates = [
      ...(t.stageDates ?? []).filter((_, i) => i < count && !t.stageCompletions[i]),
      t.interviewDate,
      t.nextRoundDate,
    ].filter((d): d is string => !!d && d >= today).sort()

    const stage = stages[next] ?? null
    groups.push({
      key: `${t.companySlug}-${t.roleSlug}`,
      company: t.companyName ?? info?.companyName ?? t.companySlug,
      role: t.roleName ?? info?.roleName ?? t.roleSlug,
      stageName: stage?.nameZh ?? fallbackStages[next] ?? `關卡 ${next + 1}`,
      stage,
      date: candidates[0] ?? null,
      tasks: stage
        ? stage.prepTips.map((tip, i) => ({ key: `${t.companySlug}-${t.roleSlug}-${stage.order}-${i}`, label: tip }))
        : [],
    })
  }
  groups.sort((a, b) => (a.date ?? '￿').localeCompare(b.date ?? '￿'))
  const weekEnd = addDays(today, 6)
  return {
    thisWeek: groups.filter(g => g.date !== null && g.date <= weekEnd),
    later: groups.filter(g => g.date === null || g.date > weekEnd),
  }
}
