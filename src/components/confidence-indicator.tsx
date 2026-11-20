import { Users, BookOpen, Clock, AlertTriangle } from 'lucide-react'

interface ConfidenceIndicatorProps {
  count: number
  hasUserReports: boolean
  isInferred: boolean
  lastUpdated: string
  reliabilityNote?: string
}

// Fewer user reports than this always gets a caveat, even if the curator wrote none.
const MIN_RELIABLE_REPORTS = 3

// Honestly signals where this flow's data came from. Until real /report
// submissions are promoted into interview-flows.json, every flow is editorial —
// compiled from public sources, NOT user-reported. Never label editorial data
// as "人回報".
export default function ConfidenceIndicator({ count, hasUserReports, isInferred, lastUpdated, reliabilityNote }: ConfidenceIndicatorProps) {
  const caveat = reliabilityNote ||
    (hasUserReports && count < MIN_RELIABLE_REPORTS ? `僅 ${count} 筆匿名回報，尚未經多方驗證，請當作參考。` : '')
  return (
    <div className="space-y-2">
    <div className="flex items-center gap-3 text-sm text-slate-500">
      {hasUserReports ? (
        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{count} 筆使用者回報</span>
      ) : (
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          {isInferred ? '參考公開資訊推測整理' : '編輯整理自公開資訊'}
        </span>
      )}
      <span className="text-slate-300">·</span>
      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />更新於 {lastUpdated}</span>
    </div>
    {caveat && (
      <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />{caveat}
      </p>
    )}
    </div>
  )
}
