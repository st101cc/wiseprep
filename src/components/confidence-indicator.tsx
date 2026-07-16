import { Users, BookOpen, Clock } from 'lucide-react'

interface ConfidenceIndicatorProps {
  count: number
  hasUserReports: boolean
  isInferred: boolean
  lastUpdated: string
}

// Honestly signals where this flow's data came from. Until real /report
// submissions are promoted into interview-flows.json, every flow is editorial —
// compiled from public sources, NOT user-reported. Never label editorial data
// as "人回報".
export default function ConfidenceIndicator({ count, hasUserReports, isInferred, lastUpdated }: ConfidenceIndicatorProps) {
  return (
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
  )
}
