import { InterviewFlow, InterviewStage } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, User, Monitor, MapPin, FileText, Phone, Video } from 'lucide-react'

const formatLabel: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  phone: { label: '電話', icon: <Phone className="w-3 h-3" />, color: 'bg-sky-100 text-sky-700' },
  video: { label: '視訊', icon: <Video className="w-3 h-3" />, color: 'bg-violet-100 text-violet-700' },
  onsite: { label: '現場', icon: <MapPin className="w-3 h-3" />, color: 'bg-orange-100 text-orange-700' },
  async: { label: '非同步', icon: <FileText className="w-3 h-3" />, color: 'bg-slate-100 text-slate-600' },
  test: { label: '測驗', icon: <Monitor className="w-3 h-3" />, color: 'bg-pink-100 text-pink-700' },
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={cn('w-2 h-2 rounded-full', i <= level ? 'bg-indigo-500' : 'bg-slate-200')} />
      ))}
    </div>
  )
}

function StageCard({ stage, isLast }: { stage: InterviewStage; isLast: boolean }) {
  const fmt = formatLabel[stage.format]
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 z-10">
          {stage.order}
        </div>
        {!isLast && <div className="w-0.5 bg-indigo-200 flex-1 mt-1 mb-1" style={{ minHeight: 24 }} />}
      </div>
      <div className={cn('flex-1 pb-6', isLast ? '' : '')}>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">{stage.nameZh}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{stage.name}</p>
            </div>
            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', fmt.color)}>
              {fmt.icon}{fmt.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{stage.estimatedDuration}</span>
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{stage.interviewerRole}</span>
            <span className="flex items-center gap-1.5">難度 <DifficultyDots level={stage.difficulty} /></span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stage.questionTypes.map(q => (
              <span key={q} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">{q}</span>
            ))}
          </div>
          <div className="space-y-1">
            {stage.prepTips.map((tip, i) => (
              <div key={i} className="flex gap-2 text-xs text-slate-600">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  flow: InterviewFlow
  companyName?: string
  roleTitle?: string
}

export default function InterviewFlowTimeline({ flow, companyName, roleTitle }: Props) {
  return (
    <div className="space-y-4">
      {flow.source.isInferred && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>以下流程為根據相似公司推測，<strong>非真實回報資料</strong>，僅供參考。</p>
        </div>
      )}
      {(companyName || roleTitle) && (
        <div className="text-sm text-slate-500">
          {companyName && <span className="font-medium text-slate-700">{companyName}</span>}
          {companyName && roleTitle && ' · '}
          {roleTitle && <span>{roleTitle}</span>}
          <span className="ml-2">面試流程（{flow.stages.length} 關卡）</span>
        </div>
      )}
      <div className="space-y-0">
        {flow.stages.map((stage, i) => (
          <StageCard key={stage.order} stage={stage} isLast={i === flow.stages.length - 1} />
        ))}
      </div>
    </div>
  )
}
