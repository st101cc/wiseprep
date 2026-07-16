'use client'

import { useState, useEffect } from 'react'
import { getCompanyBySlug, getRoleBySlug, getInterviewFlow } from './mock-data'

interface Target {
  companySlug: string
  roleSlug: string
}

const KEY = 'wiseprep_target'

export function useTarget() {
  const [target, setTargetState] = useState<Target | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setTargetState(JSON.parse(stored))
    } catch {}
  }, [])

  const setTarget = (companySlug: string, roleSlug: string) => {
    const t = { companySlug, roleSlug }
    setTargetState(t)
    localStorage.setItem(KEY, JSON.stringify(t))
  }

  const clearTarget = () => {
    setTargetState(null)
    localStorage.removeItem(KEY)
  }

  const company = target ? getCompanyBySlug(target.companySlug) : null
  const role = target ? getRoleBySlug(target.roleSlug) : null
  const flow = target ? getInterviewFlow(target.companySlug, target.roleSlug) ?? null : null

  return { target, setTarget, clearTarget, company, role, flow }
}
