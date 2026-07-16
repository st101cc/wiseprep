import { cn } from '@/lib/utils'

interface SkillBadgeProps {
  skill: string
  variant?: 'required' | 'nice'
}

export default function SkillBadge({ skill, variant = 'required' }: SkillBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
      variant === 'required'
        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
        : 'bg-white text-slate-600 border border-slate-200'
    )}>
      {skill}
    </span>
  )
}
