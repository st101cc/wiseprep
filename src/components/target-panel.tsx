'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Building2, X, ArrowRight, CalendarDays, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { CheckCircle2, Circle } from 'lucide-react'
import { getCompanyBySlug, getRoleBySlug, getInterviewFlow } from '@/lib/mock-data'
import type { TargetEntry } from '@/lib/use-targets'
import { formatAddedDate } from '@/lib/added-date'
import { APPLICATION_STATUSES, STATUS_LABELS, statusOf, formatStatusDate, type ApplicationStatus } from '@/lib/application-status'
import { nextStageDate, localDateString } from '@/lib/stage-fields'
import { FALLBACK_STAGES } from '@/lib/fallback-stages'
import { cn } from '@/lib/utils'

interface Props {
  entry: TargetEntry
  onToggleStage: (i: number) => void
  onSetDate: (field: 'interviewDate' | 'nextRoundDate', date: string) => void
  onSetStageDate: (i: number, date: string) => void
  onSetStageNote: (i: number, note: string) => void
  onSetStatus: (status: ApplicationStatus) => void
  onRemove: () => void
}

function daysFrom(dateStr?: string): number | null {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

function DaysChip({ days }: { days: number }) {
  const cls =
    days < 0 ? 'bg-slate-100 text-slate-500' :
    days === 0 ? 'bg-orange-100 text-orange-600' :
    days <= 3 ? 'bg-red-100 text-red-600' :
    days <= 7 ? 'bg-amber-100 text-amber-600' :
    'bg-emerald-100 text-emerald-600'
  const label = days < 0 ? `${Math.abs(days)} 天前` : days === 0 ? '今日' : `${days} 天後`
  return <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
}

export default function TargetPanel({ entry, onToggleStage, onSetDate, onSetStageDate, onSetStageNote, onSetStatus, onRemove }: Props) {
  const [showStages, setShowStages] = useState(false)

  const company = getCompanyBySlug(entry.companySlug)
  const role = getRoleBySlug(entry.roleSlug)
  const flow = getInterviewFlow(entry.companySlug, entry.roleSlug)
  const stageNames = flow?.stages.map(s => s.nameZh) ?? FALLBACK_STAGES

  const done = entry.stageCompletions.filter(Boolean).length
  const total = stageNames.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const intDays = daysFrom(entry.interviewDate)
  const nxtDays = daysFrom(entry.nextRoundDate)
  const addedDate = formatAddedDate(entry.addedAt)
  const statusDate = formatStatusDate(entry.statusChangedAt)
  const nextStage = nextStageDate(entry.stageDates, entry.stageCompletions, localDateString())

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{entry.companyName ?? company?.name ?? entry.companySlug}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{entry.roleName ?? role?.titleZh ?? entry.roleSlug}</p>
            {addedDate && <p className="text-xs text-slate-400 mt-0.5">加入於 {addedDate}</p>}
          </div>
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          <div className="flex flex-col items-end gap-0.5">
            <select
              aria-label="申請狀態"
              value={statusOf(entry)}
              onChange={e => onSetStatus(e.target.value as ApplicationStatus)}
              className="border border-slate-200 rounded-md px-1.5 py-1 text-xs text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {APPLICATION_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            {statusDate && <span className="text-[11px] text-slate-400">狀態更新於 {statusDate}</span>}
          </div>
          <button onClick={onRemove} className="text-slate-300 hover:text-red-400 transition-colors mt-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stage progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setShowStages(v => !v)}
            className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
          >
            {done}/{total} 關卡完成
            {showStages ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <span className="font-semibold text-indigo-600">{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        {!showStages && nextStage && (
          <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
            <span className="text-slate-500 truncate">下個關卡：{stageNames[nextStage.index] ?? `關卡 ${nextStage.index + 1}`}</span>
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-slate-400">{nextStage.date}</span>
              <DaysChip days={daysFrom(nextStage.date) ?? 0} />
            </span>
          </div>
        )}
        {showStages && (
          <div className="pt-1 space-y-1">
            {stageNames.map((name, i) => (
              <div key={i}
                className={cn(
                  'rounded-lg border px-2.5 py-2 space-y-1.5 transition-colors',
                  entry.stageCompletions[i]
                    ? 'bg-indigo-50 border-indigo-100'
                    : 'bg-slate-50 border-slate-100',
                )}>
                <button onClick={() => onToggleStage(i)}
                  className={cn(
                    'w-full flex items-center gap-2.5 text-left text-sm transition-colors',
                    entry.stageCompletions[i] ? 'text-indigo-700' : 'text-slate-600 hover:text-indigo-600',
                  )}>
                  {entry.stageCompletions[i]
                    ? <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    : <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                  {name}
                </button>
                <div className="flex items-center gap-1.5 pl-6">
                  <input
                    type="date"
                    aria-label={`${name} 日期`}
                    value={entry.stageDates?.[i] ?? ''}
                    onChange={e => onSetStageDate(i, e.target.value)}
                    className="border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-32 flex-shrink-0"
                  />
                  <input
                    type="text"
                    aria-label={`${name} 備註`}
                    placeholder="備註"
                    maxLength={200}
                    value={entry.stageNotes?.[i] ?? ''}
                    onChange={e => onSetStageNote(i, e.target.value)}
                    className="min-w-0 flex-1 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-slate-600 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-1.5 text-slate-500 flex-shrink-0">
            <CalendarDays className="w-3.5 h-3.5" /> 面試日期
          </span>
          <div className="flex items-center gap-1.5">
            {intDays !== null && <DaysChip days={intDays} />}
            <input
              type="date"
              value={entry.interviewDate ?? ''}
              onChange={e => onSetDate('interviewDate', e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-32"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-1.5 text-slate-500 flex-shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> 下一關預計
          </span>
          <div className="flex items-center gap-1.5">
            {nxtDays !== null && <DaysChip days={nxtDays} />}
            <input
              type="date"
              value={entry.nextRoundDate ?? ''}
              onChange={e => onSetDate('nextRoundDate', e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-32"
            />
          </div>
        </div>
      </div>

      {/* Footer links (custom targets have no company/role page) */}
      {!entry.custom && (
        <div className="flex gap-2 mt-auto pt-1">
          <Link href={`/companies/${entry.companySlug}`}
            className="flex-1 text-center text-xs py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            公司流程
          </Link>
          <Link href={`/roles/${entry.roleSlug}`}
            className="flex-1 inline-flex items-center justify-center gap-1 text-xs py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors">
            準備頁 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  )
}
