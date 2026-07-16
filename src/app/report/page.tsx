'use client'
import { useState } from 'react'
import { companies, roles } from '@/lib/mock-data'
import { Plus, Trash2, ShieldCheck, Download } from 'lucide-react'
import BackButton from '@/components/back-button'
import { supabase } from '@/lib/supabase'

const seniority = ['Intern', 'New Grad', 'Junior', 'Mid', 'Senior', 'Manager']
const offerStatus = ['是', '否', 'Pending']

interface Stage {
  name: string
  duration: string
  difficulty: string
}

export default function ReportPage() {
  const [companySlug, setCompanySlug] = useState('')
  const [roleSlug, setRoleSlug] = useState('')
  const [level, setLevel] = useState('')
  const [month, setMonth] = useState('')
  const [stages, setStages] = useState<Stage[]>([{ name: '', duration: '', difficulty: '3' }])
  const [offer, setOffer] = useState('')
  const [remote, setRemote] = useState(false)
  const [tips, setTips] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [reportCount, setReportCount] = useState(0)

  const addStage = () => setStages(p => [...p, { name: '', duration: '', difficulty: '3' }])
  const removeStage = (i: number) => setStages(p => p.filter((_, idx) => idx !== i))
  const updateStage = (i: number, key: keyof Stage, val: string) =>
    setStages(p => p.map((s, idx) => idx === i ? { ...s, [key]: val } : s))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const report = { companySlug, roleSlug, level, month, stages, offer, remote, tips, submittedAt: new Date().toISOString() }

    if (supabase) {
      await supabase.from('reports').insert({
        company_slug: companySlug,
        role_slug: roleSlug,
        level,
        interview_month: month,
        stages,
        offer,
        remote,
        tips: tips || null,
      })
    }

    // Always save to localStorage as local backup
    try {
      const existing = JSON.parse(localStorage.getItem('wiseprep_reports') ?? '[]')
      const updated = [...existing, report]
      localStorage.setItem('wiseprep_reports', JSON.stringify(updated))
      setReportCount(updated.length)
    } catch {
      setReportCount(1)
    }
    setSubmitted(true)
  }

  const resetForm = () => {
    setCompanySlug(''); setRoleSlug(''); setLevel(''); setMonth('')
    setStages([{ name: '', duration: '', difficulty: '3' }])
    setOffer(''); setRemote(false); setTips('')
    setSubmitted(false)
  }

  // Export collected reports so they can be converted into draft interview flows
  // via `npm run reports:to-flows -- <file>`. Bridges localStorage -> repo data.
  const exportReports = () => {
    try {
      const data = localStorage.getItem('wiseprep_reports') ?? '[]'
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'wiseprep-reports.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900">感謝你的回報！</h2>
        <p className="text-slate-500">你的匿名面試經驗將幫助其他求職者更好地準備。資料審核後將納入資料庫。</p>
        {reportCount > 0 && (
          <p className="text-sm text-indigo-600">你已在此裝置累積回報 {reportCount} 筆面試經驗 🙌</p>
        )}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button onClick={resetForm} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">再回報一筆</button>
          {reportCount > 0 && (
            <button onClick={exportReports}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              <Download className="w-4 h-4" /> 匯出回報資料
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">匯出的 JSON 可透過 <code className="px-1 py-0.5 bg-slate-100 rounded">npm run reports:to-flows</code> 轉成待審面試流程草稿。</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <BackButton />
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">匿名回報面試流程</h1>
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>完全匿名，不蒐集任何個人資訊。你的回報將幫助台灣求職者更精準地準備面試。</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">公司</label>
          <select value={companySlug} onChange={e => setCompanySlug(e.target.value)} required
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700">
            <option value="">請從清單選擇公司…</option>
            {companies.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">職缺類型</label>
          <select value={roleSlug} onChange={e => setRoleSlug(e.target.value)} required
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700">
            <option value="">請從清單選擇職缺類型…</option>
            {roles.map(r => <option key={r.slug} value={r.slug}>{r.titleZh} · {r.title}</option>)}
          </select>
        </div>

        {/* Seniority */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">年資層級</label>
          <select value={level} onChange={e => setLevel(e.target.value)} required
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700">
            <option value="">請選擇…</option>
            {seniority.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Month */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">面試月份</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} required
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700" />
        </div>

        {/* Stages */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">面試關卡</label>
          {stages.map((stage, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">關卡 {i + 1}</span>
                {stages.length > 1 && (
                  <button type="button" onClick={() => removeStage(i)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input placeholder="關卡名稱（如：技術面試）" value={stage.name} onChange={e => updateStage(i, 'name', e.target.value)}
                  className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                <input placeholder="時長（如：60分）" value={stage.duration} onChange={e => updateStage(i, 'duration', e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-500">難度</label>
                <div className="flex gap-2">
                  {['1', '2', '3', '4', '5'].map(v => (
                    <button key={v} type="button" onClick={() => updateStage(i, 'difficulty', v)}
                      className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${stage.difficulty === v ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addStage}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            <Plus className="w-4 h-4" /> 新增關卡
          </button>
        </div>

        {/* Offer */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">是否拿到 Offer？</label>
          <div className="flex gap-2">
            {offerStatus.map(s => (
              <button key={s} type="button" onClick={() => setOffer(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${offer === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Remote */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setRemote(!remote)}
            className={`w-10 h-6 rounded-full transition-colors ${remote ? 'bg-indigo-600' : 'bg-slate-200'} flex items-center`}>
            <div className={`w-4 h-4 rounded-full bg-white m-1 transition-transform ${remote ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
          <label className="text-sm text-slate-700">遠端面試</label>
        </div>

        {/* Tips */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">準備建議 <span className="text-slate-400 font-normal">（選填）</span></label>
          <textarea rows={4} value={tips} onChange={e => setTips(e.target.value)} placeholder="分享你的準備心得與建議…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
        </div>

        <button type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition-colors">
          匿名送出
        </button>
        <p className="text-xs text-center text-slate-400">送出後資料將進行匿名化處理，無法追蹤至個人。</p>
      </form>
    </div>
  )
}
