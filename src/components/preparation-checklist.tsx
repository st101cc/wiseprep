'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckSquare, Square } from 'lucide-react'

interface ChecklistSection {
  title: string
  items: string[]
}

const defaultSections: ChecklistSection[] = [
  {
    title: '技術準備',
    items: ['複習資料結構與演算法', '練習 LeetCode Medium 題型', '準備 System Design 框架', '複習公司技術棧相關知識'],
  },
  {
    title: '行為面試',
    items: ['準備 5 個 STAR 格式情境故事', '準備「最大挑戰」案例', '準備「職涯目標」說法', '練習 2 分鐘自我介紹'],
  },
  {
    title: '公司研究',
    items: ['了解公司主要產品與業務', '研究公司工程部落格', '查詢 Glassdoor/Blind 面試心得', '準備 3–5 個問公司的問題'],
  },
  {
    title: '面試當天',
    items: ['確認面試時間與連線方式', '測試視訊設備與網路', '準備紙筆（可能需要手寫）', '提早 15 分鐘進入準備狀態'],
  },
]

export default function PreparationChecklist({ sections = defaultSections }: { sections?: ChecklistSection[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const toggle = (key: string) => setChecked(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })
  const total = sections.reduce((sum, s) => sum + s.items.length, 0)
  const done = checked.size
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{done}/{total} 項完成</span>
        <div className="w-32 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>
      {sections.map(section => (
        <div key={section.title} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">{section.title}</h4>
          {section.items.map(item => {
            const key = `${section.title}::${item}`
            const isChecked = checked.has(key)
            return (
              <button key={item} onClick={() => toggle(key)}
                className="w-full flex items-center gap-2.5 text-left text-sm py-1 group">
                {isChecked
                  ? <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  : <Square className="w-4 h-4 text-slate-300 flex-shrink-0 group-hover:text-slate-400" />}
                <span className={cn(isChecked ? 'line-through text-slate-400' : 'text-slate-700')}>{item}</span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
