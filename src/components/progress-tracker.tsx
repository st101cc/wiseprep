'use client'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

interface Stage { name: string; completed: boolean }
interface Props { stages: Stage[]; onToggle?: (index: number) => void }

export default function ProgressTracker({ stages, onToggle }: Props) {
  const done = stages.filter(s => s.completed).length
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
        <span>{done}/{stages.length} 關卡完成</span>
        <span className="font-medium text-indigo-600">{Math.round((done / stages.length) * 100)}%</span>
      </div>
      {stages.map((stage, i) => (
        <button key={i} onClick={() => onToggle?.(i)}
          className={cn('w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
            stage.completed ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100 hover:bg-slate-100')}>
          {stage.completed
            ? <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            : <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />}
          <span className={cn('text-sm', stage.completed ? 'text-indigo-700 font-medium' : 'text-slate-600')}>{stage.name}</span>
        </button>
      ))}
    </div>
  )
}
