'use client'
import { useEffect, useState } from 'react'
import { Wallet, Calculator, Copy, Check, ExternalLink, Lock } from 'lucide-react'
import type { Compensation } from '@/lib/types'
import { negotiationNumbers, formatTWD, type CurrentComp } from '@/lib/compensation'
import { cn } from '@/lib/utils'
import { saveLocal } from '@/lib/cloud-state'

const KEY = 'wiseprep_current_comp' as const

function pct(n: number, max: number) {
  return `${Math.min(100, (n / max) * 100)}%`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}
      className="text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0"
      aria-label="複製">
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

export default function CompensationCard({ comp, companyName, roleTitle }: { comp: Compensation; companyName: string; roleTitle: string }) {
  const { marketBand: m, targetBand: t } = comp
  const scaleMax = m.p90 * 1.15

  const [cur, setCur] = useState<CurrentComp>({ monthlyBase: 0, months: 14, bonus: 0 })
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s) setCur(JSON.parse(s))
    } catch {}
  }, [])
  const update = (field: keyof CurrentComp, value: string) => {
    const next = { ...cur, [field]: Number(value) || 0 }
    setCur(next)
    saveLocal(KEY, next)
  }

  const hasInput = cur.monthlyBase > 0 && cur.months > 0
  const n = hasInput ? negotiationNumbers(cur, t) : null
  const raise = n ? Math.round((n.target / n.currentTotal - 1) * 100) : 0

  const scripts = n ? [
    {
      title: '被問到目前薪資',
      zh: `我目前的總薪酬大約是 ${formatTWD(n.currentTotal)}，包含 ${cur.months} 個月本薪${cur.bonus ? `與績效獎金` : ''}。`,
      en: `My current total package is about ${formatTWD(n.currentTotal)}, including ${cur.months} months of base${cur.bonus ? ' plus a performance bonus' : ''}.`,
    },
    {
      title: '被問到期望薪資',
      zh: `以 ${roleTitle} 這個職位的職級與範圍來看，我期望的年總薪酬在 ${formatTWD(n.target)} 到 ${formatTWD(n.ask)} 之間，本薪與獎金的比例可以彈性討論。`,
      en: `For this ${roleTitle} role, I'm targeting a total package of ${formatTWD(n.target)}–${formatTWD(n.ask)}. I'm flexible on the base/bonus split.`,
    },
    {
      title: '還不想先給數字（只用一次）',
      zh: `我想先多了解這個職位的職級與工作範圍，如果彼此合適，我相信薪資可以談到雙方都滿意的水準。`,
      en: `I'd like to understand the level and scope first — if it's the right fit, I'm confident we can land on something fair.`,
    },
  ] : []

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Benchmark */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-indigo-600" />
          <h2 className="font-display font-semibold text-slate-900">薪資行情</h2>
          <span className="text-xs text-slate-400">更新於 {comp.lastUpdated}</span>
        </div>

        <div className="space-y-2">
          <div className="relative h-8 rounded-lg bg-slate-100">
            <div className="absolute inset-y-0 rounded-lg bg-indigo-100"
              style={{ left: pct(m.p25, scaleMax), width: `calc(${pct(m.p90, scaleMax)} - ${pct(m.p25, scaleMax)})` }} />
            <div className="absolute inset-y-1.5 rounded bg-emerald-400/70"
              style={{ left: pct(t.low, scaleMax), width: `calc(${pct(t.high, scaleMax)} - ${pct(t.low, scaleMax)})` }} />
            {([['P25', m.p25], ['P50', m.p50], ['P75', m.p75], ['P90', m.p90]] as const).map(([label, v]) => (
              <div key={label} className="absolute inset-y-0 w-px bg-indigo-400" style={{ left: pct(v, scaleMax) }} />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
            {([['P25', m.p25], ['P50', m.p50], ['P75', m.p75], ['P90', m.p90]] as const).map(([label, v]) => (
              <div key={label}><span className="font-medium text-slate-700">{label}</span> {formatTWD(v)}</div>
            ))}
          </div>
          <p className="text-xs text-slate-400">{m.label}</p>
          <p className="text-sm text-emerald-700">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-400/70 mr-1.5 align-middle" />
            建議目標區間 {formatTWD(t.low)}–{formatTWD(t.high)}
            <span className="block text-xs text-amber-600 mt-0.5">{t.note}</span>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-slate-700 mb-1.5">薪酬結構</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">{comp.structure.map(s => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-1.5">HR 電話要問的</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">{comp.askRecruiter.map(s => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>
      </div>

      {/* Calculator */}
      <div className="border-t border-slate-100 pt-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Calculator className="w-5 h-5 text-indigo-600" />
          <h2 className="font-display font-semibold text-slate-900">我的薪資提案</h2>
          <span className="flex items-center gap-1 text-xs text-slate-400"><Lock className="w-3 h-3" />登入後同步到你的帳號</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          {([
            ['monthlyBase', '目前月薪 (NT$)'],
            ['months', '保障月數'],
            ['bonus', '年度獎金 (NT$)'],
          ] as const).map(([field, label]) => (
            <label key={field} className="space-y-1">
              <span className="text-xs text-slate-500">{label}</span>
              <input type="number" min={0} inputMode="numeric"
                value={cur[field] || ''}
                onChange={e => update(field, e.target.value)}
                className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </label>
          ))}
        </div>

        {n ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                ['目前總薪酬', n.currentTotal, 'text-slate-700 bg-slate-50'],
                ['底線 (walk-away)', n.walkAway, 'text-amber-700 bg-amber-50'],
                ['目標', n.target, 'text-emerald-700 bg-emerald-50'],
                ['開價', n.ask, 'text-indigo-700 bg-indigo-50'],
              ] as const).map(([label, v, cls]) => (
                <div key={label} className={cn('rounded-lg p-3', cls)}>
                  <p className="text-xs opacity-80">{label}</p>
                  <p className="text-lg font-semibold">{formatTWD(v)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              目標比目前總薪酬 {raise >= 0 ? '+' : ''}{raise}%。底線 = max(目前 +15%, 目標區間下緣 90%)；目標 = max(目前 +25%, 區間中位)；開價 = 目標 +10%。這是經驗法則，不是 {companyName} 公布的數字。
            </p>
            <div className="space-y-3">
              {scripts.map(s => (
                <div key={s.title} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <p className="text-sm font-medium text-slate-700">{s.title}</p>
                  {[s.zh, s.en].map(line => (
                    <div key={line} className="flex items-start justify-between gap-3 text-sm text-slate-600">
                      <p>{line}</p><CopyButton text={line} />
                    </div>
                  ))}
                </div>
              ))}
              <p className="text-xs text-slate-500">說完數字就停下來，讓對方先回應。被要求提供薪資單時請如實提供，不要灌水。</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">輸入目前月薪與保障月數，即可算出底線、目標與開價，並產生 HR 電話話術。</p>
        )}
      </div>

      {/* Sources */}
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-medium text-slate-500 mb-1.5">資料來源</p>
        <ul className="space-y-1">
          {comp.sources.map(s => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                {s.title}<ExternalLink className="w-3 h-3" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
