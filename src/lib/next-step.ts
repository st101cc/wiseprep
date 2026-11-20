// Server-only: builds the "what should I do next" prompt and calls an
// OpenAI-compatible chat endpoint configured via LLM_* env vars.
import { getCompanyBySlug, getRoleBySlug, getInterviewFlow } from './mock-data'
import { negotiationNumbers, formatTWD, type CurrentComp } from './compensation'
import type { TargetEntry } from './use-targets'

export interface NextStepInput {
  background: string
  targets: TargetEntry[]
  currentComp?: CurrentComp | null
}

const SYSTEM = `你是資深科技業職涯教練，熟悉台灣與外商的面試流程與薪資談判。
用繁體中文回答，具體、可執行、附日期。只根據提供的資料推論；資料是推估或不足時要明說，不要捏造公司內部流程。`

export function buildPrompt({ background, targets, currentComp }: NextStepInput, today: string): string {
  const parts: string[] = [`今天日期：${today}`]

  parts.push(`## 我的背景\n${background.trim() ? background.trim().slice(0, 8000) : '（尚未填寫，請提醒我到「我的檔案」補上履歷）'}`)

  if (currentComp && currentComp.monthlyBase > 0) {
    const total = currentComp.monthlyBase * currentComp.months + currentComp.bonus
    parts.push(`## 目前薪資\n月薪 ${currentComp.monthlyBase} × ${currentComp.months} 個月 + 獎金 ${currentComp.bonus}，年總薪酬約 ${formatTWD(total)}`)
  }

  parts.push(...describeTargets(targets, currentComp))

  parts.push(`請依下列格式回答：
## 目前狀態
（每個目標一句話：在哪一關、離下一關還有幾天）
## 接下來 7 天行動
（依優先序 3–6 項，每項附建議日期與預估時間，盡量對應我的背景與經驗）
## 技能落差
（比對我的背景與職缺必備技能，列出最大的 2–3 個落差與補強方式）
## 薪資談判提醒
（若有薪資資料：HR 電話怎麼回答、要問什麼；沒有就略過）`)

  return parts.join('\n\n')
}

export function buildCvPrompt({ background, targets }: NextStepInput): string {
  const parts = [`## 我的履歷\n${background.trim().slice(0, 12000)}`, ...describeTargets(targets, null)]
  parts.push(`請針對我的履歷做分析，依下列格式回答：
## 履歷定位
（2–3 句：我目前最有說服力的職涯定位與年資）
## 與目標職缺的匹配度
（每個目標：匹配分數 /10、最強的 2 個對應點、最大的 2 個缺口；沒有目標就根據履歷推薦 2–3 種適合的職缺類型）
## 應該放大的亮點
（履歷中最值得在面試強調的 3 個經歷，說明為什麼，並建議用什麼量化數字呈現）
## 履歷修改建議
（3–5 條具體修改：引用原句 → 建議改寫，優先處理缺少量化成果、與目標職缺關鍵字不符的地方）
## 面試官可能追問
（根據履歷內容，最可能被深問的 5 題，附一句回答方向）`)
  return parts.join('\n\n')
}

function describeTargets(targets: TargetEntry[], currentComp: CurrentComp | null | undefined): string[] {
  const parts: string[] = []
  if (!targets.length) parts.push('## 目標職缺\n（尚未加入任何目標）')
  for (const t of targets) {
    const company = getCompanyBySlug(t.companySlug)
    const role = getRoleBySlug(t.roleSlug)
    const flow = getInterviewFlow(t.companySlug, t.roleSlug)
    const lines = [`## 目標：${company?.nameEn ?? t.companySlug}（${company?.name ?? ''}）— ${role?.title ?? t.roleSlug}`]
    if (role) lines.push(`必備技能：${role.requiredSkills.join('、')}；加分：${role.niceToHaveSkills.join('、')}`)
    if (t.interviewDate) lines.push(`面試日期：${t.interviewDate}`)
    if (t.nextRoundDate) lines.push(`下一關預計：${t.nextRoundDate}`)
    if (flow) {
      lines.push(`面試流程（${flow.source.isInferred ? '推估，非官方' : '使用者回報'}）：`)
      flow.stages.forEach((s, i) => {
        lines.push(`${t.stageCompletions[i] ? '✅' : '⬜'} ${s.order}. ${s.nameZh}（${s.estimatedDuration}，題型：${s.questionTypes.join('、')}）準備：${s.prepTips.join('；')}`)
      })
      const c = flow.compensation
      if (c) {
        lines.push(`薪資行情：${c.marketBand.label}；P50 ${formatTWD(c.marketBand.p50)}、P75 ${formatTWD(c.marketBand.p75)}、P90 ${formatTWD(c.marketBand.p90)}；建議目標 ${formatTWD(c.targetBand.low)}–${formatTWD(c.targetBand.high)}（${c.targetBand.note}）`)
        if (currentComp && currentComp.monthlyBase > 0) {
          const n = negotiationNumbers(currentComp, c.targetBand)
          lines.push(`試算：底線 ${formatTWD(n.walkAway)}、目標 ${formatTWD(n.target)}、開價 ${formatTWD(n.ask)}`)
        }
      }
    }
    parts.push(lines.join('\n'))
  }
  return parts
}

const RETRYABLE = new Set([429, 500, 502, 503, 504])

export async function callLLM(prompt: string): Promise<{ content: string; model: string }> {
  const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL, LLM_FALLBACK_MODEL } = process.env
  if (!LLM_BASE_URL || !LLM_API_KEY || !LLM_MODEL) throw new Error('LLM 未設定：請檢查 .env.local 的 LLM_BASE_URL / LLM_API_KEY / LLM_MODEL')

  const url = `${LLM_BASE_URL.replace(/\/?$/, '/')}chat/completions`
  const models = [LLM_MODEL, LLM_FALLBACK_MODEL].filter((m): m is string => !!m)
  let lastError = ''

  for (const model of models) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${LLM_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(90_000),
      })
      const body = await res.text()
      if (res.ok) {
        const content = JSON.parse(body).choices?.[0]?.message?.content
        if (content) return { content, model }
        lastError = `${model}: 空回應`
        continue
      }
      lastError = `${model}: HTTP ${res.status}`
      if (!RETRYABLE.has(res.status)) break
    } catch (e) {
      lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`
    }
  }
  throw new Error(lastError.includes('429') ? `已達免費額度上限，請稍後再試（${lastError}）` : `模型暫時無法使用（${lastError}）`)
}
