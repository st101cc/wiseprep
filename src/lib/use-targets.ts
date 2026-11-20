'use client'
import { useState, useEffect } from 'react'
import { getInterviewFlow } from './mock-data'
import { saveLocal } from './cloud-state'
import { formatAddedDate } from './added-date'
import { setAligned } from './stage-fields'
import { FALLBACK_STAGES } from './fallback-stages'
import type { ApplicationStatus } from './application-status'

export type { ApplicationStatus } from './application-status'
export { STATUS_LABELS } from './application-status'

export interface TargetEntry {
  companySlug: string
  roleSlug: string
  stageCompletions: boolean[]
  interviewDate?: string   // 'YYYY-MM-DD'
  nextRoundDate?: string   // 'YYYY-MM-DD'
  stageDates?: (string | null)[] // per-stage 'YYYY-MM-DD' (tracker v2); calendar sync already reads it
  stageNotes?: (string | null)[] // per-stage one-line note, aligned with stages
  addedAt: string
  status?: ApplicationStatus  // missing on older entries -> treated as 'wishlist'
  statusChangedAt?: string    // 'YYYY-MM-DD' local date of the last status change
  custom?: boolean            // user-entered company/role, not in the dataset; slugs are 'custom-<id>'
  companyName?: string        // custom targets only
  roleName?: string           // custom targets only
}

const KEY = 'wiseprep_targets' as const
const TASKS_KEY = 'wiseprep_tasks_done' as const

export function useTargets() {
  const [targets, setTargets] = useState<TargetEntry[]>([])
  const [doneTaskKeys, setDoneTaskKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setTargets(JSON.parse(stored))
      const storedTasks = localStorage.getItem(TASKS_KEY)
      if (storedTasks) setDoneTaskKeys(new Set(JSON.parse(storedTasks)))
    } catch {}
  }, [])

  const persist = (ts: TargetEntry[]) => {
    setTargets(ts)
    saveLocal(KEY, ts)
  }

  const isTaskDone = (key: string) => doneTaskKeys.has(key)

  const toggleTaskDone = (key: string) =>
    setDoneTaskKeys(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      saveLocal(TASKS_KEY, Array.from(next))
      return next
    })

  const isTarget = (companySlug: string, roleSlug: string) =>
    targets.some(t => t.companySlug === companySlug && t.roleSlug === roleSlug)

  const addTarget = (companySlug: string, roleSlug: string) => {
    if (isTarget(companySlug, roleSlug)) return
    const flow = getInterviewFlow(companySlug, roleSlug)
    persist([...targets, {
      companySlug, roleSlug,
      stageCompletions: new Array(flow?.stages.length ?? 5).fill(false),
      addedAt: new Date().toISOString(),
    }])
  }

  const addCustomTarget = (companyName: string, roleName: string) => {
    const c = companyName.trim(), r = roleName.trim()
    if (!c || !r) return
    const slug = `custom-${Math.random().toString(36).slice(2, 10)}`
    persist([...targets, {
      companySlug: slug, roleSlug: slug,
      custom: true, companyName: c, roleName: r,
      stageCompletions: new Array(FALLBACK_STAGES.length).fill(false),
      addedAt: new Date().toISOString(),
    }])
  }

  const removeTarget =(companySlug: string, roleSlug: string) =>
    persist(targets.filter(t => !(t.companySlug === companySlug && t.roleSlug === roleSlug)))

  const toggleStage = (companySlug: string, roleSlug: string, i: number) =>
    persist(targets.map(t => {
      if (t.companySlug !== companySlug || t.roleSlug !== roleSlug) return t
      const sc = [...t.stageCompletions]
      sc[i] = !sc[i]
      return { ...t, stageCompletions: sc }
    }))

  const setDate = (
    companySlug: string,
    roleSlug: string,
    field: 'interviewDate' | 'nextRoundDate',
    date: string,
  ) =>
    persist(targets.map(t =>
      t.companySlug === companySlug && t.roleSlug === roleSlug
        ? { ...t, [field]: date || undefined }
        : t
    ))

  const setStageField = (
    companySlug: string,
    roleSlug: string,
    field: 'stageDates' | 'stageNotes',
    i: number,
    value: string,
  ) =>
    persist(targets.map(t => {
      if (t.companySlug !== companySlug || t.roleSlug !== roleSlug) return t
      const count = getInterviewFlow(companySlug, roleSlug)?.stages.length ?? t.stageCompletions.length
      return { ...t, [field]: setAligned(t[field], i, value, count) }
    }))

  const setStageDate = (companySlug: string, roleSlug: string, i: number, date: string) =>
    setStageField(companySlug, roleSlug, 'stageDates', i, date)

  const setStageNote = (companySlug: string, roleSlug: string, i: number, note: string) =>
    setStageField(companySlug, roleSlug, 'stageNotes', i, note.slice(0, 200))

  const setStatus =(companySlug: string, roleSlug: string, status: ApplicationStatus) =>
    persist(targets.map(t =>
      t.companySlug === companySlug && t.roleSlug === roleSlug
        ? { ...t, status, statusChangedAt: formatAddedDate(new Date().toISOString()) ?? undefined }
        : t
    ))

  return { targets, isTarget, addTarget, addCustomTarget, removeTarget, toggleStage, setDate, setStageDate, setStageNote, setStatus, isTaskDone, toggleTaskDone }
}
