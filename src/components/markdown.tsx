import { parseBlocks, parseInline } from '@/lib/markdown'
import { cn } from '@/lib/utils'

// Renders LLM Markdown as React elements (never raw HTML), so model output can't inject markup.
function Text({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((p, i) =>
        p.t === 'b' ? <strong key={i} className="font-semibold text-slate-900">{p.v}</strong>
          : p.t === 'code' ? <code key={i} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[0.85em] text-indigo-700">{p.v}</code>
            : <span key={i}>{p.v}</span>)}
    </>
  )
}

export default function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('text-sm text-slate-700 leading-relaxed space-y-2', className)}>
      {parseBlocks(content).map((b, i) => {
        if (b.k === 'hr') return <hr key={i} className="my-4 border-slate-200" />
        if (b.k === 'h') return b.level <= 2
          ? <h3 key={i} className="pt-3 first:pt-0 pb-1 border-b border-slate-100 font-display text-base font-semibold text-indigo-700"><Text text={b.text} /></h3>
          : <h4 key={i} className="pt-2 font-semibold text-slate-900"><Text text={b.text} /></h4>
        if (b.k === 'li') return (
          <div key={i} className="flex gap-2 whitespace-pre-line" style={{ marginLeft: `${b.indent * 1.25}rem` }}>
            <span className={cn('flex-shrink-0 select-none', b.ordered ? 'text-slate-500 tabular-nums' : 'text-indigo-400')}>{b.marker}</span>
            <span className="min-w-0"><Text text={b.text} /></span>
          </div>
        )
        return <p key={i} className="whitespace-pre-line"><Text text={b.text} /></p>
      })}
    </div>
  )
}
