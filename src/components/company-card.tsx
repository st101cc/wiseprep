import Link from 'next/link'
import { Company } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MapPin, BarChart2, Clock, ChevronRight } from 'lucide-react'
import { roles } from '@/lib/mock-data'

const industryLabel: Record<string, { label: string; color: string }> = {
  software: { label: '軟體', color: 'bg-blue-100 text-blue-700' },
  semiconductor: { label: '半導體', color: 'bg-violet-100 text-violet-700' },
  ecommerce: { label: '電商', color: 'bg-orange-100 text-orange-700' },
  fintech: { label: 'FinTech', color: 'bg-green-100 text-green-700' },
  ai: { label: 'AI', color: 'bg-pink-100 text-pink-700' },
  hardware: { label: '硬體', color: 'bg-slate-100 text-slate-700' },
  consulting: { label: '顧問', color: 'bg-teal-100 text-teal-700' },
}

export default function CompanyCard({ company }: { company: Company }) {
  const industry = industryLabel[company.industry]
  const roleLabels = company.commonRoles.slice(0, 3).map(slug => roles.find(r => r.slug === slug)?.titleZh ?? slug)
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{company.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{company.nameEn}</p>
        </div>
        <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0', industry.color)}>{industry.label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {roleLabels.map(r => (
          <span key={r} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-md">{r}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{company.location.join(' / ')}</span>
        <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" />{company.interviewDataCount} 份面試資料</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />更新 {company.lastUpdated}</span>
      </div>
      <div className="flex items-center justify-end">
        <Link href={`/companies/${company.slug}`}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
          開始準備 <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
