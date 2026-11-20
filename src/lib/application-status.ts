export type ApplicationStatus =
  | 'wishlist' | 'applied' | 'screening' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn'

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: '想投遞',
  applied: '已投遞',
  screening: '履歷篩選',
  interviewing: '面試中',
  offer: '錄取',
  rejected: '未錄取',
  withdrawn: '已撤回',
}

export const APPLICATION_STATUSES = Object.keys(STATUS_LABELS) as ApplicationStatus[]

// Targets stored before statuses existed (or with an unknown value) count as 想投遞.
export function statusOf(entry: { status?: string }): ApplicationStatus {
  return APPLICATION_STATUSES.find(s => s === entry.status) ?? 'wishlist'
}

// 'YYYY-MM-DD' -> 'M/D'; null if missing or malformed. Parsed as text so no timezone shift.
export function formatStatusDate(date?: string): string | null {
  const m = date?.match(/^\d{4}-(\d{2})-(\d{2})$/)
  return m ? `${Number(m[1])}/${Number(m[2])}` : null
}
