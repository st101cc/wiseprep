'use client'

import { useTargets } from '@/lib/use-targets'
import { Target, Check } from 'lucide-react'

interface Props { companySlug: string; roleSlug: string }

export default function SetTargetButton({ companySlug, roleSlug }: Props) {
  const { isTarget, addTarget, removeTarget } = useTargets()
  const active = isTarget(companySlug, roleSlug)

  return (
    <button
      onClick={() => active ? removeTarget(companySlug, roleSlug) : addTarget(companySlug, roleSlug)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
      }`}
    >
      {active ? <Check className="w-4 h-4" /> : <Target className="w-4 h-4" />}
      {active ? '已加入目標' : '加入目標'}
    </button>
  )
}
