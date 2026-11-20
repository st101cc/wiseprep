// Tiny Markdown parser for LLM output: headings, ---, bullet/numbered lists
// (nesting by indent), paragraphs, **bold** and `code`.
// ponytail: covers what our prompts produce; swap in react-markdown if we ever need tables or links.

export type Inline = { t: 'text' | 'b' | 'code'; v: string }

export type Block =
  | { k: 'h'; level: 1 | 2 | 3; text: string }
  | { k: 'hr' }
  | { k: 'li'; ordered: boolean; marker: string; indent: number; text: string }
  | { k: 'p'; text: string }

export function parseInline(s: string): Inline[] {
  return s.split(/(\*\*[^*]+\*\*|`[^`]+`)/).filter(Boolean).map(part =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? { t: 'b', v: part.slice(2, -2) }
      : part.startsWith('`') && part.endsWith('`') && part.length > 2 ? { t: 'code', v: part.slice(1, -1) }
        : { t: 'text', v: part })
}

export function parseBlocks(md: string): Block[] {
  const out: Block[] = []
  for (const raw of md.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/\s+$/, '')
    const prev = out[out.length - 1]
    if (!line.trim()) { out.push({ k: 'p', text: '' }); continue } // blank = break; empty paragraphs dropped below
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/)
    if (h) { out.push({ k: 'h', level: Math.min(h[1].length, 3) as 1 | 2 | 3, text: h[2] }); continue }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { out.push({ k: 'hr' }); continue }
    const li = line.match(/^(\s*)([*+-]|\d+[.)])\s+(.*)$/)
    if (li) {
      const ordered = /\d/.test(li[2])
      out.push({ k: 'li', ordered, marker: ordered ? li[2].replace(')', '.') : '•', indent: Math.min(Math.floor(li[1].replace(/\t/g, '  ').length / 2), 3), text: li[3] })
      continue
    }
    // Indented text right after a list item continues that item; otherwise it extends the paragraph.
    if (prev?.k === 'li' && /^\s+/.test(raw)) { prev.text += '\n' + line.trim(); continue }
    if (prev?.k === 'p' && prev.text) { prev.text += '\n' + line.trim(); continue }
    out.push({ k: 'p', text: line.trim() })
  }
  return out.filter(b => b.k !== 'p' || b.text)
}
