'use client'
import Link from 'next/link'
import { ArrowRight, Target } from 'lucide-react'
import { useTargets } from '@/lib/use-targets'

export default function ContinuePrepBanner() {
  const { targets } = useTargets()
  if (targets.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <Link href="/dashboard"
        className="flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 hover:bg-indigo-100/70 transition-colors group">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">繼續你的準備進度</p>
            <p className="text-xs text-slate-500 mt-0.5">追蹤中：{targets.length} 個目標職缺</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 whitespace-nowrap group-hover:gap-2.5 transition-all">
          前往準備進度 <ArrowRight className="w-4 h-4" />
        </span>
      </Link>
    </section>
  )
}
