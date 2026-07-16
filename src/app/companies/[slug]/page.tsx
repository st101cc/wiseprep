'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCompanyBySlug, getFlowsForCompany, getInterviewFlow, roles } from '@/lib/mock-data'
import InterviewFlowTimeline from '@/components/interview-flow-timeline'
import ConfidenceIndicator from '@/components/confidence-indicator'
import SetTargetButton from '@/components/set-target-button'
import BackButton from '@/components/back-button'
import { MapPin, ArrowRight, Building2, Globe, CalendarDays } from 'lucide-react'

const typeLabel: Record<string, string> = {
  foreign: '外商', startup: '新創', listed: '上市櫃', semiconductor: '半導體'
}

export default function CompanyDetailPage({ params }: { params: { slug: string } }) {
  const company = getCompanyBySlug(params.slug)
  if (!company) notFound()

  const flows = getFlowsForCompany(params.slug)
  const [activeRoleSlug, setActiveRoleSlug] = useState(
    flows[0]?.roleSlug ?? company.commonRoles[0] ?? ''
  )

  const activeFlow = getInterviewFlow(params.slug, activeRoleSlug)
  const activeRole = roles.find(r => r.slug === activeRoleSlug)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3">
        <BackButton label="公司列表" />
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500">{company.name}</span>
      </div>

      {/* Company header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">{company.name}</h1>
              <p className="text-slate-500">{company.nameEn}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg font-medium">
            {typeLabel[company.companyType]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{company.location.join(' · ')}</span>
          {company.founded && <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />成立於 {company.founded}</span>}
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 hover:underline">
              <Globe className="w-4 h-4" />官方網站
            </a>
          )}
          <span>{company.interviewDataCount} 份面試資料</span>
        </div>
      </div>

      {/* Role tabs + actions */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* All roles as tabs */}
          <div className="flex gap-2 overflow-x-auto flex-1">
            {company.commonRoles.map(rs => {
              const r = roles.find(role => role.slug === rs)
              const hasFlow = flows.some(f => f.roleSlug === rs)
              return (
                <button key={rs}
                  onClick={() => setActiveRoleSlug(rs)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors ${
                    rs === activeRoleSlug
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}>
                  {r?.titleZh ?? rs}
                  {!hasFlow && <span className="ml-1.5 text-xs opacity-60">（暫無資料）</span>}
                </button>
              )
            })}
          </div>

          {/* Actions anchored to the right of the tab row */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <SetTargetButton companySlug={company.slug} roleSlug={activeRoleSlug} />
            <Link href={`/roles/${activeRoleSlug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              準備頁 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Flow content */}
        {activeFlow ? (
          <>
            <ConfidenceIndicator
              count={activeFlow.source.count}
              hasUserReports={activeFlow.source.hasUserReports}
              isInferred={activeFlow.source.isInferred}
              lastUpdated={activeFlow.source.lastUpdated}
            />
            <InterviewFlowTimeline
              flow={activeFlow}
              companyName={company.name}
              roleTitle={activeRole?.titleZh}
            />
          </>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800 text-sm text-center">
            目前尚無「{company.name} × {activeRole?.titleZh ?? activeRoleSlug}」的面試資料。
            <span className="block mt-1 text-amber-600">可前往準備頁查看通用準備方向。</span>
          </div>
        )}
      </div>
    </div>
  )
}
