'use client'
import { useState } from 'react'
import { notFound } from 'next/navigation'
import { getRoleBySlug, getFlowsForRole, getCompanyBySlug, companies } from '@/lib/mock-data'
import SkillBadge from '@/components/skill-badge'
import InterviewFlowTimeline from '@/components/interview-flow-timeline'
import ConfidenceIndicator from '@/components/confidence-indicator'
import PreparationChecklist from '@/components/preparation-checklist'
import { BookOpen, Code2, Brain, Users, BarChart2 } from 'lucide-react'
import BackButton from '@/components/back-button'
import SetTargetButton from '@/components/set-target-button'

const categoryLabel: Record<string, string> = {
  engineering: '工程', data: '資料', ai: 'AI/ML', product: '產品', design: '設計', hardware: '硬體', semiconductor: '半導體', security: '資安', qa: 'QA',
}

const questionCategories = [
  { icon: <Code2 className="w-4 h-4" />, title: '技術題', desc: '資料結構、演算法、語言特性' },
  { icon: <Brain className="w-4 h-4" />, title: 'System Design', desc: '大型系統架構、可擴展性設計' },
  { icon: <Users className="w-4 h-4" />, title: '行為題', desc: 'STAR 格式、衝突處理、領導力' },
  { icon: <BarChart2 className="w-4 h-4" />, title: 'Case Study', desc: '業務情境分析、決策思維' },
]

const resources = [
  { title: 'LeetCode 刷題路線', url: '#', tag: '必備' },
  { title: 'System Design Primer', url: '#', tag: '必備' },
  { title: 'Tech Interview Handbook', url: '#', tag: '推薦' },
  { title: 'Blind 台灣工程師討論', url: '#', tag: '情報' },
]

export default function RolePreparationPage({ params }: { params: { roleSlug: string } }) {
  const role = getRoleBySlug(params.roleSlug)
  if (!role) notFound()

  const flows = getFlowsForRole(params.roleSlug)
  const availableCompanies = companies.filter(c => c.commonRoles.includes(params.roleSlug))
  const [selectedCompany, setSelectedCompany] = useState(flows[0]?.companySlug ?? '')
  const activeFlow = flows.find(f => f.companySlug === selectedCompany) ?? flows[0]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3">
        <BackButton />
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500">{role.titleZh}</span>
      </div>

      {/* Role header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md font-medium">{categoryLabel[role.category]}</span>
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">準備指南</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-slate-900">{role.titleZh}</h1>
        <p className="text-slate-500">{role.description}</p>
      </div>

      {/* Skills */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">技能要求</h2>
        <div>
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">必備技能</p>
          <div className="flex flex-wrap gap-2">
            {role.requiredSkills.map(s => <SkillBadge key={s} skill={s} variant="required" />)}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">加分技能</p>
          <div className="flex flex-wrap gap-2">
            {role.niceToHaveSkills.map(s => <SkillBadge key={s} skill={s} variant="nice" />)}
          </div>
        </div>
      </div>

      {/* Interview flow with company selector */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">各公司面試流程</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">選擇公司</label>
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {flows.map(f => {
                const c = getCompanyBySlug(f.companySlug)
                return <option key={f.companySlug} value={f.companySlug}>{c?.name ?? f.companySlug}</option>
              })}
              {availableCompanies.filter(c => !flows.find(f => f.companySlug === c.slug)).map(c => (
                <option key={c.slug} value={c.slug}>{c.name}（暫無資料）</option>
              ))}
            </select>
          </div>
        </div>
        {activeFlow ? (
          <>
            <ConfidenceIndicator
              count={activeFlow.source.count}
              hasUserReports={activeFlow.source.hasUserReports}
              isInferred={activeFlow.source.isInferred}
              lastUpdated={activeFlow.source.lastUpdated}
              reliabilityNote={activeFlow.source.reliabilityNote}
            />
            <InterviewFlowTimeline
              flow={activeFlow}
              companyName={getCompanyBySlug(activeFlow.companySlug)?.name}
              roleTitle={role.titleZh}
            />
            <SetTargetButton companySlug={activeFlow.companySlug} roleSlug={params.roleSlug} />
          </>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
            目前尚無此組合的面試資料，以下為根據相似職缺推測的準備方向。
          </div>
        )}
      </div>

      {/* Question categories */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">面試題型分類</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {questionCategories.map(q => (
            <div key={q.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">{q.icon}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{q.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{q.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">準備 Checklist</h2>
        <PreparationChecklist />
      </div>

      {/* Resources */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">推薦準備資源</h2>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {resources.map(r => (
            <div key={r.title} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.tag === '必備' ? 'bg-red-100 text-red-600' : r.tag === '推薦' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>{r.tag}</span>
                <span className="text-sm text-slate-700">{r.title}</span>
              </div>
              <span className="text-xs text-slate-400">→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
