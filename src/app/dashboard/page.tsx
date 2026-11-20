'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Target, CalendarDays, CheckSquare, Square, PlusCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import TargetPanel, { FALLBACK_STAGES } from '@/components/target-panel'
import BackButton from '@/components/back-button'
import NextStepPanel from '@/components/next-step-panel'
import { useTargets } from '@/lib/use-targets'
import { getInterviewFlow, getCompanyBySlug } from '@/lib/mock-data'
import type { InterviewStage } from '@/lib/types'
import { APPLICATION_STATUSES, STATUS_LABELS, statusOf, type ApplicationStatus } from '@/lib/application-status'
import { cn } from '@/lib/utils'

const RESOURCE_MAP: { match: RegExp; title: string; url: string }[] = [
  { match: /leetcode|演算法|資料結構|coding|live coding|複雜度|hackerrank|dp|graph|tree|array/i, title: 'LeetCode', url: 'https://leetcode.com' },
  { match: /system design|系統設計|架構|分散式|可擴展|微服務|高並發|api 設計|資料庫/i, title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' },
  { match: /star|行為|團隊|衝突|文化|職涯|合作|領導/i, title: 'Tech Interview Handbook', url: 'https://www.techinterviewhandbook.org/behavioral-interview/' },
  { match: /sql|window function|cte|etl|pandas|資料處理|spark|airflow/i, title: 'SQL 50 Study Plan', url: 'https://leetcode.com/studyplan/top-sql-50/' },
  { match: /英文|english/i, title: 'English Interview Prep', url: 'https://www.techinterviewhandbook.org/' },
  { match: /自我介紹|履歷|薪資|offer|談判|產品線|業務/i, title: '面試準備指南', url: 'https://www.techinterviewhandbook.org/' },
]

function pickResource(stage: InterviewStage, tip: string) {
  const haystack = `${tip} ${stage.nameZh} ${stage.questionTypes.join(' ')}`
  return RESOURCE_MAP.find(r => r.match.test(haystack)) ?? { title: '準備資源', url: 'https://www.techinterviewhandbook.org/' }
}

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日']
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

export default function DashboardPage() {
  const { targets, removeTarget, toggleStage, setDate, setStageDate, setStageNote, setStatus, isTaskDone, toggleTaskDone } = useTargets()
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const visibleTargets = statusFilter === 'all' ? targets : targets.filter(t => statusOf(t) === statusFilter)
  const statusCounts = targets.reduce<Partial<Record<ApplicationStatus, number>>>((acc, t) => {
    const s = statusOf(t)
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const filterChips: { key: ApplicationStatus | 'all'; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: targets.length },
    ...APPLICATION_STATUSES.map(s => ({ key: s, label: STATUS_LABELS[s], count: statusCounts[s] ?? 0 })),
  ]

  // Derive today's tasks from each target's NEXT incomplete interview stage
  const tasks = targets.flatMap(t => {
    const flow = getInterviewFlow(t.companySlug, t.roleSlug)
    if (!flow) return []
    const nextIdx = t.stageCompletions.findIndex(c => !c)
    if (nextIdx === -1) return [] // all stages cleared
    const stage = flow.stages[nextIdx]
    if (!stage) return []
    const companyName = getCompanyBySlug(t.companySlug)?.name ?? t.companySlug
    return stage.prepTips.map((tip, ti) => ({
      key: `${t.companySlug}-${t.roleSlug}-${stage.order}-${ti}`,
      company: companyName,
      stage: stage.nameZh,
      label: tip,
      resource: pickResource(stage, tip),
    }))
  })


  // Calendar state — default to current month
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const todayDate = now.getDate()
  const isCurrentMonthView = calYear === now.getFullYear() && calMonth === now.getMonth()
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay()
  const firstDayMondayFirst = (firstDayOfMonth + 6) % 7
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  // Collect events for the displayed month
  type CalEvent = { type: 'interview' | 'next' | 'stage'; label: string }
  const CAL_DOT: Record<CalEvent['type'], string> = { interview: 'bg-orange-400', next: 'bg-sky-400', stage: 'bg-violet-400' }
  const calEvents: Record<number, CalEvent[]> = {}
  targets.forEach(t => {
    const addEvent = (dateStr: string | null | undefined, type: CalEvent['type'], label: string) => {
      if (!dateStr) return
      const [y, m, d] = dateStr.split('-').map(Number)
      if (y !== calYear || m - 1 !== calMonth) return
      calEvents[d] = [...(calEvents[d] ?? []), { type, label }]
    }
    const cName = getCompanyBySlug(t.companySlug)?.name ?? t.companySlug
    addEvent(t.interviewDate, 'interview', `${cName} 面試`)
    addEvent(t.nextRoundDate, 'next', `${cName} 下一關`)
    const stages = getInterviewFlow(t.companySlug, t.roleSlug)?.stages
    t.stageDates?.forEach((d, i) =>
      addEvent(d, 'stage', `${cName} ${stages?.[i]?.nameZh ?? FALLBACK_STAGES[i] ?? `關卡 ${i + 1}`}`))
  })

  const tasksDone = tasks.filter(t => isTaskDone(t.key)).length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <BackButton />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">準備進度</h1>
          <p className="text-slate-500 mt-1">
            {targets.length > 0
              ? `追蹤中：${targets.length} 個目標職缺`
              : '新增目標公司和職缺來開始追蹤'}
          </p>
        </div>
        <Link href="/companies"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-indigo-300 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors">
          <PlusCircle className="w-4 h-4" /> 新增目標
        </Link>
      </div>

      <NextStepPanel />

      {/* Target panels */}
      {targets.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
            <Target className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">尚未加入任何目標</p>
            <p className="text-sm text-slate-400 mt-1">
              前往公司或職缺頁面，點擊「加入目標」即可開始追蹤準備進度
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-1">
            <Link href="/companies"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              <PlusCircle className="w-4 h-4" /> 選擇目標公司
            </Link>
            <Link href="/roles"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              <PlusCircle className="w-4 h-4" /> 選擇目標職缺
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filterChips.map(c => (
              <button
                key={c.key}
                onClick={() => setStatusFilter(c.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors',
                  statusFilter === c.key
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600',
                )}
              >
                {c.label}
                <span className={cn('tabular-nums', statusFilter === c.key ? 'text-indigo-100' : 'text-slate-400')}>{c.count}</span>
              </button>
            ))}
          </div>
          {visibleTargets.length === 0 ? (
            <p className="text-sm text-slate-400">沒有符合此狀態的目標</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTargets.map(entry => (
                <TargetPanel
                  key={`${entry.companySlug}-${entry.roleSlug}`}
                  entry={entry}
                  onToggleStage={i => toggleStage(entry.companySlug, entry.roleSlug, i)}
                  onSetDate={(field, date) => setDate(entry.companySlug, entry.roleSlug, field, date)}
                  onSetStageDate={(i, date) => setStageDate(entry.companySlug, entry.roleSlug, i, date)}
                  onSetStageNote={(i, note) => setStageNote(entry.companySlug, entry.roleSlug, i, note)}
                  onSetStatus={status => setStatus(entry.companySlug, entry.roleSlug, status)}
                  onRemove={() => removeTarget(entry.companySlug, entry.roleSlug)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lower section: calendar + tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Monthly calendar */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {calYear} 年 {MONTH_NAMES[calMonth]}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {!isCurrentMonthView && (
                <button onClick={() => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()) }}
                  className="text-xs text-indigo-600 hover:underline px-1">今月</button>
              )}
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center select-none">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-xs font-medium text-slate-400 pb-1">{d}</div>
            ))}
            {Array.from({ length: firstDayMondayFirst }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
              const isToday = isCurrentMonthView && d === todayDate
              const events = calEvents[d] ?? []
              return (
                <div key={d}
                  className={`rounded-lg py-1.5 text-sm leading-none flex flex-col items-center gap-0.5 ${
                    isToday ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                  <span>{d}</span>
                  {isToday && <span className="text-[10px] text-indigo-200 leading-none">今日</span>}
                  {events.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-0.5">
                      {events.map((e, i) => (
                        <span key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isToday ? 'bg-white/70' :
                            CAL_DOT[e.type]
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          {(Object.keys(calEvents).length > 0 || targets.length > 0) && (
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" /> 面試日期
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> 預計下一關
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400" /> 關卡日期
              </span>
            </div>
          )}

          {/* Upcoming events list */}
          {Object.keys(calEvents).length > 0 && (
            <div className="space-y-1 pt-1">
              {Object.entries(calEvents)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, events]) =>
                  events.map((e, i) => (
                    <div key={`${day}-${i}`} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CAL_DOT[e.type]}`} />
                      <span className="text-slate-400">{calMonth + 1}/{day}</span>
                      <span>{e.label}</span>
                    </div>
                  ))
                )}
            </div>
          )}
        </div>

        {/* Today's tasks — derived from each target's next interview stage */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />今日任務
          </h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400">
              {targets.length === 0
                ? '加入目標後，這裡會依各公司的下一個面試關卡產生準備任務。'
                : '目標的面試關卡都已完成，沒有待辦任務 🎉'}
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
                  const k = `${t.company} · ${t.stage}`
                  ;(acc[k] ??= []).push(t)
                  return acc
                }, {})
              ).map(([group, groupTasks]) => (
                <div key={group} className="space-y-2">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{group}</p>
                  {groupTasks.map(t => {
                    const done = isTaskDone(t.key)
                    return (
                      <div key={t.key}>
                        <button onClick={() => toggleTaskDone(t.key)} className="w-full flex items-start gap-2.5 text-left group">
                          {done
                            ? <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                            : <Square className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />}
                          <span className={`text-sm ${done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.label}</span>
                        </button>
                        <a href={t.resource.url} target="_blank" rel="noopener noreferrer"
                          className="ml-6 mt-0.5 inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                          <ExternalLink className="w-3 h-3" />{t.resource.title}
                        </a>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
          {tasks.length > 0 && (
            <div className="text-xs text-slate-400 pt-1">{tasksDone}/{tasks.length} 完成</div>
          )}
        </div>
      </div>
    </div>
  )
}
