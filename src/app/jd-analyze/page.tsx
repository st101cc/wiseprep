'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FileSearch, Sparkles, Building2, Plus, Check } from 'lucide-react'
import BackButton from '@/components/back-button'
import { roles, companies } from '@/lib/mock-data'
import { useTargets } from '@/lib/use-targets'

interface AnalysisResult {
  role: typeof roles[number]
  matchScore: number
  matchedRequired: string[]
  missingRequired: string[]
  matchedNice: string[]
  companies: typeof companies
}

function analyzeJD(text: string): AnalysisResult | null {
  const hay = text.toLowerCase()
  const has = (skill: string) => hay.includes(skill.toLowerCase())

  // Score every role by how many of its skills appear in the JD
  const scored = roles.map(role => {
    const matchedRequired = role.requiredSkills.filter(has)
    const matchedNice = role.niceToHaveSkills.filter(has)
    const score = matchedRequired.length * 2 + matchedNice.length
    return { role, matchedRequired, matchedNice, score }
  }).sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best || best.score === 0) return null

  // Companies that hire this role, with ones named in the JD floated to the top
  const namedFirst = companies
    .filter(c => c.commonRoles.includes(best.role.slug))
    .sort((a, b) => {
      const aNamed = has(a.name) || has(a.nameEn) ? 1 : 0
      const bNamed = has(b.name) || has(b.nameEn) ? 1 : 0
      return bNamed - aNamed
    })

  return {
    role: best.role,
    matchScore: Math.min(99, Math.round((best.matchedRequired.length / Math.max(1, best.role.requiredSkills.length)) * 100)),
    matchedRequired: best.matchedRequired,
    missingRequired: best.role.requiredSkills.filter(s => !best.matchedRequired.includes(s)),
    matchedNice: best.matchedNice,
    companies: namedFirst,
  }
}

export default function JDAnalyzePage() {
  const [jd, setJd] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [noMatch, setNoMatch] = useState(false)
  const { isTarget, addTarget } = useTargets()

  const handleAnalyze = () => {
    if (jd.trim().length <= 20) return
    const r = analyzeJD(jd)
    setResult(r)
    setNoMatch(r === null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <BackButton />
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">職缺 JD 分析</h1>
        <p className="text-slate-500 mt-2">貼上職缺描述，系統會比對技能關鍵字，找出最相符的職缺類型與招募此職缺的公司。</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">貼上職缺描述（JD）</label>
        <textarea
          rows={10}
          value={jd}
          onChange={e => { setJd(e.target.value); setResult(null); setNoMatch(false) }}
          placeholder="將 Job Description 全文貼於此處…（包含技能需求效果最佳）"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
        />
        <button onClick={handleAnalyze}
          disabled={jd.trim().length <= 20}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors">
          <Sparkles className="w-4 h-4" /> 分析 JD
        </button>
      </div>

      {noMatch && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
          無法從這段 JD 比對到已知技能關鍵字。試著貼上包含技術技能（如 React、Python、System Design）的完整職缺描述。
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* Matched role */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileSearch className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-indigo-800">{result.role.titleZh} · {result.role.title}</p>
                <p className="text-xs text-indigo-600 mt-0.5">技能符合度 {result.matchScore}% · 根據關鍵字比對</p>
              </div>
            </div>
            <Link href={`/roles/${result.role.slug}`}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
              查看準備指南 →
            </Link>
          </div>

          {/* Skills */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="font-semibold text-slate-800">技能比對</h3>
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium uppercase">JD 中出現的必備技能（{result.matchedRequired.length}/{result.role.requiredSkills.length}）</p>
              <div className="flex flex-wrap gap-2">
                {result.matchedRequired.length > 0
                  ? result.matchedRequired.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs rounded-md font-medium">✓ {s}</span>
                  ))
                  : <span className="text-xs text-slate-400">未比對到</span>}
              </div>
            </div>
            {result.missingRequired.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase">此職缺常見、但 JD 未提及的技能</p>
                <div className="flex flex-wrap gap-2">
                  {result.missingRequired.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-white text-slate-500 border border-slate-200 text-xs rounded-md">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {result.matchedNice.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase">加分技能</p>
                <div className="flex flex-wrap gap-2">
                  {result.matchedNice.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs rounded-md">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Companies hiring this role */}
          {result.companies.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="font-semibold text-slate-800">招募此職缺的公司</h3>
              <p className="text-xs text-slate-500">點「加入目標」即可在準備進度頁追蹤這個公司 × 職缺組合。</p>
              <div className="divide-y divide-slate-100">
                {result.companies.map(c => {
                  const added = isTarget(c.slug, result.role.slug)
                  return (
                    <div key={c.slug} className="flex items-center justify-between gap-3 py-3">
                      <Link href={`/companies/${c.slug}`} className="flex items-center gap-3 group min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 truncate">{c.name}</p>
                          <p className="text-xs text-slate-400 truncate">{c.location.join(' · ')} · {c.interviewDataCount} 筆面試資料</p>
                        </div>
                      </Link>
                      <button onClick={() => addTarget(c.slug, result.role.slug)} disabled={added}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex-shrink-0 ${
                          added
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                        }`}>
                        {added ? <><Check className="w-3.5 h-3.5" /> 已加入</> : <><Plus className="w-3.5 h-3.5" /> 加入目標</>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
