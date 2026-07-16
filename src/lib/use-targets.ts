'use client'
import { useState, useEffect } from 'react'
import { getInterviewFlow } from './mock-data'

export interface TargetEntry {
  companySlug: string
  roleSlug: string
  stageCompletions: boolean[]
  interviewDate?: string   // 'YYYY-MM-DD'
  nextRoundDate?: string   // 'YYYY-MM-DD'
  addedAt: string
}

const KEY = 'wiseprep_targets'
const TASKS_KEY = 'wiseprep_tasks_done'

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
    try { localStorage.setItem(KEY, JSON.stringify(ts)) } catch {}
  }

  const isTaskDone = (key: string) => doneTaskKeys.has(key)

  const toggleTaskDone = (key: string) =>
    setDoneTaskKeys(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      try { localStorage.setItem(TASKS_KEY, JSON.stringify(Array.from(next))) } catch {}
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

  return { targets, isTarget, addTarget, removeTarget, toggleStage, setDate, isTaskDone, toggleTaskDone }
}
