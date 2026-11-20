'use client'
import { useState, useEffect } from 'react'
import { getInterviewFlow } from './mock-data'
import { saveLocal } from './cloud-state'
import { formatAddedDate } from './added-date'
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
  addedAt: string
  status?: ApplicationStatus  // missing on older entries -> treated as 'wishlist'
  statusChangedAt?: string    // 'YYYY-MM-DD' local date of the last status change
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

  const removeTarget = (companySlug: string, roleSlug: string) =>
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

  const setStatus = (companySlug: string, roleSlug: string, status: ApplicationStatus) =>
    persist(targets.map(t =>
      t.companySlug === companySlug && t.roleSlug === roleSlug
        ? { ...t, status, statusChangedAt: formatAddedDate(new Date().toISOString()) ?? undefined }
        : t
    ))

  return { targets, isTarget, addTarget, removeTarget, toggleStage, setDate, setStatus, isTaskDone, toggleTaskDone }
}
